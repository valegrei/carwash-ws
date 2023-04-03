const { response } = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const { Op } = require('sequelize');
const {contentNuevaReserva, enviarCorreo} = require('../util/mail');
const fs = require('fs-extra');
const { enviarMensajeWhatsapp, mensajeNuevaReserva } = require('../util/whatsapp');
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

    const idCli = req.auth.data.idUsuario;

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
    const HorarioConfig = require('../models/horario.config.model');
    const { latNE, longNE, latSW, longSW } = req.query;

    let locales = await Direccion.findAll({
        attributes: ['id', 'departamento', 'provincia', 'distrito', 'ubigeo',
            'direccion', 'latitud', 'longitud', 'estado', 'idUsuario'],
        include: [{
            model: Usuario,
            attributes: ['id', 'razonSocial', 'nroDocumento', 'idTipoDocumento', 'nroCel1', 'nroCel2', 'acercaDe', 'path'],
            include: {
                attributes: ['id', 'nombre', 'precio', 'duracion'],
                model: Servicio,
                where: {
                    estado: true,
                },
            },
            where: {
                estado: 1,
                idTipoUsuario: 3,   //distribuidores
            },
        }, {
            model: Favorito,
            attributes: ['id', 'idCliente', 'idLocal', 'estado'],
            where: { estado: true, idCliente: idCli },
            required: false,
        }, {
            model: HorarioConfig,
            attributes: ['id', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
                'horaIni', 'minIni', 'horaFin', 'minFin', 'nroAtenciones'],
            where: { estado: true },
            required: true,
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
    const { idLocal, fecha, fechaHora } = req.query;

    let horarios = await Horario.findAll({
        attributes: ['id', 'nro', 'fecha', 'horaIni', 'horaFin'],
        where: {
            idLocal: idLocal,
            fecha: fecha,
            fechaHora: { [Op.gte]: fechaHora },
            estado: true,
            idReserva: null,
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
        idHorarios: 'required|array',
        idCliente: 'required|integer',
        idVehiculo: 'required|integer',
        idDistrib: 'required|integer',
        idLocal: 'required|integer',
        fecha: 'required|date',
        horaIni: 'required|string',
        fechaHora: 'required|date',
        duracionTotal: 'required|integer',
        'servicios.*.id': 'required|integer',
        'servicios.*.precio': 'required|numeric',
        'servicios.*.duracion': 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Faltan datos`);
        return;
    }

    const dataReserva = { //Horario de Inicio
        idCliente: req.body.idCliente,
        idVehiculo: req.body.idVehiculo,
        idDistrib: req.body.idDistrib,
        idLocal: req.body.idLocal,
        fecha: req.body.fecha,
        horaIni: req.body.horaIni,
        fechaHora: req.body.fechaHora,
        duracionTotal: req.body.duracionTotal,
    };
    const servicios = req.body.servicios;
    const idHorarios = req.body.idHorarios;

    const db = require('../models');
    const Reserva = require('../models/reserva.model');
    const Horario = require('../models/horario.model');
    const ReservaServicios = require('../models/reserva.servicios.model');
    const t = await db.sequelize.transaction();

    try {
        const reserva = await Reserva.create(dataReserva);
        const reservaServicios = [];
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
        //Verifica si esos horarios ya fueron tomados por otra reserva
        const cantHorariosOcupados = await Horario.count({
            where: {
                id: { [Op.in]: idHorarios },
                idReserva: { [Op.ne]: null }
            }
        });
        if (cantHorariosOcupados == 0) {
            //procede a guardar los horarios de la reserva
            await Horario.update({
                idReserva: reserva.id
            }, {
                where: {
                    id: { [Op.in]: idHorarios }
                }
            })
        } else {
            //sino desase todo
            logger.info(`Cantidad de conflictos: ${cantHorariosOcupados}`)
            await t.rollback();
        }
        await t.commit();
        notificarNuevaReserva(reserva.id);
        response(res, HttpStatus.OK, `Reserva guardada: ${reserva.id}`);
    } catch (error) {
        logger.error(error)
        await t.rollback()
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
        fechaFin: 'date',
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
    whereHorario.idCliente = usuCli.id;
    whereHorario.estado = true;

    const Reserva = require('../models/reserva.model');
    const Servicio = require('../models/servicio.model');
    const Vehiculo = require('../models/vehiculo.model');
    const Favorito = require('../models/favorito.model');
    const { Usuario } = require('../models/usuario.model');
    const Direccion = require('../models/direccion.model');
    try {
        const reservas = await Reserva.findAll({
            attributes: ['id', 'fecha', 'horaIni', 'duracionTotal','estadoAtencion'],
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
                },
                {
                    model: Direccion,
                    as: 'Local',
                    attributes: ['id', 'direccion','latitud','longitud'],
                    include: [
                        {
                            model: Favorito,
                            attributes: ['id', 'idCliente', 'idLocal', 'estado'],
                            where: { estado: true },
                            required: false,
                        }, 
                    ]
                },
                {
                    model: Usuario,
                    as: 'distrib',
                    attributes: ['id', 'razonSocial', 'nroDocumento', 'idTipoDocumento','nroCel1', 'nroCel2'],
                    where:{
                        estado: 1
                    }
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

    const idCli = req.auth.data.idUsuario;
    //Validamos
    let validator = new Validator(req.body, {
        idLocal: 'required|integer',
    });
    if (validator.fails()) {
        response(res, HttpStatus.UNPROCESABLE_ENTITY, `Falta idLocal`);
        return;
    }

    const data = {
        idLocal: req.body.idLocal,
        idCliente: idCli,
    };
    try {
        const Favorito = require('../models/favorito.model');
        let favorito = await Favorito.create(data);
        response(res, HttpStatus.OK, `Favorito guardado: ${favorito.id}`, { favorito: favorito });
    } catch (error) {
        response(res, HttpStatus.INTERNAL_SERVER_ERROR, `Error al guardar favorito`);
    }
};


const obtenerLocalesFavoritos = async (req, res) => {

    logger.info(`${req.method} ${req.originalUrl}, obteniendo locales favoritos`);

    const idCli = req.auth.data.idUsuario;
    const Direccion = require('../models/direccion.model');
    const Favorito = require('../models/favorito.model');
    const Servicio = require('../models/servicio.model');
    const HorarioConfig = require('../models/horario.config.model');
    const { Usuario } = require('../models/usuario.model');

    let locales = await Direccion.findAll({
        attributes: ['id', 'departamento', 'provincia', 'distrito', 'ubigeo',
            'direccion', 'latitud', 'longitud', 'estado', 'idUsuario'],
        include: [{
            model: Usuario,
            attributes: ['id', 'razonSocial', 'nroDocumento', 'idTipoDocumento', 'nroCel1', 'nroCel2', 'acercaDe', 'path'],
            include: {
                attributes: ['id', 'nombre', 'precio', 'duracion'],
                model: Servicio,
                where: {
                    estado: 1,
                },
            },
            where: {
                estado: true,
                idTipoUsuario: 3,   //distribuidores
            },
        }, {
            model: Favorito,
            attributes: ['id', 'idCliente', 'idLocal', 'estado'],
            where: { estado: true, idCliente: idCli },
            required: true,
        }, {
            model: HorarioConfig,
            attributes: ['id', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
                'horaIni', 'minIni', 'horaFin', 'minFin', 'nroAtenciones'],
            where: { estado: true },
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
        await Favorito.destroy({ where: { id: idFavorito } });
        response(res, HttpStatus.OK, `Favorito eliminado`);
    } catch (error) {
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
            idCliente: usuCli.id,
            [Op.or]: [
                { createdAt: { [Op.gt]: lastSincro } },
                { updatedAt: { [Op.gt]: lastSincro } }
            ]
        }
    } else {
        where = {
            idCliente: usuCli.id,
            estado: true
        }
    }
    const Vehiculo = require('../models/vehiculo.model');
    const vehiculos = await Vehiculo.findAll({
        where: where
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
        attribute: ['id', 'url', 'path', 'mostrar', 'estado'],
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

const eliminarFotoTmp = async (file) => {
    if (!file) return;
    try {
        let { filename, destination } = file;
        await fs.remove(destination + filename);
    } catch (error) {
    }
}

const moverImagen = async (file) => {
    if (!file) return;

    let { filename, destination } = file;

    try {
        //mueve el archivo
        await fs.move(destination + filename, uploadFolder + filename);
    } catch (error) {
        return null;
    }
};


const notificarNuevaReserva = async (idReserva) => {
    const Reserva = require('../models/reserva.model');
    const Servicio = require('../models/servicio.model');
    const Vehiculo = require('../models/vehiculo.model');
    const { Usuario } = require('../models/usuario.model');
    const Direccion = require('../models/direccion.model');
    
    try{
        const reserva = await Reserva.findOne({
            attributes: ['id', 'fecha', 'horaIni', 'duracionTotal'],
            include: [
                {
                    model: Servicio,
                    attributes: ['nombre'],
                },
                {
                    model: Vehiculo,
                    attributes: ['marca', 'modelo', 'year', 'placa']
                }, {
                    model: Usuario,
                    as: "cliente",
                    attributes: ['nombres', 'apellidoPaterno', 'apellidoMaterno'
                        , 'nroDocumento', 'idTipoDocumento','correo','nroCel2']
                }, {
                    model: Direccion,
                    as: 'Local',
                    attributes: ['direccion', 'departamento', 'provincia', 'distrito'],
                },{
                    model: Usuario,
                    as: 'distrib',
                    attributes: ['razonSocial', 'correo','idTipoDocumento','nroDocumento','nroCel2'],
                    where:{
                        estado: 1
                    }
                },
            ],
            where: {id: idReserva},
        });

        if(reserva != null){
            const content = contentNuevaReserva(reserva);
            const msgWhats = mensajeNuevaReserva(reserva);
            enviarCorreo(null, content,`${reserva.distrib.correo},${reserva.cliente.correo}`);
            enviarMensajeWhatsapp(reserva.distrib.nroCel2, msgWhats);
            enviarMensajeWhatsapp(reserva.cliente.nroCel2, msgWhats);
        }
    }catch(e){
        logger.error(e);
    }
}

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