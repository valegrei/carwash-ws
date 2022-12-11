const {response} = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const {Op, where} = require('sequelize');
const fs = require('fs-extra');
const uploadFolder = 'uploads/images/anuncios/';
const pathStr = '/files/images/anuncios/';

const verificarAdmin = async (req,res) => {
    let idAuthUsu = req.auth.data.idUsuario;
    const Usuario = require('../models/usuario.model');
    //verificamos si el usuario solicitante tiene el Rol de Administrador
    let authUsu = await Usuario.findOne({where:{id:idAuthUsu, idTipoUsuario: 1, estado: true}});
    if(!authUsu){
        //No es usuario administrador
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }
}

/**
 * Obtiene lista de usuarios segun fecha de ultima sincronizacion
 * Solo el usuario con Rol de Administrador tiene el permiso
 */
const getUsuarios = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo usuarios`);

    await verificarAdmin(req,res);

    //Validamos
    let validator = new Validator(req.query,{
        lastSincro: 'required|date',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`lastSincro faltante`);
        return;
    }

    let lastSincro = req.query.lastSincro;
    const Usuario = require('../models/usuario.model');

    let usuarios = await Usuario.findAll({
        attributes: [
            'id', 'correo', 'nombres', 'apellidoPaterno', 'apellidoMaterno', 
            'razonSocial', 'nroDocumento', 'nroCel1','nroCel2', 'distAct', 'estado', "verificado", 'idTipoUsuario', 
            'idTipoDocumento', 'createdAt', 'updatedAt'
        ],
        where:{
            [Op.or]:[
                {createdAt: { [Op.gt]: lastSincro }},
                {updatedAt: { [Op.gt]: lastSincro }}
            ]
        }
    });
    
    if(!usuarios.length){
        //vacio
        response(res,HttpStatus.NOT_FOUND,`No hay usuarios.`);
        return;
    }else{
        response(res,HttpStatus.OK,`Usuarios encontrados`,{usuarios: usuarios});
        return;
    }
};

/**
 * Deshabilita usuario del sistema (estado = false)
 * Solo el usuario de Rol Administrador esta autorizado para hacerlo 
 */
const modificarUsuario = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, actualizando usuario`);
    
    await verificarAdmin(req,res);

    //Validamos Id
    let validator = new Validator(req.params,{
        id: 'required|integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`id faltante`);
        return;
    }

    //validamos contenido
    validator = new Validator(req.body,{
        idTipoUsuario: 'integer',
        idTipoDocumento: 'integer',
        nroDocumento: 'integer',
        distAct: 'boolean',
        estado: 'boolean',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`datos erroneos`);
        return;
    }

    let idUsuario = req.params.id;
    let data = {}
    if(req.body.idTipoUsuario != null){
        data.idTipoUsuario = req.body.idTipoUsuario;
    }
    if(req.body.idTipoDocumento != null){
        data.idTipoDocumento = req.body.idTipoDocumento;
    }
    if(req.body.nroDocumento != null){
        data.nroDocumento = req.body.nroDocumento;
    }
    if(req.body.distAct != null){
        data.distAct = req.body.distAct;
    }
    if(req.body.estado != null){
        data.estado = req.body.estado;
    }

    const Usuario = require('../models/usuario.model');

    //procedemos a deshabilitar usuario
    await Usuario.update(data, {where: {id: idUsuario}});

    response(res, HttpStatus.OK, `Usuario deshabilitado`);
};

const obtenerAnuncios = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo anuncios`);

    await verificarAdmin(req,res);

    //Validamos
    let validator = new Validator(req.query,{
        lastSincro: 'required|date',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`lastSincro faltante`);
        return;
    }

    let lastSincro = req.query.lastSincro;

    const Anuncio = require('../models/anuncio.model');
    const Archivo = require('../models/archivo.model');
    const anuncios = await Anuncio.findAll({
        include: {
            model: Archivo,
            attributes: ['path']
        },
        where: {
            [Op.or]:[
                {createdAt: { [Op.gt]: lastSincro }},
                {updatedAt: { [Op.gt]: lastSincro }}
            ]
        }
    })

    if(!anuncios.length){
        //vacio
        response(res,HttpStatus.NOT_FOUND,`No hay anuncios.`);
        return;
    }else{
        response(res,HttpStatus.OK,`Anuncios encontrados`,{anuncios: anuncios});
        return;
    }
};

const crearAnuncio = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, Creando anuncio`);

    await verificarAdmin(req,res);

    if(!req.file){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Falta imagen`);
        return;
    }

    //Validamos
    let validator = new Validator(req.body,{
        descripcion: 'string',
        url: 'url',
    });
    if(validator.fails()){
        eliminarFotoTmp(req.file);
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Faltan datos`);
        return;
    }

    const data = {
        descripcion: req.body.descripcion,
        url: req.body.url
    };
    try{
        data.idArchivo = await guardarImagen(req.file);
        const Anuncio = require('../models/anuncio.model');
    
        let anuncio = await Anuncio.create(data);
        response(res,HttpStatus.OK,`Anuncio guardado: ${anuncio.id}`);
    }catch(error){
        response(res,HttpStatus.INTERNAL_SERVER_ERROR,`Error al guardar anuncio`);
    }
};

const actualizarAnuncio = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Actualizando anuncio`);

    await verificarAdmin(req,res);

    //Validamos idAnuncio
    let validator = new Validator(req.params,{
        id: 'required|integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Falta id de anuncio`);
        return;
    }

    //Validamos datos
    validator = new Validator(req.body,{
        descripcion: 'string',
        url: 'url',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Faltan datos`);
        return;
    }

    const idAnuncio = req.params.id;
    const data = {
        descripcion: req.body.descripcion,
        url: req.body.url
    };
    try{
        const Anuncio = require('../models/anuncio.model');
    
        await Anuncio.update(data, {where:{id: idAnuncio}});
        response(res,HttpStatus.OK,`Anuncio actualizado`);
    }catch(error){
        response(res,HttpStatus.INTERNAL_SERVER_ERROR,`Error al actualizar anuncio`);
    }
};

const eliminarAnuncio = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Eliminando anuncios`);

    await verificarAdmin(req,res);
    
    //Validamos datos
    validator = new Validator(req.body,{
        ids: 'array',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Faltan ids de anuncios`);
        return;
    }

    const ids = req.body.ids;
    try{
        const Anuncio = require('../models/anuncio.model');
        await Anuncio.update({estado: false}, {
            where:{
                id: {[Op.in]: ids}
            }
        });
        response(res,HttpStatus.OK,`Anuncios eliminados`);
    }catch(error){
        logger.error(error);
        response(res,HttpStatus.INTERNAL_SERVER_ERROR,`Error al eliminar anuncios`);
    }
}


const eliminarFotoTmp = async (file) => {
    if(!file) return;
    try{
        await fs.remove(destination + filename);
    }catch(error){
        logger.error(error);
    }
}

const guardarImagen = async (file) => {
    if(!file) return;

    let {filename, destination} = file;
    
    try{
        //inserta archivo
        const Archivo = require('../models/archivo.model');
        let archivo = await Archivo.create({path: pathStr+filename})

        //mueve el archivo
        await fs.move(destination + filename, uploadFolder + filename);
        return archivo.id;
    }catch(error){
        logger.error(error);
        return null;
    }
};

module.exports = {getUsuarios,modificarUsuario,obtenerAnuncios, crearAnuncio, actualizarAnuncio, eliminarAnuncio};