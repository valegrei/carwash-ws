const express = require('express');
const {
    agregarServicio,
    obtenerServicios,
    modificarServicio
} = require('../controller/distrib.controller');

const distribRoutes = express.Router();

distribRoutes.route('/:id/servicio')
    .get(obtenerServicios)
    .post(agregarServicio)
    .put(modificarServicio);

module.exports = distribRoutes;