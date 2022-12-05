const express = require('express');
const {getUsuarios, modificarUsuario} = require('../controller/admin.controller');

const adminRoutes = express.Router();

adminRoutes.route('/usuarios')
    .get(getUsuarios);

adminRoutes.route('/usuarios/:id')
    .put(modificarUsuario)

module.exports = adminRoutes;