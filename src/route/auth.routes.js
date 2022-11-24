const express = require('express');
const {login} = require('../controller/auth.controller');

const authRoutes = express.Router();

authRoutes.route('/login')
    .post(login);

module.exports = authRoutes;