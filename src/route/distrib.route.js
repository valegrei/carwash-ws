const express = require('express');
const {
    agregarServicio,
    obtenerServicios,
    modificarServicio,
    obtenerDirecciones,
    agregarDireccion,
    modificarDireccion,
    eliminarDireccion,
} = require('../controller/distrib.controller');

const distribRoutes = express.Router();

distribRoutes.route('/:id/servicio')
    .get(obtenerServicios)
    .post(agregarServicio)
    .put(modificarServicio);

distribRoutes.route('/:id/direccion')
    .get(obtenerDirecciones)
    .post(agregarDireccion)

distribRoutes.route('/:id/direccion/:idDireccion')
    .put(modificarDireccion)
    .delete(eliminarDireccion)

module.exports = distribRoutes;