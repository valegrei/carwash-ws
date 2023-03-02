const express = require('express');
const ip = require('ip');
const dotenv = require('dotenv');
const cors = require('cors');
const {response} = require('./domain/response');
const HttpStatus = require('./util/http.status');
const authRoutes = require('./route/auth.routes');
const usuarioRoutes = require('./route/usuario.route');
const distribRoutes = require('./route/distrib.route');
const adminRoutes = require('./route/admin.route');
const clienteRoutes = require('./route/cliente.route');
const logger = require('./util/logger');
const db = require('./models');
const initData = require('./models/init.data');
const jwtMiddleware = require('./middleware/jwt.middleware');
const fs = require('fs-extra');
const {generarHorariosTask,generarTodosHorarios} = require('./util/scheduler');

//Crea directorios para guardar archivos
fs.ensureDir('temp_uploads/',(err) =>{
    if(err) logger.error(err);
});
fs.ensureDir('uploads/images/profile/',(err) =>{
    if(err) logger.error(err);
});
fs.ensureDir('uploads/images/anuncios/',(err) =>{
    if(err) logger.error(err);
});
fs.ensureDir('uploads/images/vehiculos/',(err) =>{
    if(err) logger.error(err);
});

dotenv.config();
const PORT = process.env.SERVER_PORT || 3000;
const app = express();
app.use(cors({origin: '*'}));
app.use(express.json());

//Inicializa Sequelize
db.sequelize.sync().then(()=>{ //sync({ force: true }) "Drop and re-sync db."
    logger.info('Todos los modelos fueron sincronizados con exito!');
    initData();
});

//Job para generar horarios cada mes
generarHorariosTask.start();
//Descomentar si no se han generado horarios en el job
//generarTodosHorarios();

//Jwt middleware
app.use('/api',jwtMiddleware);
app.use('/files',jwtMiddleware);
//demas reglas
app.use('/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/distrib', distribRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/files',express.static('uploads'));
app.get('/', (req, res) => response(res, HttpStatus.OK, 'Carwash API, v1.0.0 - All Systems Go'));
app.use('*', (req, res) => response(res, HttpStatus.NOT_FOUND, 'La ruta no existe'));
app.use(function (err, req, res, next) {    //Manejar error de token invalido
    if (err.name === "UnauthorizedError") {
        response(res, HttpStatus.UNAUTHORIZED, 'Token invalido');
    } else {
        next(err);
    }
});
app.listen(PORT, () => logger.info(`Server runing on: ${ip.address()}:${PORT}`));

