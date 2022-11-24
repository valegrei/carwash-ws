const Response = require('../domain/response');
const logger = require('../util/logger');
const jwt = require('jsonwebtoken');
const HttpStatus = require('../util/http.status');
const dotenv = require('dotenv');
const isEmail = require('validator/lib/isEmail');
//const Usuario = require('../models/usuario.model');
const crypto = require('crypto');

dotenv.config();

const login = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Iniciando sesion`);

    let correo = req.body.correo;
    let clave = req.body.clave;
    //Validando request body
    if(!correo || !isEmail(correo)){
        res.status(HttpStatus.OK.code)
        .send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, `Correo no válido.`));
        return;
    }
    if(!clave){
        res.status(HttpStatus.OK.code)
        .send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, `Contraseña vacía.`));
        return;
    }

    //Consultamos a BD
    const usuario = await Usuario.findOne({ where: {correo: correo}});
    if(!usuario){
        //No hay correo registrado
        res.status(HttpStatus.OK.code)
        .send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, `Correo no registrado.`));
        return;
    }
    if(usuario.clave === crypto.createHmac('sha256', clave)){
        //Se comprueba si la clave es correcta
        let exp = Math.floor(Date.now() / 1000) + (60 * 60);
        let expDate = (new Date(exp*1000)).toISOString();
        let token = jwt.sign({
            exp: exp,
            data: usuario
        }, process.env.TOKEN_SECRET,{
            algorithm: 'HS256',
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE
        });
        res.status(HttpStatus.OK.code)
        .send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, `Sesión iniciada`, {
            exp: expDate,
            usuario: usuario,
            jwt: token
        }));
    }else{
        //Clave incorrecta
        res.status(HttpStatus.OK.code)
        .send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, `Clave incorrecta`));
    }
};

const signUp = (req, res) => {

};

module.exports = {login, signUp};