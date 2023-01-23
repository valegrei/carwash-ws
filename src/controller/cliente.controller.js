const { response } = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const { Op } = require('sequelize');
const fs = require('fs-extra');
const uploadFolder = 'uploads/images/vehiculos/';
const pathStr = '/files/images/vehiculos/';


const verificarCliente = async (req, res) => {
    const idAuthUsu = req.auth.data.idUsuario;
    const { Usuario } = require('../models/usuario.model');
    //verificamos si el usuario solicitante tiene el Rol de Cliente
    const authUsu = await Usuario.findOne({ where: { id: idAuthUsu, idTipoUsuario: 2, estado: 1 } });
    if (!authUsu) {
        //No es usuario Cliente
        return null;
    }
    return authUsu;
}


const obtenerLocales = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo locales en el area`);

    const usuCli = await verificarCliente(req, res);
    if (!usuCli) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    validator = new Validator(req.query, {
        latNE: 'required|numeric',
        longNE: 'required|numeric',
        latSW: 'required|numeric',
        longSW: 'required|numeric',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Limites faltantes`);
        return;
    }

    const Direccion = require('../models/direccion.model');
    const { Usuario } = require('../models/usuario.model');
    const {latNE, longNE, latSW, longSW} = req.query;

    let locales = await Direccion.findAll({
        attributes: ['id', 'departamento', 'provincia', 'distrito', 'ubigeo',
            'direccion', 'latitud', 'longitud', 'estado', 'idUsuario'],
        include: {
            model: Usuario,
            attributes: ['id', 'razonSocial', 'nroDocumento', 'idTipoDocumento', 'nroCel1', 'nroCel2'],
            where: {
                estado: true,
                idTipoUsuario: 3,   //distribuidores
            }
        },
        where: {
            [Op.and]: [
                { latitud: { [Op.gte]: latSW } },
                { latitud: { [Op.lte]: latNE } },
                { longitud: { [Op.gte]: longSW } },
                { longitud: { [Op.lte]: longNE } },
                { estado: true },
            ],
        }
    });

    if (!locales.length) {
        //vacio
        response(res, HttpStatus.NOT_FOUND, `No hay locales en el area`);
    } else {
        response(res, HttpStatus.OK, `Locales encontrados`, { locales: locales });
    }
};


const obtenerVehiculos = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo vehiculos`);

    const usuCli = await verificarCliente(req, res);
    if (!usuCli) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.query, {
        lastSincro: 'required|date',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `lastSincro faltante`);
        return;
    }

    let lastSincro = req.query.lastSincro;

    const Vehiculo = require('../models/vehiculo.model');
    const vehiculos = await Vehiculo.findAll({
        where: {
            idCliente: usuCli.id,
            [Op.or]: [
                { createdAt: { [Op.gt]: lastSincro } },
                { updatedAt: { [Op.gt]: lastSincro } }
            ]
        }
    })

    if (!vehiculos.length) {
        //vacio
        response(res, HttpStatus.NOT_FOUND, `No hay vehiculos.`);
        return;
    } else {
        response(res, HttpStatus.OK, `Vehiculos encontrados`, { vehiculos: vehiculos });
        return;
    }
};

const crearVehiculo = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, Creando vehiculo`);

    const usuCli = await verificarCliente(req, res);
    if (!usuCli) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.body, {
        marca: 'required|string',
        modelo: 'required|string',
        year: 'required|numeric',
        placa: 'required|string',
    });
    if (validator.fails()) {
        eliminarFotoTmp(req.file);
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Faltan datos`);
        return;
    }

    const data = {
        marca: req.body.marca,
        modelo: req.body.modelo,
        year: req.body.year,
        placa: req.body.placa,
        idCliente: usuCli.id,
    };
    if (req.file != null) {
        let { filename } = req.file;
        data.path = pathStr + filename;
    }
    try {
        const Vehiculo = require('../models/vehiculo.model');
        let vehiculo = await Vehiculo.create(data);
        await moverImagen(req.file);
        response(res, HttpStatus.OK, `Vehiculo guardado: ${vehiculo.id}`);
    } catch (error) {
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al guardar vehiculo`);
    }
};

const actualizarVehiculo = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Actualizando vehiculo`);

    const usuCli = await verificarCliente(req, res);
    if (!usuCli) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos idVehiculo
    let validator = new Validator(req.params, {
        idVehiculo: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Falta id de vehiculo`);
        return;
    }

    //Validamos datos
    validator = new Validator(req.body, {
        marca: 'required|string',
        modelo: 'required|string',
        year: 'required|numeric',
        placa: 'required|string',
        borrarFoto: 'required|boolean',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Faltan datos`);
        return;
    }

    const idVehiculo = req.params.idVehiculo;

    const data = {
        marca: req.body.marca,
        modelo: req.body.modelo,
        year: req.body.year,
        placa: req.body.placa,
    };
    if (req.file != null) {
        let { filename } = req.file;
        data.path = pathStr + filename;
    }
    if (req.body.borrarFoto === 'true') {
        data.path = null;
    }

    try {
        const Vehiculo = require('../models/vehiculo.model');
        await Vehiculo.update(data, { where: { id: idVehiculo } });
        await moverImagen(req.file);
        response(res, HttpStatus.OK, `Vehiculo actualizado`);
    } catch (error) {
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al actualizar vehiculo`);
    }
};

const eliminarVehiculo = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Eliminando Vehiculo`);
    const usuCli = await verificarCliente(req, res);
    if (!usuCli) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }
    //Validamos
    let validator = new Validator(req.params, {
        idVehiculo: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    const idVehiculo = req.params.idVehiculo;
    try {
        const Vehiculo = require('../models/vehiculo.model');
        await Vehiculo.update({ estado: false }, {
            where: {
                id: idVehiculo
            }
        });
        response(res, HttpStatus.OK, `Vehiculo eliminada`);
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al eliminar Vehiculo`);
    }
}

const eliminarFotoTmp = async (file) => {
    if (!file) return;
    try {
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
    obtenerVehiculos,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
    obtenerLocales,
}