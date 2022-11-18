import express from 'express';
import {getUsuarios, getUsuario, createUsuario, deleteUsuario, updateUsuario} from '../controller/usuario.controller.js';

const usuarioRoutes = express.Router();

usuarioRoutes.route('/')
    .get(getUsuarios)
    .post(createUsuario);

usuarioRoutes.route('/:id')
    .get(getUsuario)
    .put(getUsuario)
    .delete(deleteUsuario);

export default usuarioRoutes;