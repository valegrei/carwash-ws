const {response} = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const {Op, where} = require('sequelize');

/**
 * Obtiene lista de usuarios segun fecha de ultima sincronizacion
 * Solo el usuario con Rol de Administrador tiene el permiso
 */
const getUsuarios = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo usuarios`);

    let idAuthUsu = req.auth.data.idUsuario;
    const Usuario = require('../models/usuario.model');
    //verificamos si el usuario solicitante tiene el Rol de Administrador
    let authUsu = await Usuario.findOne({where:{id:idAuthUsu, idTipoUsuario: 1, estado: true}});
    if(!authUsu){
        //No es usuario administrador
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.query,{
        lastSincro: 'required|date',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`lastSincro faltante`);
        return;
    }

    let lastSincro = req.query.lastSincro;


    let usuarios = await Usuario.findAll({
        attributes: [
            'id', 'correo', 'nombres', 'apellidoPaterno', 'apellidoMaterno', 
            'razonSocial', 'nroDocumento', 'distAct', 'estado', 'idTipoUsuario', 
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
        attributes: [
            'id', 'correo', 'nombres', 'apellidoPaterno', 'apellidoMaterno', 
            'razonSocial', 'nroDocumento', 'distAct', 'estado', 'idTipoUsuario', 
            'idTipoDocumento', 'createdAt', 'updatedAt'
        ],
        where:{ id: idUsuario }
    });

    if(!usuario){
        //vacio
        response(res,HttpStatus.NOT_FOUND,`Usuario no encontrado.`);
        return;
    }else{
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
        response(res,HttpStatus.OK,`Usuario actualizado`,{usuario: usuario});
        return;
    }
};

/**
 * Deshabilita usuario del sistema (estado = false)
 * Solo el usuario de Rol Administrador esta autorizado para hacerlo 
 */
const deshabilitarUsuario = async (req, res) => {
    logger.info(`${req.method} ${req.originalurl}, Deshabilitando usuario`);
    
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
    const Usuario = require('../models/usuario.model');
    //verificamos si el usuario solicitante tiene el Rol de Administrador
    let authUsu = await Usuario.findOne({where:{id:idAuthUsu, idTipoUsuario: 1, estado: true}});
    if(!authUsu){
        //No es usuario administrador
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //procedemos a deshabilitar usuario
    await Usuario.update({ estado: false }, {where: {id: idUsuario, estado: true }});

    response(res, HttpStatus.OK, `Usuario deshabilitado`);
};

/**
 * Habilita usuario del sistema (estado = true)
 * Solo el usuario de Rol Administrador esta autorizado para hacerlo 
 */
 const habilitarUsuario = async (req, res) => {
    logger.info(`${req.method} ${req.originalurl}, Habilitando usuario`);
    
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
    const Usuario = require('../models/usuario.model');
    //verificamos si el usuario solicitante tiene el Rol de Administrador
    let authUsu = await Usuario.findOne({where:{id:idAuthUsu, idTipoUsuario: 1, estado: true}});
    if(!authUsu){
        //No es usuario administrador
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //procedemos a deshabilitar usuario
    await Usuario.update({ estado: true }, {where: {id: idUsuario, estado: false }});

    response(res, HttpStatus.OK, `Usuario habilitado`);
};

/**
 * Cambia el Rol del usuario
 * Solo el usuario de Rol Administrador esta autorizado para hacerlo 
 */
 const cambiarTipoUsuario = async (req, res) => {
    logger.info(`${req.method} ${req.originalurl}, Habilitando usuario`);
    
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
    const Usuario = require('../models/usuario.model');
    //verificamos si el usuario solicitante tiene el Rol de Administrador
    let authUsu = await Usuario.findOne({where:{id:idAuthUsu, idTipoUsuario: 1, estado: true}});
    if(!authUsu){
        //No es usuario administrador
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    validator = new Validator(req.body,{
        idTipoUsuario: 'required|integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`idTipoUsuario faltante`);
        return;
    }

    let idTipoUsuario = req.body.idTipoUsuario;
    //procedemos a deshabilitar usuario
    await Usuario.update({ idTipoUsuario: idTipoUsuario }, {where: {id: idUsuario, estado: true }});

    response(res, HttpStatus.OK, `Usuario actualizado`);
};

/**
 * Cambia el Rol del usuario
 * Solo el usuario de Rol Administrador esta autorizado para hacerlo 
 */
 const habilitarUsuarioDistribuidor = async (req, res) => {
    logger.info(`${req.method} ${req.originalurl}, Habilitando distribuidor`);
    
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
    const Usuario = require('../models/usuario.model');
    //verificamos si el usuario solicitante tiene el Rol de Administrador
    let authUsu = await Usuario.findOne({where:{id:idAuthUsu, idTipoUsuario: 1, estado: true}});
    if(!authUsu){
        //No es usuario administrador
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //procedemos a habilitar distribuidor
    await Usuario.update({ distAct: true }, {where: {id: idUsuario, idTipoUsuario: 3, estado: true }});

    response(res, HttpStatus.OK, `Distribuidor habilitado`);
};

module.exports = {getUsuarios, getUsuario, updateUsuario, deshabilitarUsuario, habilitarUsuario, cambiarTipoUsuario,habilitarUsuarioDistribuidor};