const { response } = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const { Op } = require('sequelize');
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
const {
    enviarMensajeWhatsapp,
    mensajeNotifDistribActivado,
} = require('../util/whatsapp')
const { generarCodigo, sha256 } = require('../util/utils');

const verificarAdmin = async (req, res) => {
    const idAuthUsu = req.auth.data.idUsuario;
    const { Usuario } = require('../models/usuario.model');
    //verificamos si el usuario solicitante tiene el Rol de Administrador
    const authUsu = await Usuario.findOne({ where: { id: idAuthUsu, idTipoUsuario: 1, estado: 1 } });
    if (!authUsu) {
        //No es usuario administrador
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

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.query, {
        lastSincro: 'date',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `lastSincro faltante`);
        return;
    }

    let lastSincro = req.query.lastSincro;
    var where = {};
    if (lastSincro != null) {
        where = {
            [Op.or]: [
                { createdAt: { [Op.gt]: lastSincro } },
                { updatedAt: { [Op.gt]: lastSincro } }
            ]
        }
    } else {
        where = {
            estado: true
        }
    }
    const { Parametro } = require('../models/parametro.model');

    let parametros = await Parametro.findAll({
        attributes: ['clave', 'valor', 'idTipo'],
        where: where
    });

    if (!parametros.length) {
        //vacio
        response(res, HttpStatus.NOT_FOUND, `No hay parametros.`);
    } else {
        response(res, HttpStatus.OK, `Parametros encontrados`, { parametros: parametros });
    }
};


/**
 * Obtiene lista de parametros segun fecha de ultima sincronizacion
 * Solo el usuario con Rol de Administrador tiene el permiso
 */
const actualizarParametros = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, actualizando parametros`);

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.body, {
        'params.*.clave': 'required|string',
        'params.*.valor': 'required|string',
        'params.*.idTipo': 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `datos erroneos`);
        return;
    }

    try {
        const { Parametro } = require('../models/parametro.model');
        let params = req.body.params;
        params = params.map(e => e.updatedAt = Date.now());

        await Parametro.bulkCreate(params, {
            updateOnDuplicate: ['valor', 'updatedAt']
        });

        response(res, HttpStatus.OK, `Parametros actualizados`);
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al actualizar parametros`);
    }
};

/**
 * Obtiene lista de parametros segun fecha de ultima sincronizacion
 * Solo el usuario con Rol de Administrador tiene el permiso
 */
const actualizarParametrosSMTP = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, actualizando parametros SMTP`);

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.body, {
        'host': 'required|string',
        'port': 'required|string',
        'secure': 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `datos faltantes`);
        return;
    }

    try {
        const { host, port, secure } = req.body;

        if (await verifyConfig(host, parseInt(port), parseInt(secure) != 0)) {
            const { Parametro } = require('../models/parametro.model');
            const updatedAt = Date.now();

            await Parametro.bulkCreate([
                { clave: 'EMAIL_HOST', valor: host, idTipo: 1, updatedAt: updatedAt },
                { clave: 'EMAIL_PORT', valor: port, idTipo: 1, updatedAt: updatedAt },
                { clave: 'EMAIL_SSL_TLS', valor: secure, idTipo: 1, updatedAt: updatedAt },
            ], {
                updateOnDuplicate: ['valor', 'updatedAt']
            });

            response(res, HttpStatus.OK, `Parametros SMTP actualizados`);
        } else {
            response(res, HttpStatus.UNPROCESABLE_ENTITY, `Parametros de SMTP no validos`);
        }
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al actualizar parametros SMTP`);
    }
};


/**
 * Obtiene lista de parametros segun fecha de ultima sincronizacion
 * Solo el usuario con Rol de Administrador tiene el permiso
 */
const actualizarParametrosCorreo = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, actualizando parametros correo`);

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.body, {
        'address': 'required|string',
        'pass': 'required|string',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `datos faltantes`);
        return;
    }

    try {
        const { address, pass } = req.body;
        const { Parametro } = require('../models/parametro.model');
        const updatedAt = Date.now();

        await Parametro.bulkCreate([
            { clave: 'EMAIL_ADDR', valor: address, idTipo: 1, updatedAt: updatedAt },
            { clave: 'EMAIL_PASS', valor: pass, idTipo: 1, updatedAt: updatedAt },
        ], {
            updateOnDuplicate: ['valor', 'updatedAt']
        });

        response(res, HttpStatus.OK, `Parametros Correo actualizados`);
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al actualizar parametros correo`);
    }
};


/**
 * Se prueba el correo
 * Solo el usuario con Rol de Administrador tiene el permiso
 */
const probarCorreo = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, probando correo`);

    const adminUsu = await verificarAdmin(req, res);
    if (!adminUsu) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    try {
        const { correo } = adminUsu;
        const content = contentTest();
        enviarCorreo(correo, content)

        response(res, HttpStatus.OK, `Se envio correo de prueba`);
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al probar correo`);
    }
};

/**
 * Obtiene lista de usuarios segun fecha de ultima sincronizacion
 * Solo el usuario con Rol de Administrador tiene el permiso
 */
const getUsuarios = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo usuarios`);

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.query, {
        lastSincro: 'date',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `lastSincro faltante`);
        return;
    }

    let lastSincro = req.query.lastSincro;
    var where = {};
    if (lastSincro != null) {
        where = {
            [Op.or]: [
                { createdAt: { [Op.gt]: lastSincro } },
                { updatedAt: { [Op.gt]: lastSincro } }
            ]
        }
    } else {
        where = {
            estado: {
                [Op.gt]: 0
            }
        }
    }
    const { Usuario } = require('../models/usuario.model');

    let usuarios = await Usuario.findAll({
        attributes: [
            'id', 'correo', 'nombres', 'apellidoPaterno', 'apellidoMaterno',
            'razonSocial', 'nroDocumento', 'nroCel1', 'nroCel2', 'estado', 'idTipoUsuario',
            'idTipoDocumento', 'createdAt', 'updatedAt'
        ],
        where: where
    });

    if (!usuarios.length) {
        //vacio
        response(res, HttpStatus.NOT_FOUND, `No hay usuarios.`);
        return;
    } else {
        response(res, HttpStatus.OK, `Usuarios encontrados`, { usuarios: usuarios });
        return;
    }
};

/**
 * Modifica usuario
 * Solo el usuario de Rol Administrador esta autorizado para hacerlo 
 */
const modificarUsuario = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, actualizando usuario`);

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos Id
    let validator = new Validator(req.params, {
        id: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    //validamos contenido
    validator = new Validator(req.body, {
        idTipoUsuario: 'integer',
        idTipoDocumento: 'integer',
        nroDocumento: 'integer',
        estado: 'integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `datos erroneos`);
        return;
    }

    let idUsuario = req.params.id;

    try {
        const { Usuario } = require('../models/usuario.model');

        const usuario = await Usuario.findByPk(idUsuario);

        const oldEstado = usuario.estado

        if (req.body.idTipoUsuario != null) {
            usuario.idTipoUsuario = req.body.idTipoUsuario;
        }
        if (req.body.idTipoDocumento != null) {
            usuario.idTipoDocumento = req.body.idTipoDocumento;
        }
        if (req.body.nroDocumento != null) {
            usuario.nroDocumento = req.body.nroDocumento;
        }
        if (req.body.estado != null) {
            usuario.estado = req.body.estado;
        }

        await usuario.save();

        if (oldEstado == 2 && usuario.estado == 1) {
            //Si se activa distribuidor
            const content = contentNotifDistribActivado(usuario.razonSocial, usuario.nroDocumento);
            const mensaje = mensajeNotifDistribActivado(usuario.razonSocial, usuario.nroDocumento);
            enviarCorreo(usuario.correo, content);
            enviarMensajeWhatsapp(usuario.nroCel2, mensaje);
        }

        response(res, HttpStatus.OK, `Usuario modificado`);
    } catch (error) {
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al modificar usuario`);
    }
};


/**
 * Agrega un nuevo usuario Administrador
 * Solo el usuario de Rol Administrador esta autorizado para hacerlo 
 */
const agregarAdmin = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, nuevo usuario administrador`);

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos contenido
    let validator = new Validator(req.body, {
        correo: 'required|email',
        nombres: 'string',
        apellidoPaterno: 'string',
        apellidoMaterno: 'string'
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `datos erroneos`);
        return;
    }

    try {
        const { Usuario } = require('../models/usuario.model');
        const correo = req.body.correo;

        const usuExist = await Usuario.findOne({ where: { correo: correo } });
        if (usuExist) {
            if (usuExist.estado == 0) {   //Inactivo(0)
                await usuExist.destroy();
            } else {
                response(res, HttpStatus.UNPROCESABLE_ENTITY, `Correo existente`);
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

        if (usuAdmin) {
            const content = contentNotifAdminRegistrado(usuAdmin.correo, clave);
            enviarCorreo(usuAdmin.correo, content);

            response(res, HttpStatus.OK, `Administrador registrado`);
        } else {
            response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al crear administrador`);
        }

    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al crear administrador`);
    }
};


const obtenerAnuncios = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo anuncios`);

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.query, {
        lastSincro: 'date',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `lastSincro faltante`);
        return;
    }

    let lastSincro = req.query.lastSincro;
    var where = {};
    if (lastSincro != null) {
        where = {
            [Op.or]: [
                { createdAt: { [Op.gt]: lastSincro } },
                { updatedAt: { [Op.gt]: lastSincro } }
            ]
        }
    } else {
        where = {
            estado: true
        }
    }
    const Anuncio = require('../models/anuncio.model');
    const anuncios = await Anuncio.findAll({
        where: where
    })

    if (!anuncios.length) {
        //vacio
        response(res, HttpStatus.NOT_FOUND, `No hay anuncios.`);
        return;
    } else {
        response(res, HttpStatus.OK, `Anuncios encontrados`, { anuncios: anuncios });
        return;
    }
};

const crearAnuncio = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, Creando anuncio`);

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    if (!req.file) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Falta imagen`);
        return;
    }

    //Validamos
    let validator = new Validator(req.body, {
        descripcion: 'string',
        url: 'url',
        mostrar: 'boolean',
    });
    if (validator.fails()) {
        eliminarFotoTmp(req.file);
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Verificar URL`);
        return;
    }

    let { filename } = req.file;

    const data = {
        descripcion: req.body.descripcion,
        url: req.body.url,
        mostrar: req.body.mostrar,
        path: pathStr + filename,
    };
    try {
        const Anuncio = require('../models/anuncio.model');
        let anuncio = await Anuncio.create(data);
        await moverImagen(req.file);
        response(res, HttpStatus.OK, `Anuncio guardado: ${anuncio.id}`);
    } catch (error) {
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al guardar anuncio`);
    }
};

const actualizarAnuncio = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Actualizando anuncio`);

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos idAnuncio
    let validator = new Validator(req.params, {
        id: 'required|integer',
    });
    if (validator.fails()) {
        eliminarFotoTmp(req.file);
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Falta id de anuncio`);
        return;
    }

    //Validamos datos
    validator = new Validator(req.body, {
        descripcion: 'string',
        url: 'url',
        mostrar: 'boolean',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Faltan datos`);
        return;
    }

    const idAnuncio = req.params.id;

    const data = {
        descripcion: req.body.descripcion,
        url: req.body.url,
        mostrar: req.body.mostrar,
    };
    if (req.file != null) {
        data.path = pathStr + req.file.filename;
    }
    try {
        const Anuncio = require('../models/anuncio.model');
        await Anuncio.update(data, { where: { id: idAnuncio } });
        await moverImagen(req.file);
        response(res, HttpStatus.OK, `Anuncio actualizado`);
    } catch (error) {
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al actualizar anuncio`);
    }
};

const eliminarAnuncio = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Eliminando anuncios`);

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos datos
    validator = new Validator(req.body, {
        ids: 'array',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Faltan ids de anuncios`);
        return;
    }

    const ids = req.body.ids;
    try {
        const Anuncio = require('../models/anuncio.model');
        await Anuncio.update({ estado: false }, {
            where: {
                id: { [Op.in]: ids }
            }
        });
        response(res, HttpStatus.OK, `Anuncios eliminados`);
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al eliminar anuncios`);
    }
}

const eliminarFotoTmp = async (file) => {
    if (!file) return;
    try {
        let { filename, destination } = file;
        await fs.remove(destination + filename);
    } catch (error) {
        logger.error(error);
    }
}

const moverImagen = async (file) => {
    if (!file) return;

    let { filename, destination } = file;

    try {
        //mueve el archivo
        await fs.move(destination + filename, uploadFolder + filename);
    } catch (error) {
        logger.error(error);
        return null;
    }
};

/**
 * Cambia la clave del usuario
 */
const cambiarPassword = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, cambiando clave de usuario`);

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }
    //Validamos idAnuncio
    let validator = new Validator(req.params, {
        id: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Falta id de Usuario`);
        return;
    }

    let idUsuario = req.params.id;

    //Validamos datos ingresados
    validator = new Validator(req.body, {
        claveNueva: 'required|string',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Datos no válidos o incompletos.`);
        return;
    }
    try {
        const { Usuario } = require('../models/usuario.model');
        const { claveNueva } = req.body;
        await Usuario.update({ clave: sha256(claveNueva) }, {
            where: { id: idUsuario, estado: 1 }
        });
        response(res, HttpStatus.OK, `Usuario actualizado`);
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al cambiar clave.`);
    }

};


const obtenerReservas = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo reservas`);

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.query, {
        fecha: 'date',
        fechaFin: 'date',
        filtroDis: 'string',
        filtroCli: 'string',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `formato de fecha erroneo`);
        return;
    }

    let whereHorario = {};

    if (!req.query.fecha) {
        let fecha = (new Date()).toLocaleDateString("fr-CA");
        whereHorario = {fecha : { [Op.gte]: fecha }};
    } else {
        whereHorario = {
            [Op.and] : [
                {fecha : { [Op.gte]: req.query.fecha }},
                {fecha : { [Op.lte]: req.query.fechaFin }},
            ],
        };
    }
    whereHorario.estado = true;

    const filtroDis = req.query.filtroDis != null ? req.query.filtroDis : "";
    const filtroCli = req.query.filtroCli != null ? req.query.filtroCli : "";

    const Reserva = require('../models/reserva.model');
    const Servicio = require('../models/servicio.model');
    const Vehiculo = require('../models/vehiculo.model');
    const { Usuario } = require('../models/usuario.model');
    const Direccion = require('../models/direccion.model');
    try {
        const reservas = await Reserva.findAll({
            attributes: ['id', 'fecha', 'horaIni', 'duracionTotal', 'estadoAtencion'],
            include: [
                {
                    model: Servicio,
                    attributes: ['id', 'nombre'],
                    through: {
                        attributes: ['precio', 'duracion', 'estado']
                    }
                },
                {
                    model: Vehiculo,
                    attributes: ['id', 'marca', 'modelo', 'year', 'placa']
                }, {
                    model: Usuario,
                    as: "cliente",
                    attributes: ['id', 'correo', 'nombres', 'apellidoPaterno', 'apellidoMaterno'
                        , 'nroDocumento', 'idTipoDocumento', 'nroCel1', 'nroCel2'],
                    where: {
                        estado: 1,
                        nroDocumento: {[Op.startsWith]: filtroCli},
                    }
                }, {
                    model: Direccion,
                    as: 'Local',
                    attributes: ['id', 'direccion'],
                },
                {
                    model: Usuario,
                    as: 'distrib',
                    attributes: ['id', 'razonSocial', 'nroDocumento', 'idTipoDocumento', 'nroCel1', 'nroCel2'],
                    where: {
                        estado: 1,
                        nroDocumento: {[Op.startsWith]: filtroDis},
                    },
                },
            ],
            where: whereHorario,
            order: [
                ['fecha', 'ASC'],
                ['fechaHora', 'ASC'],
            ]
        })

        if (!reservas.length) {
            //vacio
            response(res, HttpStatus.NOT_FOUND, `No hay reservas.`);
            return;
        } else {
            response(res, HttpStatus.OK, `Reservas encontrados`, { reservas: reservas });
            return;
        }
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al buscar reservas`);
        return;
    }
};


const editarReserva = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, Creando reserva`);

    const usuAdmin = await verificarAdmin(req, res);
    if (!usuAdmin) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.params, {
        idReserva: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }
    validator = new Validator(req.body, {
        'servicios.*.id': 'required|integer',
        'servicios.*.ReservaServicios.estado': 'required|integer',
        estadoAtencion: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Faltan datos`);
        return;
    }

    const idReserva = req.params.idReserva;
    let servicios = req.body.servicios;
    let estadoAtencion = req.body.estadoAtencion;
    let reservaServicios = [];
    servicios.forEach(e => {
        reservaServicios.push({
            ReservaId: idReserva,
            ServicioId: e.id,
            estado: e.ReservaServicios.estado,
        });
    });

    try {
        const Reserva = require('../models/reserva.model');
        const ReservaServicios = require('../models/reserva.servicios.model');
        await Reserva.update({ estadoAtencion: estadoAtencion }, {
            where: {
                id: idReserva
            }
        });
        reservaServicios.forEach(async (e) => {
            await ReservaServicios.update({ estado: e.estado }, {
                where: {
                    ReservaId: e.ReservaId,
                    ServicioId: e.ServicioId,
                }
            });
        });
        response(res, HttpStatus.OK, `Reserva guardada`);
    } catch (error) {
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al guardar reserva`);
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
    cambiarPassword,
    obtenerReservas,
    editarReserva,
};