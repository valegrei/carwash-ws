const express = require('express');
const ip = require('ip');
const dotenv = require('dotenv');
const cors = require('cors');
const Response = require('./domain/response');
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
db.sequelize.sync({ force: true }).then(()=>{ //sync({ force: true }) "Drop and re-sync db."
    logger.info('Todos los modelos fueron sincronizados con exito!');
    initData();
});
//Jwt middleware
app.use('/api',jwtMiddleware);
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
