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
    const Servicio = require('../models/servicio.model');
    const Favorito = require('../models/favorito.model');
    const { latNE, longNE, latSW, longSW } = req.query;

    let locales = await Direccion.findAll({
        attributes: ['id', 'departamento', 'provincia', 'distrito', 'ubigeo',
            'direccion', 'latitud', 'longitud', 'estado', 'idUsuario'],
        include: [{
            model: Usuario,
            attributes: ['id', 'razonSocial', 'nroDocumento', 'idTipoDocumento', 'nroCel1', 'nroCel2'],
            include: {
                attributes: ['id', 'nombre', 'precio', 'duracion'],
                model: Servicio,
                where: {
                    estado: true,
                },
            },
            where: {
                estado: true,
                idTipoUsuario: 3,   //distribuidores
            },
        }, {
            model: Favorito,
            attributes: ['id', 'idCliente', 'idLocal', 'estado'],
            where: { estado: true },
            required: false,
        }],
        where: {
            [Op.and]: [
                { latitud: { [Op.gte]: latSW } },
                { latitud: { [Op.lte]: latNE } },
                { longitud: { [Op.gte]: longSW } },
                { longitud: { [Op.lte]: longNE } },
                { estado: true },
            ],
        },
    });

    if (!locales.length) {
        //vacio
        response(res, HttpStatus.NOT_FOUND, `No hay locales en el area`);
    } else {
        response(res, HttpStatus.OK, `Locales encontrados`, { locales: locales });
    }
};


const obtenerHorarios = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo Horarios`);

    const usuCli = await verificarCliente(req, res);
    if (!usuCli) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    validator = new Validator(req.query, {
        idLocal: 'required|integer',
        fecha: 'required|date',
        fechaHora: 'required|date',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Datos faltantes`);
        return;
    }

    const Horario = require('../models/horario.model');
    const Reserva = require('../models/reserva.model');
    const { idLocal, fecha, fechaHora } = req.query;

    let horarios = await Horario.findAll({
        attributes: ['id', 'fecha', 'horaIni', 'horaFin'],
        include: {
            model: Reserva,
            attributes: ['id'],
            required: false,
        },
        where: {
            idLocal: idLocal,
            fecha: fecha,
            fechaHora: { [Op.gte]: fechaHora },
            estado: true,
            '$Reserva.idHorario$': null,
        },
    });

    if (!horarios.length) {
        //vacio
        response(res, HttpStatus.NOT_FOUND, `No hay horarios disponibles`);
    } else {
        response(res, HttpStatus.OK, `Horarios encontrados`, { horarios: horarios });
    }
};

const crearReserva = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, Creando reserva`);

    const usuCli = await verificarCliente(req, res);
    if (!usuCli) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.body, {
        idHorario: 'required|integer',
        idCliente: 'required|integer',
        idVehiculo: 'required|integer',
        'servicios.*.id': 'required|integer',
        'servicios.*.precio': 'required|numeric',
        'servicios.*.duracion': 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Faltan datos`);
        return;
    }

    const dataReserva = {
        idHorario: req.body.idHorario,
        idCliente: req.body.idCliente,
        idVehiculo: req.body.idVehiculo,
    };
    let servicios = req.body.servicios;

    try {
        const Reserva = require('../models/reserva.model');
        const ReservaServicios = require('../models/reserva.servicios.model');
        let reserva = await Reserva.create(dataReserva);
        let reservaServicios = [];
        servicios.forEach(e => {
            reservaServicios.push({
                ReservaId: reserva.id,
                ServicioId: e.id,
                precio: e.precio,
                duracion: e.duracion,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });
        await ReservaServicios.bulkCreate(reservaServicios);
        response(res, HttpStatus.OK, `Reserva guardada: ${reserva.id}`);
    } catch (error) {
        if (error.sqlState = 23000)
            response(res, HttpStatus.INTERNAL_SERVER_ERROR, `El horario ya fue tomado. Elija otro.`);
        else
            response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al guardar reserva`);
    }
};


const obtenerReservas = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo reservas`);

    const usuCli = await verificarCliente(req, res);
    if (!usuCli) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.query, {
        fecha: 'date',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `formato de fecha erroneo`);
        return;
    }

    const whereHorario = {};

    if (!req.query.fecha) {
        let fecha = (new Date()).toLocaleDateString("fr-CA");
        whereHorario.fecha = { [Op.gte]: fecha };
    } else {
        whereHorario.fecha = req.query.fecha;
    }

    const Horario = require('../models/horario.model');
    const Reserva = require('../models/reserva.model');
    const Servicio = require('../models/servicio.model');
    const Vehiculo = require('../models/vehiculo.model');
    const { Usuario } = require('../models/usuario.model');
    const Direccion = require('../models/direccion.model');
    try {
        const reservas = await Reserva.findAll({
            attributes: ['id'],
            include: [
                {
                    model: Horario,
                    attributes: ['id', 'fecha', 'horaIni', 'horaFin'],
                    include: [
                        {
                            model: Direccion,
                            as: 'Local',
                            attributes: ['id', 'direccion'],
                        },
                        {
                            model: Usuario,
                            as: 'Distrib',
                            attributes: ['id', 'razonSocial'],
                        },
                    ],
                    where: whereHorario,
                },
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
                },
            ],
            where: {
                idCliente: usuCli.id,
                estado: true,
            },
            order: [
                [{ model: Horario, as: 'Horario' }, 'fecha', 'ASC'],
                [{ model: Horario, as: 'Horario' }, 'horaIni', 'ASC'],
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

const anularReserva = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Anular Reserva`);
    const usuCli = await verificarCliente(req, res);
    if (!usuCli) {
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

    const idReserva = req.params.idReserva;
    try {
        const Reserva = require('../models/reserva.model');
        await Reserva.destroy({ where: { id: idReserva } });
        response(res, HttpStatus.OK, `Reserva anulada`);
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al anular reserva`);
    }
}

const agregarFavorito = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, Agregando Favorito`);

    const usuCli = await verificarCliente(req, res);
    if (!usuCli) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.body, {
        idLocal: 'required|string',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Falta idLocal`);
        return;
    }

    const data = {
        idLocal: req.body.idLocal,
        idCliente: usuCli.id,
    };
    try {
        const Favorito = require('../models/favorito.model');
        let favorito = await Favorito.create(data);
        response(res, HttpStatus.OK, `Favorito guardado: ${favorito.id}`);
    } catch (error) {
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al guardar favorito`);
    }
};


const obtenerLocalesFavoritos = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo locales favoritos`);

    const usuCli = await verificarCliente(req, res);
    if (!usuCli) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    const Direccion = require('../models/direccion.model');
    const Favorito = require('../models/favorito.model');
    const { Usuario } = require('../models/usuario.model');

    let locales = await Direccion.findAll({
        attributes: ['id', 'departamento', 'provincia', 'distrito', 'ubigeo',
            'direccion', 'latitud', 'longitud', 'estado', 'idUsuario'],
        include: [{
            model: Usuario,
            attributes: ['id', 'razonSocial', 'nroDocumento', 'idTipoDocumento', 'nroCel1', 'nroCel2'],
            include: {
                attributes: ['id', 'nombre', 'precio', 'duracion'],
                model: Servicio,
                where: {
                    estado: true,
                },
            },
            where: {
                estado: true,
                idTipoUsuario: 3,   //distribuidores
            },
        }, {
            model: Favorito,
            attributes: ['id', 'idCliente', 'idLocal', 'estado'],
            where: { estado: true, idCliente: usuCli.id },
            required: true,
        }],
        where: { estado: true },
    });

    if (!locales.length) {
        //vacio
        response(res, HttpStatus.NOT_FOUND, `No hay locales favoritos.`);
        return;
    } else {
        response(res, HttpStatus.OK, `Locales Favoritos encontrados`, { locales: locales });
        return;
    }
};


const eliminarFavorito = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Eliminando Favorito`);
    const usuCli = await verificarCliente(req, res);
    if (!usuCli) {
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }
    //Validamos
    let validator = new Validator(req.params, {
        idFavorito: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    const idFavorito = req.params.idFavorito;
    try {
        const Favorito = require('../models/favorito.model');
        await Favorito.update({ estado: false }, { where: { id: idFavorito } });
        response(res, HttpStatus.OK, `Favorito eliminado`);
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al eliminar Favorito`);
    }
}

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


const obtenerAnuncios = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo anuncios`);

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

    const Anuncio = require('../models/anuncio.model');
    const anuncios = await Anuncio.findAll({
        attribute: ['id', 'url', 'path', 'mostrar', 'estado'],
        where: {
            [Op.or]: [
                { createdAt: { [Op.gt]: lastSincro } },
                { updatedAt: { [Op.gt]: lastSincro } }
            ]
        }
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
    obtenerVehiculos,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
    obtenerLocales,
    obtenerHorarios,
    agregarFavorito,
    obtenerLocalesFavoritos,
    eliminarFavorito,
    crearReserva,
    anularReserva,
    obtenerReservas,
    obtenerAnuncios,
}