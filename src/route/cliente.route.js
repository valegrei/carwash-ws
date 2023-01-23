const express = require('express');
const {
    obtenerVehiculos,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
    obtenerLocales,
} = require('../controller/cliente.controller');
const multer = require('multer');
const uuid4 = require('uuid4');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'temp_uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, uuid4() + path.extname(file.originalname)) //Appending extension
    }
});

const upload = multer({storage: storage});

const clienteRoute = express.Router();

clienteRoute.route('/vehiculos')
    .get(obtenerVehiculos)
    .post(upload.single('imagen'),crearVehiculo)

clienteRoute.route('/vehiculos/:idVehiculo')
    .put(upload.single('imagen'),actualizarVehiculo)
    .delete(eliminarVehiculo);

clienteRoute.route('/locales')
  .get(obtenerLocales);

module.exports = clienteRoute;