const express = require('express');
const {
    agregarServicio,
    obtenerServicios,
    modificarServicio,
    obtenerHorariosConfig,
    agregarHorarioConfig,
    modificarHorarioConfig,
    eliminarHorarioConfig,
} = require('../controller/distrib.controller');

const distribRoutes = express.Router();

distribRoutes.route('/servicio')
    .get(obtenerServicios)
    .post(agregarServicio)
    .put(modificarServicio);

distribRoutes.route('/horarioConfig')
    .get(obtenerHorariosConfig)
    .post(agregarHorarioConfig);

distribRoutes.route('/horarioConfig/:idHorarioConfig')
    .put(modificarHorarioConfig)
    .delete(eliminarHorarioConfig);

module.exports = distribRoutes;