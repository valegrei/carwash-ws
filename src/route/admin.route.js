const express = require('express');
const {
    getUsuarios,
    modificarUsuario,
    obtenerAnuncios,
    crearAnuncio,
    actualizarAnuncio,
    eliminarAnuncio,
    agregarAdmin,
    getParametros,
    actualizarParametros,
    actualizarParametrosCorreo,
    actualizarParametrosSMTP,
    probarCorreo,
    cambiarPassword,
} = require('../controller/admin.controller');
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

const adminRoutes = express.Router();


adminRoutes.route('/parametros')
    .get(getParametros)
    .put(actualizarParametros);

adminRoutes.route('/parametros/smtp')
    .put(actualizarParametrosSMTP);

adminRoutes.route('/parametros/correo')
    .post(probarCorreo)
    .put(actualizarParametrosCorreo);

adminRoutes.route('/usuarios')
    .get(getUsuarios)
    .post(agregarAdmin);

adminRoutes.route('/usuarios/:id')
    .put(modificarUsuario);

adminRoutes.route('/usuarios/:id/password')
    .put(cambiarPassword);

adminRoutes.route('/anuncios')
    .get(obtenerAnuncios)
    .post(upload.single('imagen'), crearAnuncio)
    .delete(eliminarAnuncio);

adminRoutes.route('/anuncios/:id')
    .put(upload.single('imagen'), actualizarAnuncio);

module.exports = adminRoutes;