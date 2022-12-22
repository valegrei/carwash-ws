const {response} = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const {Op} = require('sequelize');
const fs = require('fs-extra');
const uploadFolder = 'uploads/images/anuncios/';
const pathStr = '/files/images/anuncios/';
const {
    enviarCorreo, 
    contentNotifDistribActivado, 
    contentNotifAdminRegistrado,
    verifyConfig,
    contentTest,
} = require('../util/mail');
const {generarCodigo, sha256} = require('../util/utils');

const verificarAdmin = async (req,res) => {
    const idAuthUsu = req.auth.data.idUsuario;
    const {Usuario} = require('../models/usuario.model');
    //verificamos si el usuario solicitante tiene el Rol de Administrador
    const authUsu = await Usuario.findOne({where:{id:idAuthUsu, idTipoUsuario: 1, estado: 1}});
    if(!authUsu){
        //No es usuario administrador
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return null;
    }
    return authUsu;
}


/**
 * Obtiene lista de parametros segun fecha de ultima sincronizacion
 * Solo el usuario con Rol de Administrador tiene el permiso
 */
 const getParametros = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo parametros`);

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
    const {Parametro} = require('../models/parametro.model');

    let parametros = await Parametro.findAll({
        attributes: ['clave', 'valor', 'idTipo'],
        where:{
            [Op.or]:[
                {createdAt: { [Op.gt]: lastSincro }},
                {updatedAt: { [Op.gt]: lastSincro }}
            ]
        }
    });
    
    if(!parametros.length){
        //vacio
        response(res,HttpStatus.NOT_FOUND,`No hay parametros.`);
    }else{
        response(res,HttpStatus.OK,`Parametros encontrados`,{parametros: parametros});
    }
};


/**
 * Obtiene lista de parametros segun fecha de ultima sincronizacion
 * Solo el usuario con Rol de Administrador tiene el permiso
 */
 const actualizarParametros = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, actualizando parametros`);

    await verificarAdmin(req,res);

    //Validamos
    let validator = new Validator(req.body,{
        'params.*.clave': 'required|string',
        'params.*.valor': 'required|string',
        'params.*.idTipo': 'required|integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`datos erroneos`);
        return;
    }

    try{
        const {Parametro} = require('../models/parametro.model');
        let params = req.body.params;
        params = params.map(e => e.updatedAt = Date.now());
    
        await Parametro.bulkCreate(params,{
            updateOnDuplicate: ['valor', 'updatedAt']
        });
        
        response(res,HttpStatus.OK,`Parametros actualizados`);
    }catch(error){
        logger.error(error);
        response(res,HttpStatus.INTERNAL_SERVER_ERROR,`Error al actualizar parametros`);
    }
};

/**
 * Obtiene lista de parametros segun fecha de ultima sincronizacion
 * Solo el usuario con Rol de Administrador tiene el permiso
 */
 const actualizarParametrosSMTP = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, actualizando parametros SMTP`);

    await verificarAdmin(req,res);

    //Validamos
    let validator = new Validator(req.body,{
        'host': 'required|string',
        'port': 'required|string',
        'secure': 'required|integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`datos faltantes`);
        return;
    }

    try{
        const {host, port, secure} = req.body;

        if(await verifyConfig(host, parseInt(port), parseInt(secure)!=0)){
            const {Parametro} = require('../models/parametro.model');
            const updatedAt = Date.now();

            await Parametro.bulkCreate([
                {clave: 'EMAIL_HOST', valor: host, idTipo: 1, updatedAt: updatedAt},
                {clave: 'EMAIL_PORT', valor: port, idTipo: 1, updatedAt: updatedAt},
                {clave: 'EMAIL_SSL_TLS', valor: secure, idTipo: 1, updatedAt: updatedAt},
            ],{
                updateOnDuplicate: ['valor','updatedAt']
            });
            
            response(res,HttpStatus.OK,`Parametros SMTP actualizados`);
        }else{
            response(res,HttpStatus.UNPROCESABLE_ENTITY,`Parametros de SMTP no validos`);
        }
    }catch(error){
        logger.error(error);
        response(res,HttpStatus.INTERNAL_SERVER_ERROR,`Error al actualizar parametros SMTP`);
    }
};


/**
 * Obtiene lista de parametros segun fecha de ultima sincronizacion
 * Solo el usuario con Rol de Administrador tiene el permiso
 */
 const actualizarParametrosCorreo = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, actualizando parametros correo`);

    await verificarAdmin(req,res);

    //Validamos
    let validator = new Validator(req.body,{
        'address': 'required|string',
        'pass': 'required|string',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`datos faltantes`);
        return;
    }

    try{
        const {address, pass} = req.body;
        const {Parametro} = require('../models/parametro.model');
        const updatedAt = Date.now();

        await Parametro.bulkCreate([
            {clave: 'EMAIL_ADDR', valor: address, idTipo: 1, updatedAt: updatedAt},
            {clave: 'EMAIL_PASS', valor: pass, idTipo: 1, updatedAt: updatedAt},
        ],{
            updateOnDuplicate: ['valor','updatedAt']
        });

        response(res,HttpStatus.OK,`Parametros Correo actualizados`);
    }catch(error){
        logger.error(error);
        response(res,HttpStatus.INTERNAL_SERVER_ERROR,`Error al actualizar parametros correo`);
    }
};


/**
 * Se prueba el correo
 * Solo el usuario con Rol de Administrador tiene el permiso
 */
 const probarCorreo = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, probando correo`);

    const adminUsu = await verificarAdmin(req,res);

    try{
        const {correo} = adminUsu;
        const content = contentTest();
        enviarCorreo(correo,content.subject, content.body)

        response(res,HttpStatus.OK,`Se envio correo de prueba`);
    }catch(error){
        logger.error(error);
        response(res,HttpStatus.INTERNAL_SERVER_ERROR,`Error al probar correo`);
    }
};

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

        const oldEstado = usuario.estado
        
        if(req.body.idTipoUsuario != null){
            usuario.idTipoUsuario = req.body.idTipoUsuario;
        }
        if(req.body.idTipoDocumento != null){
            usuario.idTipoDocumento = req.body.idTipoDocumento;
        }
        if(req.body.nroDocumento != null){
            usuario.nroDocumento = req.body.nroDocumento;
        }
        if(req.body.estado != null){
            usuario.estado = req.body.estado;
        }

        await usuario.save();

        if(oldEstado==2 && usuario.estado==1){
            //Si se activa distribuidor
            const content = contentNotifDistribActivado(usuario.razonSocial, usuario.nroDocumento);
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

    let {filename} = req.file;

    const data = {
        descripcion: req.body.descripcion,
        url: req.body.url,
        path: pathStr+filename,
    };
    try{
        const Anuncio = require('../models/anuncio.model');
        let anuncio = await Anuncio.create(data);
        await moverImagen(req.file);
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
    getParametros,
    actualizarParametros,
    actualizarParametrosCorreo,
    actualizarParametrosSMTP,
    probarCorreo,
};