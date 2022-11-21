import express from 'express';
import ip from 'ip';
import dotenv from 'dotenv';
import cors from 'cors';
import Response from './domain/response.js'
import HttpStatus from './util/http.status.js';
import authRoutes from './route/auth.routes.js';
import usuarioRoutes from './route/usuario.route.js';
import logger from './util/logger.js';
import { expressjwt } from "express-jwt";

dotenv.config();
const PORT = process.env.SERVER_PORT || 3000;
const app = express();
app.use(cors({origin: '*'}));
app.use(express.json());

//Jwt middleware
app.use('/api',
    expressjwt({
      secret: process.env.TOKEN_SECRET,
      algorithms: ["HS256"],
      issuer: 'http://carwashperuapp.com/ws',
      audience: 'htpp://carwashperuapp.com/app'
    })
);
//demas reglas
app.use('/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.get('/', (req, res) => res.send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, 'Carwash API, v1.0.0 - All Systems Go')));
app.use('*', (req, res) => res.status(HttpStatus.NOT_FOUND.code)
    .send(new Response(HttpStatus.NOT_FOUND.code, HttpStatus.NOT_FOUND.status, 'La ruta no existe')));
app.use(function (err, req, res, next) {    //Manejar error de token invalido
    if (err.name === "UnauthorizedError") {
        res.status(HttpStatus.UNAUTHORIZED.code)
        .send(new Response(HttpStatus.UNAUTHORIZED.code, HttpStatus.UNAUTHORIZED.status, 'Token invalido'));
    } else {
        next(err);
    }
});
app.listen(PORT, () => logger.info(`Server runing on: ${ip.address()}:${PORT}`));
