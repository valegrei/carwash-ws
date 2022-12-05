const {response} = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const {Op, where} = require('sequelize');

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

    logger.info(`${req.method} ${req.originalUr}, obteniendo usuarios`);

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
            'razonSocial', 'nroDocumento', 'distAct', 'estado', "verificado", 'idTipoUsuario', 
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
    logger.info(`${req.method} ${req.originalurl}, actualizando usuario`);
    
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
    if(req.body.distAct != null){
        data.distAct = req.body.distAct;
    }
    if(req.body.estado != null){
        data.estado = req.body.estado;
    }

    logger.info(data);

    const Usuario = require('../models/usuario.model');

    //procedemos a deshabilitar usuario
    await Usuario.update(data, {where: {id: idUsuario}});

    response(res, HttpStatus.OK, `Usuario deshabilitado`);
};

/**
 * Habilita usuario del sistema (estado = true)
 * Solo el usuario de Rol Administrador esta autorizado para hacerlo 
 */
 /*const habilitarUsuario = async (req, res) => {
    logger.info(`${req.method} ${req.originalurl}, Habilitando usuario`);
    
    await verificarAdmin(req, res);
    
    //Validamos Id
    let validator = new Validator(req.params,{
        id: 'required|integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`id faltante`);
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

    let idUsuario = req.params.id;
    const Usuario = require('../models/usuario.model');

    //procedemos a deshabilitar usuario
    await Usuario.update({ estado: true }, {where: {id: idUsuario, estado: false }});

    response(res, HttpStatus.OK, `Usuario habilitado`);
};*/

/**
 * Cambia el Rol del usuario
 * Solo el usuario de Rol Administrador esta autorizado para hacerlo 
 */
 /*const cambiarTipoUsuario = async (req, res) => {
    logger.info(`${req.method} ${req.originalurl}, Habilitando usuario`);
    
    await verificarAdmin(req, res);

    //Validamos Id
    let validator = new Validator(req.params,{
        id: 'required|integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`id faltante`);
        return;
    }

    let idUsuario = req.params.id;
    const Usuario = require('../models/usuario.model');

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
};*/

/**
 * Da de alta a usuario distribuidor
 * Solo el usuario de Rol Administrador esta autorizado para hacerlo 
 */
 /*const darDeAltaDistribuidor = async (req, res) => {
    logger.info(`${req.method} ${req.originalurl}, Habilitando distribuidor`);
    
    await verificarAdmin(req, res);

    //Validamos Id
    let validator = new Validator(req.params,{
        id: 'required|integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`id faltante`);
        return;
    }

    let idUsuario = req.params.id;
    const Usuario = require('../models/usuario.model');

    //procedemos a habilitar distribuidor
    await Usuario.update({ distAct: true }, {where: {id: idUsuario, idTipoUsuario: 3, estado: true }});

    response(res, HttpStatus.OK, `Distribuidor habilitado`);
};*/

/**
 * Da de baja a usuario distribuidor
 * Solo el usuario de Rol Administrador esta autorizado para hacerlo 
 */
 /*const darDeBajaDistribuidor = async (req, res) => {
    logger.info(`${req.method} ${req.originalurl}, Habilitando distribuidor`);
    
    await verificarAdmin(req, res);

    //Validamos Id
    let validator = new Validator(req.params,{
        id: 'required|integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`id faltante`);
        return;
    }

    let idUsuario = req.params.id;
    const Usuario = require('../models/usuario.model');

    //procedemos a habilitar distribuidor
    await Usuario.update({ distAct: false }, {where: {id: idUsuario, idTipoUsuario: 3, estado: true }});

    response(res, HttpStatus.OK, `Distribuidor habilitado`);
};*/

module.exports = {getUsuarios, modificarUsuario};