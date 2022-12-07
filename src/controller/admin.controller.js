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

    logger.info(data);

    const Usuario = require('../models/usuario.model');

    //procedemos a deshabilitar usuario
    await Usuario.update(data, {where: {id: idUsuario}});

    response(res, HttpStatus.OK, `Usuario deshabilitado`);
};

module.exports = {getUsuarios, modificarUsuario};