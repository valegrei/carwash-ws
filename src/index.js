const express = require('express');
const ip = require('ip');
const dotenv = require('dotenv');
const cors = require('cors');
const {response} = require('./domain/response');
const HttpStatus = require('./util/http.status');
const authRoutes = require('./route/auth.routes');
const usuarioRoutes = require('./route/usuario.route');
const logger = require('./util/logger');
const db = require('./models');
const initData = require('./models/init.data');
const jwtMiddleware = require('./middleware/jwt.middleware');

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
//Jwt middleware
app.use('/api',jwtMiddleware);
//demas reglas
app.use('/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
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
