const Response = require('../domain/response');
const logger = require('../util/logger');
const HttpStatus = require('../util/http.status');

const getUsuarios = (req, res) => {
    /*logger.info(`${req.method} ${req.originalUrl}, listando usuarios`);
    database.query(QUERY.SELECT_USUARIOS, (error, results) => {
        if(!results){
            res.status(HttpStatus.OK.code)
            .send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, `No hay usuarios`));
        } else {
            res.status(HttpStatus.OK.code)
            .send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, `Usuarios encontrados`, {usuarios: results}));
        }
    });*/
};

const createUsuario = (req, res) => {
    /*logger.info(`${req.method} ${req.originalUrl}, creando usuario`);
    database.query(QUERY.CREATE_USUARIO_PROCEDURE, Object.values(req.body), (error, results) => {
        if(!results){
            logger.error(error.message);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR.code)
            .send(new Response(HttpStatus.INTERNAL_SERVER_ERROR.code, HttpStatus.INTERNAL_SERVER_ERROR.status, `Ocurrio un error`));
        } else {
            //const usuario = {id: results.insertedId, ...req.body, created_at: new Date() };
            const usuario = results[0][0];
            res.status(HttpStatus.CREATED.code)
            .send(new Response(HttpStatus.CREATED.code, HttpStatus.CREATED.status, `Usuario creado`, {usuario}));
        }
    });*/
};


const getUsuario = (req, res) => {
    /*logger.info(`${req.method} ${req.originalUrl}, obteniendo usuario`);
    database.query(QUERY.SELECT_USUARIO, [req.params.id], (error, results) => {
        if (!results[0]) {
            res.status(HttpStatus.NOT_FOUND.code)
            .send(new Response(HttpStatus.NOT_FOUND.code, HttpStatus.NOT_FOUND.status, `Usuario por id ${req.params.id} no fue encontrado`));
        } else {
            res.status(HttpStatus.OK.code)
            .send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, `Usuario encontrado`, results[0]));
        }
    });*/
};

const updateUsuario = (req, res) => {
    /*logger.info(`${req.method} ${req.originalUrl}, actualizando usuario`);
    database.query(QUERY.SELECT_USUARIO, [req.params.id], (error, results) => {
        if(!results[0]){
            res.status(HttpStatus.NOT_FOUND.code)
            .send(new Response(HttpStatus.NOT_FOUND.code, HttpStatus.NOT_FOUND.status, `Usuario por id ${req.params.id} no fue encontrado`));
        } else {
            logger.info(`${req.method} ${req.originalUrl}, actualizando usuario`);
            database.query(QUERY.UPDATE_USUARIOS, [...Object.values(req.body), req.params.id], (error, results) => {
                if(!error){
                    res.status(HttpStatus.OK.code)
                    .send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, `Usuario actualizado`, {id: req.params.id, ...req.body}));
                } else {
                    logger.error(error.message);
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR.code)
                    .send(new Response(HttpStatus.INTERNAL_SERVER_ERROR.code, HttpStatus.INTERNAL_SERVER_ERROR.status, `Ocurrio un error`));        
                }
            })
        }
    });*/
};

const deleteUsuario = (req, res) => {
    /*logger.info(`${req.method} ${req.originalurl}, eliminando usuario`);
    database.query(QUERY.DELETE_USUARIOS, [req.params.id], (error, results) => {
        if(results.affectedReows > 0){
            res.status(HttpStatus.OK.code)
            .send(new Response(HttpStatus.OK.code, HttpStatus.OK.status, `Usuario eliminado`, results[0]));
        }else{
            res.status(HttpStatus.NOT_FOUND.code)
            .send(new Response(HttpStatus.NOT_FOUND.code, HttpStatus.NOT_FOUND.status, `Usuario por id ${req.params.id} no fue encontrado`));
        }
    });*/
};

module.exports = {getUsuarios, getUsuario, createUsuario, updateUsuario, deleteUsuario};