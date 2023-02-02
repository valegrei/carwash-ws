const express = require('express');
const {
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

const upload = multer({ storage: storage });

const clienteRoute = express.Router();

clienteRoute.route('/vehiculos')
  .get(obtenerVehiculos)
  .post(upload.single('imagen'), crearVehiculo)

clienteRoute.route('/vehiculos/:idVehiculo')
  .put(upload.single('imagen'), actualizarVehiculo)
  .delete(eliminarVehiculo);

clienteRoute.route('/locales')
  .get(obtenerLocales);

clienteRoute.route('/horarios')
  .get(obtenerHorarios);

clienteRoute.route('/favoritos')
  .get(obtenerLocalesFavoritos)
  .post(agregarFavorito);

clienteRoute.route('/favoritos/:idFavorito')
  .delete(eliminarFavorito);

clienteRoute.route('/reserva')
  .post(crearReserva)
  .get(obtenerReservas);

clienteRoute.route('/reserva/:idReserva')
  .delete(anularReserva);

clienteRoute.route('/anuncios')
  .get(obtenerAnuncios);
  
module.exports = clienteRoute;