const { response } = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const { Op } = require('sequelize');

const verificarDistrib = async (req, res) => {
    const idAuthUsu = req.auth.data.idUsuario;
    const { Usuario } = require('../models/usuario.model');
    //verificamos si el usuario solicitante tiene el Rol de Distribuidor
    const authUsu = await Usuario.findOne({ where: { id: idAuthUsu, idTipoUsuario: 3, estado: 1 } });
    if (!authUsu) {
        //No es usuario Distribuidor
        return null;
    }
    return authUsu;
}

const obtenerServicios = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo servicios`);

    const usuDis = await verificarDistrib(req, res);
    if(!usuDis){
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede acceder por el mismo id`);
        return;
    }

    validator = new Validator(req.query, {
        lastSincro: 'required|date',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `lastSincro faltante`);
        return;
    }

    let lastSincro = req.query.lastSincro;
    const Servicio = require('../models/servicio.model');

    let servicios = await Servicio.findAll({
        attributes: ['id', 'nombre', 'precio', 'estado', 'idDistrib'],
        where: {
            [Op.or]: [
                { createdAt: { [Op.gt]: lastSincro } },
                { updatedAt: { [Op.gt]: lastSincro } }
            ],
            idDistrib: idUsuario,
        }
    });

    if (!servicios.length) {
        //vacio
        response(res, HttpStatus.NOT_FOUND, `No hay servicios.`);
    } else {
        response(res, HttpStatus.OK, `Servicios encontrados`, { servicios: servicios });
    }
};

const agregarServicio = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, creando servicio`);

    const usuDis = await verificarDistrib(req, res);
    if(!usuDis){
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }
    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede agregar por el mismo id`);
        return;
    }

    validator = new Validator(req.body, {
        'nombre': 'required|string',
        'precio': 'required|numeric',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `datos erroneos`);
        return;
    }

    try {
        const data = {
            nombre: req.body.nombre,
            precio: req.body.precio,
            idDistrib: idUsuario
        }
        const Servicio = require('../models/servicio.model');
        const nuevoServicio = await Servicio.create(data);

        if (!nuevoServicio) {
            response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al crear Servicio`);
        } else {
            response(res, HttpStatus.OK, `Servicio creado`);
        }
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al crear Servicio`);
    }
};


const modificarServicio = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, modificando servicios`);

    const usuDis = await verificarDistrib(req, res);
    if(!usuDis){
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }
    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede agregar por el mismo id`);
        return;
    }

    validator = new Validator(req.body, {
        'id': 'required|integer',
        'nombre': 'required|string',
        'precio': 'required|numeric',
        'estado': 'required|boolean',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `datos erroneos`);
        return;
    }

    try {
        const data = {
            nombre: req.body.nombre,
            precio: req.body.precio,
            estado: req.body.estado,
        }
        const Servicio = require('../models/servicio.model');
        await Servicio.update(data, { where: { id: req.body.id, idDistrib: idUsuario } });

        response(res, HttpStatus.OK, `Servicio actualizado`);
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al crear Servicio`);
    }
};


const obtenerDirecciones = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo direcciones`);

    const usuDis = await verificarDistrib(req, res);
    if(!usuDis){
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede acceder por el mismo id`);
        return;
    }

    validator = new Validator(req.query, {
        lastSincro: 'required|date',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `lastSincro faltante`);
        return;
    }

    let lastSincro = req.query.lastSincro;
    const Direccion = require('../models/direccion.model');

    let direcciones = await Direccion.findAll({
        attributes: ['id', 'departamento', 'provincia', 'distrito', 'ubigeo',
            'direccion', 'latitud', 'longitud', 'estado', 'idUsuario'],
        where: {
            [Op.or]: [
                { createdAt: { [Op.gt]: lastSincro } },
                { updatedAt: { [Op.gt]: lastSincro } }
            ],
            idUsuario: idUsuario,
        }
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

    const usuDis = await verificarDistrib(req, res);
    if(!usuDis){
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }
    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede agregar por el mismo id`);
        return;
    }

    validator = new Validator(req.body, {
        'departamento': 'required|string',
        'provincia': 'required|string',
        'distrito': 'required|string',
        'ubigeo': 'required|string',
        'direccion': 'required|string',
        'latitud': 'required|string',
        'longitud': 'required|string',
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

    const usuDis = await verificarDistrib(req, res);
    if(!usuDis){
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }
    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
        idDireccion: 'required|integer'
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede agregar por el mismo id`);
        return;
    }

    validator = new Validator(req.body, {
        'departamento': 'required|string',
        'provincia': 'required|string',
        'distrito': 'required|string',
        'ubigeo': 'required|string',
        'direccion': 'required|string',
        'latitud': 'required|string',
        'longitud': 'required|string',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `datos erroneos`);
        return;
    }

    try {
        const idDireccion = req.params.id;
        const data = {
            departamento: req.body.departamento,
            provincia: req.body.provincia,
            distrito: req.body.distrito,
            ubigeo: req.body.ubigeo,
            direccion: req.body.direccion,
            latitud: req.body.latitud,
            longitud: req.body.longitud,
        }
        const Direccion = require('../models/direccion.model');
        await Direccion.update(data, { where: { id: idDireccion } });
        response(res, HttpStatus.OK, `Direccion modificada`);

    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al modificar Direccion`);
    }
};


const eliminarDireccion = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Eliminando Direccion`);

    const usuDis = await verificarDistrib(req, res);
    if(!usuDis){
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
        idDireccion: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede eliminar por el mismo id`);
        return;
    }

    const idDireccion = req.params.idDireccion;
    try {
        const Direccion = require('../models/direccion.model');
        const HorarioConfig = require('../models/horario.config.model');
        await Direccion.update({ estado: false }, {
            where: {
                id: idDireccion
            }
        });
        // Tambien se anulan horarios relacionados
        await HorarioConfig.update({estado: false}, {
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

const obtenerHorariosConfig = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo Configuraciones de Horario`);

    const usuDis = await verificarDistrib(req, res);
    if(!usuDis){
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede acceder por el mismo id`);
        return;
    }

    validator = new Validator(req.query, {
        lastSincro: 'required|date',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `lastSincro faltante`);
        return;
    }

    let lastSincro = req.query.lastSincro;
    const HorarioConfig = require('../models/horario.config.model');

    let horarioConfigs = await HorarioConfig.findAll({
        attributes: ['id', 'lunes', 'martes', 'miercoles', 'jueves',
            'viernes', 'sabado', 'domingo', 'horaIni', 'minIni','horaFin',
            'minFin','intervalo', 'estado', 'idDistrib','idLocal'],
        where: {
            [Op.or]: [
                { createdAt: { [Op.gt]: lastSincro } },
                { updatedAt: { [Op.gt]: lastSincro } }
            ],
            idDistrib: idUsuario,
        }
    });

    if (!horarioConfigs.length) {
        //vacio
        response(res, HttpStatus.NOT_FOUND, `No hay Configuraciones de Horario.`);
    } else {
        response(res, HttpStatus.OK, `Configuraciones de Horario encontrados`, { horarioConfigs: horarioConfigs });
    }
};


const agregarHorarioConfig = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, creando Configuracion de Horario`);

    const usuDis = await verificarDistrib(req, res);
    if(!usuDis){
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }
    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede agregar por el mismo id`);
        return;
    }

    validator = new Validator(req.body, {
        'lunes': 'required|boolean',
        'martes': 'required|boolean',
        'miercoles': 'required|boolean',
        'jueves': 'required|boolean',
        'viernes': 'required|boolean',
        'sabado': 'required|boolean',
        'domingo': 'required|boolean',
        'horaIni': 'required|integer',
        'minIni': 'required|integer',
        'horaFin': 'required|integer',
        'minFin': 'required|integer',
        'intervalo': 'required|integer',
        'idLocal': 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `datos erroneos`);
        return;
    }

    try {
        const data = {
            lunes: req.body.lunes,
            martes: req.body.martes,
            miercoles: req.body.miercoles,
            jueves: req.body.jueves,
            viernes: req.body.viernes,
            sabado: req.body.sabado,
            domingo: req.body.domingo,
            horaIni: req.body.horaIni,
            minIni: req.body.minIni,
            horaFin: req.body.horaFin,
            minFin: req.body.minFin,
            intervalo: req.body.intervalo,
            idLocal: req.body.idLocal,
            idDistrib: idUsuario
        }

        const HorarioConfig = require('../models/horario.config.model');
        const nuevoHorarioConfig = await HorarioConfig.create(data);

        if (!nuevoHorarioConfig) {
            response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al crear Configuracion de Horario`);
        } else {
            response(res, HttpStatus.OK, `Configuracion de Horario creado`);
        }
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al crear Configuracion de Horario`);
    }
};

const modificarHorarioConfig = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, modificando Configuracion de Horario`);

    const usuDis = await verificarDistrib(req, res);
    if(!usuDis){
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }
    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
        idHorarioConfig: 'required|integer'
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede agregar por el mismo id`);
        return;
    }

    validator = new Validator(req.body, {
        'lunes': 'required|boolean',
        'martes': 'required|boolean',
        'miercoles': 'required|boolean',
        'jueves': 'required|boolean',
        'viernes': 'required|boolean',
        'sabado': 'required|boolean',
        'domingo': 'required|boolean',
        'horaIni': 'required|integer',
        'minIni': 'required|integer',
        'horaFin': 'required|integer',
        'minFin': 'required|integer',
        'intervalo': 'required|integer',
        'idLocal': 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `datos erroneos`);
        return;
    }

    try {
        const idHorarioConfig = req.params.idHorarioConfig;
        const data = {
            lunes: req.body.lunes,
            martes: req.body.martes,
            miercoles: req.body.miercoles,
            jueves: req.body.jueves,
            viernes: req.body.viernes,
            sabado: req.body.sabado,
            domingo: req.body.domingo,
            horaIni: req.body.horaIni,
            minIni: req.body.minIni,
            horaFin: req.body.horaFin,
            minFin: req.body.minFin,
            intervalo: req.body.intervalo,
            idLocal: req.body.idLocal,
        }
        const HorarioConfig = require('../models/horario.config.model');
        await HorarioConfig.update(data, { where: { id: idHorarioConfig } });
        response(res, HttpStatus.OK, `Configuracion de Horario modificada`);

    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al modificar Configuracion de Horario`);
    }
};

const eliminarHorarioConfig = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, eliminar Configuracion de Horario`);

    const usuDis = await verificarDistrib(req, res);
    if(!usuDis){
        response(res, HttpStatus.UNAUTHORIZED, "No tiene permiso para esta operación");
        return;
    }

    //Validamos
    let validator = new Validator(req.params, {
        id: 'required|integer',
        idHorarioConfig: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `id faltante`);
        return;
    }

    let idAuthUsu = req.auth.data.idUsuario;
    let idUsuario = req.params.id;
    if (idAuthUsu != idUsuario) {
        response(res, HttpStatus.UNAUTHORIZED, `Solo puede eliminar por el mismo id`);
        return;
    }

    const idHorarioConfig = req.params.idHorarioConfig;
    try {
        const HorarioConfig = require('../models/horario.config.model');
        await HorarioConfig.update({ estado: false }, {
            where: {
                id: idHorarioConfig
            }
        });
        //TODO anular tambien los horarios y reservas futuras generadas
        response(res, HttpStatus.OK, `Configuracion de Horario eliminada`);
    } catch (error) {
        logger.error(error);
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al eliminar Configuracion de Horario`);
    }
}

module.exports = {
    obtenerServicios,
    agregarServicio,
    modificarServicio,
    obtenerDirecciones,
    agregarDireccion,
    modificarDireccion,
    eliminarDireccion,
    obtenerHorariosConfig,
    agregarHorarioConfig,
    modificarHorarioConfig,
    eliminarHorarioConfig,
};