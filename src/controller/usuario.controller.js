const {response} = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const {generarCodigo, sha256} = require('../util/utils');
const { Op } = require('sequelize');
/*const fs = require('fs-extra');
const uploadFolder = 'uploads/images/profile/';
const pathStr = '/files/images/profile/';*/

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

    const {Usuario} = require('../models/usuario.model');

    let usuario = await Usuario.findOne({
        where:{id: idUsuario, estado: 1}
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

    const {Usuario} = require('../models/usuario.model');
    await Usuario.update(data,{where:{id: idUsuario, estado: 1}});

    //obtiene usuario actualizado
    const usuario = await Usuario.findOne({
        where:{id: idUsuario, estado: 1}
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
/**
 * Cambia la clave del usuario
 */
const cambiarPassword = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, cambiando clave de usuario`);
    
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
        claveAnterior: 'required|string',
        claveNueva: 'required|string',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Datos no válidos o incompletos.`);
        return;
    }
    try{
        const {Usuario} = require('../models/usuario.model');
        const usuario = await Usuario.findOne({
            where:{id: idUsuario, estado: 1}
        });

        const {claveAnterior, claveNueva} = req.body;

        if(usuario){
            if(usuario.clave == sha256(claveAnterior)){
                //procede a actualizar
                usuario.clave = sha256(claveNueva);
                await usuario.save();
                response(res,HttpStatus.OK,`Usuario actualizado`);
            }else{
                response(res,HttpStatus.UNPROCESABLE_ENTITY,`Clave anterior incorrecta.`);
            }
        }else{
            response(res,HttpStatus.NOT_FOUND,`Usuario no encontrado.`);
        }
    }catch(error){
        logger.error(error);
        response(res,HttpStatus.INTERNAL_SERVER_ERROR,`Error al cambiar clave.`);
    }
    
};


const obtenerDirecciones = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo direcciones`);

    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede acceder por el mismo id`);
        return;
    }

    validator = new Validator(req.query, {
        lastSincro: 'required|date',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `lastSincro faltante`);
        return;
    }

    let lastSincro = req.query.lastSincro;
    const Direccion = require('../models/direccion.model');

    let direcciones = await Direccion.findAll({
        attributes: ['id', 'departamento', 'provincia', 'distrito', 'ubigeo',
            'direccion', 'latitud', 'longitud', 'estado', 'idUsuario'],
        where: {
            [Op.or]: [
                { createdAt: { [Op.gt]: lastSincro } },
                { updatedAt: { [Op.gt]: lastSincro } }
            ],
            idUsuario: idUsuario,
        }
    });

    if (!direcciones.length) {
        //vacio
        response(res, HttpStatus.NOT_FOUND, `No hay direcciones.`);
    } else {
        response(res, HttpStatus.OK, `Direcciones encontrados`, { direcciones: direcciones });
    }
};

const agregarDireccion = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, creando direccion`);

    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede agregar por el mismo id`);
        return;
    }

    validator = new Validator(req.body, {
        'departamento': 'required|string',
        'provincia': 'required|string',
        'distrito': 'required|string',
        'ubigeo': 'required|string',
        'direccion': 'required|string',
        'latitud': 'required|string',
        'longitud': 'required|string',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `datos erroneos`);
        return;
    }

    try {
        const data = {
            departamento: req.body.departamento,
            provincia: req.body.provincia,
            distrito: req.body.distrito,
            ubigeo: req.body.ubigeo,
            direccion: req.body.direccion,
            latitud: req.body.latitud,
            longitud: req.body.longitud,
            idUsuario: idUsuario
        }
        const Direccion = require('../models/direccion.model');
        const nuevaDireccion = await Direccion.create(data);

        if (!nuevaDireccion) {
            response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al crear Direccion`);
        } else {
            response(res, HttpStatus.OK, `Direccion creada`);
        }
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al crear Direccion`);
    }
};


const modificarDireccion = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, modificando direccion`);

    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
        idDireccion: 'required|integer'
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede agregar por el mismo id`);
        return;
    }

    validator = new Validator(req.body, {
        'departamento': 'required|string',
        'provincia': 'required|string',
        'distrito': 'required|string',
        'ubigeo': 'required|string',
        'direccion': 'required|string',
        'latitud': 'required|string',
        'longitud': 'required|string',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `datos erroneos`);
        return;
    }

    try {
        const idDireccion = req.params.id;
        const data = {
            departamento: req.body.departamento,
            provincia: req.body.provincia,
            distrito: req.body.distrito,
            ubigeo: req.body.ubigeo,
            direccion: req.body.direccion,
            latitud: req.body.latitud,
            longitud: req.body.longitud,
        }
        const Direccion = require('../models/direccion.model');
        await Direccion.update(data, { where: { id: idDireccion } });
        response(res, HttpStatus.OK, `Direccion modificada`);

    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al modificar Direccion`);
    }
};


const eliminarDireccion = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Eliminando Direccion`);

    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
        idDireccion: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede eliminar por el mismo id`);
        return;
    }

    const idDireccion = req.params.idDireccion;
    try {
        const Direccion = require('../models/direccion.model');
        const HorarioConfig = require('../models/horario.config.model');
        await Direccion.update({ estado: false }, {
            where: {
                id: idDireccion
            }
        });
        // Tambien se anulan horarios relacionados
        await HorarioConfig.update({estado: false}, {
            where: {
                idLocal: idDireccion,
                estado: true
            }
        });
        //TODO anular tambien los horarios y reservas futuras generadas
        response(res, HttpStatus.OK, `Direccion eliminada`);
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al eliminar Direccion`);
    }
}
/*
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
        //inserta archivo
        const Archivo = require('../models/archivo.model');
        let archivo = await Archivo.create({path: pathStr + filename})
        
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
};*/

module.exports = {
    getUsuario, 
    updateUsuario, 
    cambiarPassword,
    obtenerDirecciones,
    agregarDireccion,
    modificarDireccion,
    eliminarDireccion,
};