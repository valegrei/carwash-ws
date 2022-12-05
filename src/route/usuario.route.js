const express = require('express');
const {getUsuario, updateUsuario} = require('../controller/usuario.controller');

const usuarioRoutes = express.Router();

usuarioRoutes.route('/:id')
    .get(getUsuario)
    .put(updateUsuario);

module.exports = usuarioRoutes;