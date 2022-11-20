import database from '../config/mysql.config.js';
import Response from '../domain/response.js';
import logger from '../util/logger.js';
import QUERY from '../query/auth.query.js';
import jwt from 'jsonwebtoken';
import HttpStatus from '../util/http.status.js';
import dotenv from 'dotenv'

dotenv.config();

export const login = (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Iniciando sesion`);
    database.query(QUERY.SELECT_USUARIO, [req.body.correo], (error, results) => {
        if(!results){
            //No hay correo registrado
            res.status(HttpStatus.OK.code)
            .send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, `Correo no registrado`));
        } else {
            const usuario = results[0]
            //Se comprueba si la clave es correcta
            if(usuario.clave === req.body.clave){
                //La clave coincide, concede token de acceso
                var exp = Math.floor(Date.now() / 1000) + (60 * 60);
                var expDate = (new Date(exp*1000)).toISOString();
                var token = jwt.sign({
                    exp: exp,
                    data: usuario
                }, process.env.TOKEN_SECRET,{
                    algorithm: 'HS256',
                    issuer: 'http://carwashperuapp.com/ws',
                    audience: 'htpp://carwashperuapp.com/app'
                });
                res.status(HttpStatus.OK.code)
                .send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, `Sesion iniciada`, {
                    exp: expDate,
                    usuario: usuario,
                    jwt: token
                }));
            }else{
                //Clave incorrecta
                res.status(HttpStatus.OK.code)
                .send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, `Clave incorrecta`));
            }
        }
    });
};