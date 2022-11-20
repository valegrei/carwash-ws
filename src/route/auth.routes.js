import express from 'express'
import {login} from '../controller/auth.controller.js'

const authRoutes = express.Router();

authRoutes.route('/login')
    .post(login);

export default authRoutes;