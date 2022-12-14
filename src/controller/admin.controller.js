const {response} = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const {Op} = require('sequelize');
const fs = require('fs-extra');
const uploadFolder = 'uploads/images/anuncios/';
const pathStr = '/files/images/anuncios/';
const {enviarCorreo, contentNotifDistribActivado, contentNotifAdminRegistrado} = require('../util/mail');
const {generarCodigo, sha256} = require('../util/utils');

const verificarAdmin = async (req,res) => {
    let idAuthUsu = req.auth.data.idUsuario;
    const {Usuario} = require('../models/usuario.model');
    //verificamos si el usuario solicitante tiene el Rol de Administrador
    let authUsu = await Usuario.findOne({where:{id:idAuthUsu, idTipoUsuario: 1, estado: 1}});
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
    const {Usuario} = require('../models/usuario.model');

    let usuarios = await Usuario.findAll({
        attributes: [
            'id', 'correo', 'nombres', 'apellidoPaterno', 'apellidoMaterno', 
            'razonSocial', 'nroDocumento', 'nroCel1','nroCel2', 'estado', 'idTipoUsuario', 
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
 * Modifica usuario
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
        estado: 'integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`datos erroneos`);
        return;
    }

    let idUsuario = req.params.id;

    try{
        const {Usuario} = require('../models/usuario.model');

        const usuario = await Usuario.findByPk(idUsuario);

        const oldDistAct = usuario.distAct
        
        if(req.body.idTipoUsuario != null){
            usuario.idTipoUsuario = req.body.idTipoUsuario;
        }
        if(req.body.idTipoDocumento != null){
            usuario.idTipoDocumento = req.body.idTipoDocumento;
        }
        if(req.body.nroDocumento != null){
            usuario.nroDocumento = req.body.nroDocumento;
        }
        if(req.body.distAct != null){
            usuario.distAct = req.body.distAct;
        }
        if(req.body.estado != null){
            usuario.estado = req.body.estado;
        }

        await usuario.save();

        if(!oldDistAct && usuario.distAct){
            //Si se activa distribuidor
            const content = contentNotifDistribActivado();
            enviarCorreo(usuario.correo, content.subject, content.body);
        }

        response(res, HttpStatus.OK, `Usuario modificado`);
    }catch(error){
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al modificar usuario`);
    }
};


/**
 * Agrega un nuevo usuario Administrador
 * Solo el usuario de Rol Administrador esta autorizado para hacerlo 
 */
 const agregarAdmin = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, nuevo usuario administrador`);
    
    await verificarAdmin(req,res);

    //Validamos contenido
    let validator = new Validator(req.body,{
        correo: 'required|email',
        nombres: 'string',
        apellidoPaterno: 'string',
        apellidoMaterno: 'string'
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`datos erroneos`);
        return;
    }

    try{
        const {Usuario} = require('../models/usuario.model');
        const correo = req.body.correo;

        const usuExist = await Usuario.findOne({where: {correo: correo}});
        if(usuExist){
            if(usuExist.estado == 0){   //Inactivo(0)
                await usuExist.destroy();
            }else{
                response(res,HttpStatus.UNPROCESABLE_ENTITY,`Correo existente`);
                return;
            }
        }

        const clave = generarCodigo().toString();

        const data = {
            correo: correo,
            clave: sha256(clave),
            nombres: req.body.nombres,
            apellidoPaterno: req.body.apellidoPaterno,
            apellidoMaterno: req.body.apellidoMaterno,
            idTipoUsuario: 1,   //Admin
            idTipoDocumento: 1, //DNI
            estado: 1,  //Activo
        }

        const usuAdmin = await Usuario.create(data);

        if(usuAdmin){
            const content = contentNotifAdminRegistrado(usuAdmin.correo, clave);
            enviarCorreo(usuAdmin.correo, content.subject, content.body);
    
            response(res, HttpStatus.OK, `Administrador registrado`);
        }else{
            response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al crear administrador`);
        }

    }catch(error){
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al crear administrador`);
    }
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
    const anuncios = await Anuncio.findAll({
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
        url: req.body.url,
        path: pathStr+filename,
    };
    try{
        const Anuncio = require('../models/anuncio.model');
        let anuncio = await Anuncio.create(data);
        await moverImagen();
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

const moverImagen = async (file) => {
    if(!file) return;

    let {filename, destination} = file;
    
    try{
        //mueve el archivo
        await fs.move(destination + filename, uploadFolder + filename);
    }catch(error){
        logger.error(error);
        return null;
    }
};

module.exports = {
    getUsuarios,
    modificarUsuario,
    obtenerAnuncios,
    crearAnuncio, 
    actualizarAnuncio, 
    eliminarAnuncio,
    agregarAdmin,
};