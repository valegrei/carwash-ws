const express = require('express');
const {getUsuarios, getUsuario, updateUsuario, deshabilitarUsuario, habilitarUsuario, 
    cambiarTipoUsuario, habilitarUsuarioDistribuidor} = require('../controller/usuario.controller');

const usuarioRoutes = express.Router();

usuarioRoutes.route('/')
    .get(getUsuarios);

usuarioRoutes.route('/:id')
    .get(getUsuario)
    .put(updateUsuario);

usuarioRoutes.route('/:id/estado')
    .put(habilitarUsuario)
    .delete(deshabilitarUsuario);

usuarioRoutes.route('/:id/tipo')
    .put(cambiarTipoUsuario);

usuarioRoutes.route('/:id/dist')
    .put(habilitarUsuarioDistribuidor);

module.exports = usuarioRoutes;