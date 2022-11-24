import Response from '../domain/response.js';
import logger from '../util/logger.js';
import jwt from 'jsonwebtoken';
import HttpStatus from '../util/http.status.js';
import dotenv from 'dotenv';
import isEmail from 'validator/lib/isEmail.js';
//import Usuario from '../models/usuario.model.js';
import crypto from 'crypto';

dotenv.config();

export const login = async (req, res) => {
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

export const signUp = (req, res) => {

};