const express = require('express');
const {login, signUp, confirmarCorreo} = require('../controller/auth.controller');

const authRoutes = express.Router();

authRoutes.route('/login')
    .post(login);

authRoutes.route('/signup')
    .post(signUp);

authRoutes.route('/verify')
    .post(confirmarCorreo);

module.exports = authRoutes;