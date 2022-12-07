const {response} = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const fs = require('fs-extra');
const db = require('../models');
const uploadFolder = 'uploads/images/';

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
    let usuario = await Usuario.findOne({
        where:{ id: idUsuario }
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
    await Usuario.update(data,{where:{id: idUsuario, estado: true}});
    let usuario = await Usuario.findOne({where:{id: idUsuario, estado: true}});
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

const subirFoto = async (req, res)=> {
    logger.info(`${req.method} ${req.originalUrl}, subiendo foto de usuario`);
    
    //Validamos Id
    let validator = new Validator(req.params,{
        id: 'required|integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`id faltante`);
        return;
    }

    if(!req.file){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`No se subió archivo`);
        return;
    }

    let {filename, destination} = req.file;
    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    
    try{
        if(idAuthUsu!= idUsuario){
            //Elimina temporal
            await fs.remove(destination + filename);
            response(res,HttpStatus.UNAUTHORIZED,`Solo puede modificar por el mismo id`);
            return;
        }

        //desactiva archivos de perfil anteriores
        await db.sequelize.query(`
            UPDATE archivos
            INNER JOIN usuarios ON archivos.id = usuarios.idArchivoFoto
            SET archivos.estado = 0
            WHERE usuarios.id = ${idUsuario} ANd archivos.estado = 1
        `);
    
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
        response(res,HttpStatus.OK,`Foto de usuario actualizado`);
        return;
    }
    catch(error){
        logger.error(error);
        response(res,HttpStatus.INTERNAL_SERVER_ERROR,`Error interno al guardar archivo.`);
        return;
    }
};

module.exports = {getUsuario, updateUsuario, subirFoto};