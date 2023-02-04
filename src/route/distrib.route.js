const express = require('express');
const {
    agregarServicio,
    obtenerServicios,
    modificarServicio,
    obtenerHorariosConfig,
    agregarHorarioConfig,
    modificarHorarioConfig,
    eliminarHorarioConfig,
    obtenerReservas,
    editarReserva,
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

distribRoutes.route('/reserva')
    .get(obtenerReservas);

distribRoutes.route('/reserva/:idReserva')
    .put(editarReserva);

module.exports = distribRoutes;