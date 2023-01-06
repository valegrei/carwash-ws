const express = require('express');
const {
    agregarServicio,
    obtenerServicios,
    modificarServicio,
    obtenerDirecciones,
} = require('../controller/distrib.controller');

const distribRoutes = express.Router();

distribRoutes.route('/:id/servicio')
    .get(obtenerServicios)
    .post(agregarServicio)
    .put(modificarServicio);
    
distribRoutes.route('/:id/direccion')
    .get(obtenerDirecciones)

module.exports = distribRoutes;