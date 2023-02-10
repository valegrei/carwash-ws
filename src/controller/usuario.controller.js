const { response } = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const { sha256 } = require('../util/utils');
const { Op } = require('sequelize');
const fs = require('fs-extra');
const uploadFolder = 'uploads/images/banner/';
const pathStr = '/files/images/banner/';

/**
 * Obtiene datos del mismo usuario que lo solicita
 */
const getUsuario = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, obteniendo usuario`);

    let idUsuario = req.auth.data.idUsuario;

    const { Usuario } = require('../models/usuario.model');

    let usuario = await Usuario.findOne({
        where: { id: idUsuario, estado: 1 }
    });

    if (!usuario) {
        //vacio
        response(res, HttpStatus.NOT_FOUND, `Usuario no encontrado.`);
        return;
    } else {
        usuario.clave = null;

        response(res, HttpStatus.OK, `Usuario encontrado`, { usuario: usuario });
        return;
    }
};

/**
 * Actualiza datos personales del mismo usuario solicitante
 */
const updateUsuario = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, actualizando usuario`);

    let idUsuario = req.auth.data.idUsuario;

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
        acercaDe: 'string',
        borrarFoto: 'boolean',
    });
    if (validator.fails()) {
        eliminarFotoTmp(req.file);
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Datos no válidos o incompletos`);
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
        idTipoDocumento: req.body.idTipoDocumento,
        acercaDe: req.body.acercaDe
    };
    if (req.file != null) {
        let { filename } = req.file;
        data.path = pathStr + filename;
    }
    if (req.body.borrarFoto != null && req.body.borrarFoto === 'true') {
        data.path = null;
    }

    try {
        const { Usuario } = require('../models/usuario.model');
        await Usuario.update(data, { where: { id: idUsuario, estado: 1 } });
        await moverImagen(req.file);

        //obtiene usuario actualizado
        const usuario = await Usuario.findOne({
            where: { id: idUsuario, estado: 1 }
        });

        if (!usuario) {
            //vacio
            response(res, HttpStatus.NOT_FOUND, `Usuario no encontrado.`);
            return;
        } else {
            usuario.clave = null;
            response(res, HttpStatus.OK, `Usuario actualizado`, { usuario: usuario });
            return;
        }
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al guardar`);
    }
};
/**
 * Cambia la clave del usuario
 */
const cambiarPassword = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, cambiando clave de usuario`);

    let idUsuario = req.auth.data.idUsuario;

    //Validamos datos ingresados
    validator = new Validator(req.body, {
        claveAnterior: 'required|string',
        claveNueva: 'required|string',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Datos no válidos o incompletos.`);
        return;
    }
    try {
        const { Usuario } = require('../models/usuario.model');
        const usuario = await Usuario.findOne({
            where: { id: idUsuario, estado: 1 }
        });

        const { claveAnterior, claveNueva } = req.body;

        if (usuario) {
            if (usuario.clave == sha256(claveAnterior)) {
                //procede a actualizar
                usuario.clave = sha256(claveNueva);
                await usuario.save();
                response(res, HttpStatus.OK, `Usuario actualizado`);
            } else {
                response(res, HttpStatus.UNPROCESABLE_ENTITY, `Clave anterior incorrecta.`);
            }
        } else {
            response(res, HttpStatus.NOT_FOUND, `Usuario no encontrado.`);
        }
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al cambiar clave.`);
    }

};


const obtenerDirecciones = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo direcciones`);

    let idUsuario = req.auth.data.idUsuario;

    validator = new Validator(req.query, {
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
            idUsuario: idUsuario,
            [Op.or]: [
                { createdAt: { [Op.gt]: lastSincro } },
                { updatedAt: { [Op.gt]: lastSincro } }
            ]
        }
    } else {
        where = {
            idUsuario: idUsuario,
            estado: true
        }
    }
    const Direccion = require('../models/direccion.model');

    let direcciones = await Direccion.findAll({
        attributes: ['id', 'departamento', 'provincia', 'distrito', 'ubigeo',
            'direccion', 'latitud', 'longitud', 'estado', 'tipo', 'idUsuario'],
        where: where
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

    let idUsuario = req.auth.data.idUsuario;

    validator = new Validator(req.body, {
        'departamento': 'string',
        'provincia': 'string',
        'distrito': 'string',
        'ubigeo': 'string',
        'direccion': 'required|string',
        'latitud': 'required|string',
        'longitud': 'required|string',
        'tipo': 'required|integer',
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
            tipo: req.body.tipo,
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
        idDireccion: 'required|integer'
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idUsuario = req.auth.data.idUsuario;

    validator = new Validator(req.body, {
        'departamento': 'string',
        'provincia': 'string',
        'distrito': 'string',
        'ubigeo': 'string',
        'direccion': 'required|string',
        'latitud': 'required|string',
        'longitud': 'required|string',
        'tipo': 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `datos erroneos`);
        return;
    }

    try {
        const idDireccion = req.params.idDireccion;
        const data = {
            departamento: req.body.departamento,
            provincia: req.body.provincia,
            distrito: req.body.distrito,
            ubigeo: req.body.ubigeo,
            direccion: req.body.direccion,
            latitud: req.body.latitud,
            longitud: req.body.longitud,
            tipo: req.body.tipo,
        }
        const Direccion = require('../models/direccion.model');
        await Direccion.update(data, { where: { id: idDireccion, idUsuario: idUsuario } });
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
        idDireccion: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idUsuario = req.auth.data.idUsuario;

    const idDireccion = req.params.idDireccion;
    try {
        const Direccion = require('../models/direccion.model');
        const HorarioConfig = require('../models/horario.config.model');
        await Direccion.update({ estado: false }, {
            where: {
                id: idDireccion, idUsuario: idUsuario
            }
        });
        // Tambien se anulan horarios relacionados
        await HorarioConfig.update({ estado: false }, {
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

module.exports = {
    getUsuario,
    updateUsuario,
    cambiarPassword,
    obtenerDirecciones,
    agregarDireccion,
    modificarDireccion,
    eliminarDireccion,
};