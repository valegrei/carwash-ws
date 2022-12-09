const {response} = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const fs = require('fs-extra');
const {QueryTypes } = require('sequelize'); 
const uploadFolder = 'uploads/images/';
const {queryDesactivarFotos} = require('../models/queries');

/**
 * Obtiene datos del mismo usuario que lo solicita
 */
const getUsuario = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, obteniendo usuario`);
    //Validamos
    let validator = new Validator(req.params,{
        id: 'required|integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if(idAuthUsu!= idUsuario){
        response(res,HttpStatus.UNAUTHORIZED,`Solo puede consultar por el mismo id`);
        return;
    }

    const Usuario = require('../models/usuario.model');
    const Archivo = require('../models/archivo.model');

    let usuario = await Usuario.findOne({
        include:{
            model: Archivo,
            attributes: ['nombre']
        },
        where:{id: idUsuario, estado: true}
    });

    if(!usuario){
        //vacio
        response(res,HttpStatus.NOT_FOUND,`Usuario no encontrado.`);
        return;
    }else{
        usuario.clave = null;

        response(res,HttpStatus.OK,`Usuario encontrado`,{usuario: usuario});
        return;
    }
};

/**
 * Actualiza datos personales del mismo usuario solicitante
 */
const updateUsuario = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, actualizando usuario`);
    
    //Validamos Id
    let validator = new Validator(req.params,{
        id: 'required|integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`id faltante`);
        return;
    }
    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if(idAuthUsu!= idUsuario){
        eliminarFotoTmp(req.file);
        response(res,HttpStatus.UNAUTHORIZED,`Solo puede modificar por el mismo id`);
        return;
    }

    //Validamos datos ingresados
    validator = new Validator(req.body, {
        nombres: 'string',
        apellidoPaterno: 'string',
        apellidoMaterno: 'string',
        razonSocial: 'string',
        nroDocumento: 'numeric',
        nroCel1: 'string',
        nroCel2: 'string',
        idTipoDocumento: 'required|integer',
    });
    if(validator.fails()){
        eliminarFotoTmp(req.file);
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Datos no válidos o incompletos.`);
        return;
    }

    //procede a actualizar
    let data = {
        nombres: req.body.nombres,
        apellidoPaterno: req.body.apellidoPaterno,
        apellidoMaterno: req.body.apellidoMaterno,
        razonSocial: req.body.razonSocial,
        nroDocumento: req.body.nroDocumento,
        nroCel1: req.body.nroCel1,
        nroCel2: req.body.nroCel2,
        idTipoDocumento: req.body.idTipoDocumento
    };

    const Usuario = require('../models/usuario.model');
    const Archivo = require('../models/archivo.model');
    await Usuario.update(data,{where:{id: idUsuario, estado: true}});
    //guarda foto
    await guardarFoto(idUsuario, req.file);
    //obtiene usuario actualizado

    const usuario = await Usuario.findOne({
        include:{
            model: Archivo,
            attributes: ['nombre']
        },
        where:{id: idUsuario, estado: true}
    });

    if(!usuario){
        //vacio
        response(res,HttpStatus.NOT_FOUND,`Usuario no encontrado.`);
        return;
    }else{
        usuario.clave = null;
        response(res,HttpStatus.OK,`Usuario actualizado`,{usuario: usuario});
        return;
    }
};

const eliminarFotoTmp = async (file) => {
    if(!file) return;
    try{
        await fs.remove(destination + filename);
    }catch(error){
        logger.error(error);
    }
}

const guardarFoto = async (idUsuario, file) => {
    if(!file) return;

    let {filename, destination} = file;
    
    try{
        //desactiva archivos de perfil anteriores
        const db = require('../models');
        await db.sequelize.query(
            queryDesactivarFotos,
            {
                replacements: { idUsuario: idUsuario},
                type: QueryTypes.UPDATE
            }
        );
    
        //inserta archivo
        const Archivo = require('../models/archivo.model');
        let archivo = await Archivo.create({nombre: filename})
        
        //actualiza usuario
        let {id} = archivo;
        const Usuario = require('../models/usuario.model');
        logger.info(`archivo: ${id}, usuario: ${idUsuario}`);
        await Usuario.update({idArchivoFoto: id}, {where: {id: idUsuario}});

        //mueve el archivo
        await fs.move(destination + filename, uploadFolder + filename);
    }catch(error){
        logger.error(error);
    }
};

module.exports = {getUsuario, updateUsuario};