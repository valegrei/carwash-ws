const express = require('express');
const {
  getUsuario,
  updateUsuario,
  cambiarPassword,
  obtenerDirecciones,
  agregarDireccion,
  modificarDireccion,
  eliminarDireccion,
} = require('../controller/usuario.controller');
/*const multer  = require('multer');
const path = require('path');
const uuid4 = require('uuid4');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'temp_uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, uuid4() + path.extname(file.originalname)) //Appending extension
    }
});

const upload = multer({storage: storage});*/
const usuarioRoutes = express.Router();

usuarioRoutes.route('/account')
  //.get(getUsuario)
  .put(updateUsuario); //.post(upload.single('foto'),updateUsuario);

usuarioRoutes.route('/pass')
  .put(cambiarPassword);

usuarioRoutes.route('/direccion')
  .get(obtenerDirecciones)
  .post(agregarDireccion);

usuarioRoutes.route('/direccion/:idDireccion')
  .put(modificarDireccion)
  .delete(eliminarDireccion);

module.exports = usuarioRoutes;