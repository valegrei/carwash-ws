const { response } = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');
const Validator = require('validatorjs');
const { Op } = require('sequelize');


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

    logger.info(`${req.method} ${req.originalUrl}, obteniendo locales cercanos`);

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
        latCorner1: 'required|numeric',
        longCorner1: 'required|numeric',
        latCorner2: 'required|numeric',
        longCorner2: 'required|numeric',
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