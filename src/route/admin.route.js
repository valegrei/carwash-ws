const express = require('express');
const {getUsuarios, modificarUsuario,obtenerAnuncios, crearAnuncio, actualizarAnuncio, eliminarAnuncio} = require('../controller/admin.controller');
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

const adminRoutes = express.Router();

adminRoutes.route('/usuarios')
    .get(getUsuarios);

adminRoutes.route('/usuarios/:id')
    .put(modificarUsuario);

adminRoutes.route('/anuncios')
    .get(obtenerAnuncios)
    .post(upload.single('imagen'),crearAnuncio)
    .delete(eliminarAnuncio);

adminRoutes.route('/anuncios/:id')
    .put(actualizarAnuncio);

module.exports = adminRoutes;