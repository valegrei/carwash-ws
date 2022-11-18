import express from 'express';
import ip from 'ip';
import dotenv from 'dotenv';
import cors from 'cors';
import Response from './domain/response.js'
import HttpStatus from './controller/usuario.controller.js';
import usuarioRoutes from './route/usuario.route.js';
import logger from './util/logger.js';

dotenv.config();
const PORT = process.env.SERVER_PORT || 3000;
const app = express();
app.use(cors({origin: '*'}));
app.use(express.json());

app.use('/usuarios', usuarioRoutes);
app.get('/', (req, res) => res.send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, 'Carwash API, v1.0.0 - All Systems Go')));
app.get('*', (req, res) => res.status(HttpStatus.NOT_FOUND.code)
    .send(new Response(HttpStatus.NOT_FOUND.code, HttpStatus.NOT_FOUND.status, 'La ruta no existe')));
app.listen(PORT, () => logger.info(`Server runing on: ${ip.address()}:${PORT}`));