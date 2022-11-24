const express = require('express');
const {getUsuarios, getUsuario, createUsuario, deleteUsuario, updateUsuario} = require('../controller/usuario.controller');

const usuarioRoutes = express.Router();

usuarioRoutes.route('/')
    .get(getUsuarios)
    .post(createUsuario);

usuarioRoutes.route('/:id')
    .get(getUsuario)
    .put(getUsuario)
    .delete(deleteUsuario);

module.exports = usuarioRoutes;