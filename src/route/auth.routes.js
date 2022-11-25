const express = require('express');
const {login, signUp, confirmarCorreo,solicitarCodigoVerificacion, solicitarCodigoNuevaClave, cambiarClave} = require('../controller/auth.controller');

const authRoutes = express.Router();

authRoutes.route('/login')
    .post(login);

authRoutes.route('/signup')
    .post(signUp);

authRoutes.route('/verify')
    .post(confirmarCorreo);

authRoutes.route('/verify/code')
    .post(solicitarCodigoVerificacion);

authRoutes.route('/renew/code')
    .post(solicitarCodigoNuevaClave);
    
authRoutes.route('/renew')
    .post(cambiarClave);

module.exports = authRoutes;