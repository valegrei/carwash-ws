const {response} = require('../domain/response');
const logger = require('../util/logger');
const jwt = require('jsonwebtoken');
const HttpStatus = require('../util/http.status');
const dotenv = require('dotenv');
const Validator = require('validatorjs');
const crypto = require('crypto');
const {enviarCorreo, contentVerificacion, contentNuevaClave} = require('../util/mail');
const {Op} = require('sequelize');

dotenv.config();
//Validator.useLang('es');

const login = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Iniciando sesion`);

    //Validamos
    let validator = new Validator(req.body,{
        correo: 'required|email',
        clave: 'required|string'
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Datos no válidos o incompletos`);
        return;
    }

    let {correo, clave} = req.body;

    //Consultamos a BD
    const Usuario = require('../models/usuario.model');
    const Archivo = require('../models/archivo.model');
    const usuario = await Usuario.findOne({
        include: {
            model: Archivo,
            attributes: ['path']
        },
        where: {correo: correo}
    });
    if(!usuario){
        //No hay correo registrado
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Correo no registrado`);
        return;
    }
    if(usuario.clave === sha256(clave)){//Se comprueba si la clave es correcta
        if(usuario.idTipoUsuario == 3 && !usuario.distAct){
            response(res,HttpStatus.UNPROCESABLE_ENTITY,`Activación de distribuidor pendiente`);
            return;
        }
        if(usuario.verificado){

            usuario.clave = null;
            let {expDate, token} = generarToken(usuario);
            response(res,HttpStatus.OK,`Sesión iniciada`, {
                exp: expDate,
                usuario: usuario,
                jwt: token
            });
        }else{
            response(res,HttpStatus.OK,`Verificación pendiente`, {
                usuario: usuario
            });
        }
        
    }else{
        //Clave incorrecta
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Clave incorrecta`);
    }
};

const signUp = async (req, res) => {
    logger.info(`${req.method} ${req.originalUrl}, Registrando`);

    let validator = new Validator(req.body, {
        correo: 'required|email',
        clave: 'required|string',
        razonSocial: 'string',
        nroDocumento: 'numeric',
        nroCel1: 'string',
        nroCel2: 'string',
        idTipoUsuario: 'required|integer',
        idTipoDocumento: 'required|integer',
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Datos no válidos o incompletos`);
        return;
    }

    let data = {
        correo: req.body.correo,
        clave: sha256(req.body.clave),
        razonSocial: req.body.razonSocial,
        nroDocumento: req.body.nroDocumento,
        nroCel1: req.body.nroCel1,
        nroCel2: req.body.nroCel2,
        idTipoUsuario: req.body.idTipoUsuario,
        idTipoDocumento: req.body.idTipoDocumento
    };

    //Comprobar si correo ya existe
    const Usuario = require('../models/usuario.model');
    const usuExist = await Usuario.findOne({where:{correo: data.correo}});
    if(usuExist){
        //Si existe usuario ya registrado
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Correo ya registrado`);
        return;
    }
    //Procede a insertar usuario
    Usuario.create(data)
    .then(async nuevoUsuario => {
        let {id, correo, idTipoUsuario, distAct} = nuevoUsuario;
        
        //TODO: Si el tipo de usuario creado es Distribuidor, comunicar a los administradores para su activacion
        if(idTipoUsuario == 3 && !distAct){
            response(res,HttpStatus.OK,`Activación de distribuidor pendiente`,{ usuario: nuevoUsuario});
            return;
        }
        //Se genera un codigo de 6 digitos para validar correo
        const CodigoVerificacion = require('../models/codigo.verificacion.model');
        let codigo = generarCodigo();
        let exp = Date.now() + 300000; //expira en 5 min
        await CodigoVerificacion.create({codigo: codigo, exp: exp, idUsuario: id});
        const content = contentVerificacion(codigo);
        enviarCorreo(correo, content.subject, content.body);

        response(res,HttpStatus.OK,`Usuario registrado, se envió código de verificación a su correo`, { usuario: nuevoUsuario});
        return;
    }).catch(error => {
        logger.error(error);
        response(res,HttpStatus.INTERNAL_SERVER_ERROR,`Error interno al guardar usuario`);
        return;
    });
};

const confirmarCorreo = async (req, res) => {
    let validator = new Validator(req.body, {
        id: 'required|integer',
        codigo: 'required|integer'
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Datos no válidos o incompletos`);
        return;
    }

    let {id, codigo} = req.body;

    //Consultamos por codigo vigente
    const CodigoVerificacion = require('../models/codigo.verificacion.model');
    const Usuario = require('../models/usuario.model');
    let codigoActual = await CodigoVerificacion.findOne({
        where: {
            idUsuario: id, 
            codigo: codigo,
            exp: {
                [Op.gt]: Date.now()
            },
            estado: 1
        }
    });
    if(codigoActual){
        //Codigo valido, se procede a confirmar
        codigoActual.estado = 0;
        await codigoActual.save();
        const Archivo = require('../models/archivo.model');

        let usuarioConfirmar = await Usuario.findOne({
            include: {
                model: Archivo,
                attributes: ['path']
            },
            where:{id:id}
        });
        usuarioConfirmar.verificado = 1;
        usuarioConfirmar.save();


        //Se genera nuevo token para sesion
        usuarioConfirmar.clave = null;
        let {expDate, token} = generarToken(usuarioConfirmar);
        response(res,HttpStatus.OK,`Correo confirmado. Sesión iniciada`, {
            exp: expDate,
            usuario: usuarioConfirmar,
            jwt: token
        });
    }else{
        //No hay codigo
        response(res,HttpStatus.NOT_FOUND,`Código inválido`);
        return;
    }
};

const solicitarCodigoVerificacion = async (req, res) => {
    let validator = new Validator(req.body,{
        id: 'required|integer'
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Datos no válidos o incompletos`);
        return;
    }

    let id = req.body.id;

    //Consultamos a BD
    const Usuario = require('../models/usuario.model');
    const usuario = await Usuario.findOne({ where: {id: id}});
    if(!usuario){
        //No hay correo registrado
        response(res,HttpStatus.UNPROCESABLE_ENTITY,'Correo no registrado.');
        return;
    }else{
        let {correo, verificado, idTipoUsuario, distAct} = usuario;
        if(idTipoUsuario == 3 && !distAct){
            response(res,HttpStatus.UNPROCESABLE_ENTITY,`Activación de distribuidor pendiente`);
            return;
        }
        if(verificado){
            //El correo ya fue verificado antes
            response(res,HttpStatus.UNPROCESABLE_ENTITY,'Correo ya verificado.');
            return;
        }
        //Se genera un codigo de 6 digitos para validar correo
        const CodigoVerificacion = require('../models/codigo.verificacion.model');
        let codigo = generarCodigo();
        let exp = Date.now() + 300000; //expira en 5 min
        await CodigoVerificacion.create({codigo: codigo, exp: exp, idUsuario: id});
        const content = contentVerificacion(codigo);
        enviarCorreo(correo, content.subject, content.body);
        
        response(res,HttpStatus.OK,'Se envió código de verificación a su correo.');
    }
};

const solicitarCodigoNuevaClave = async (req, res) => {
    let validator = new Validator(req.body,{
        correo: 'required|email'
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Datos no válidos o incompletos`);
        return;
    }

    let correo = req.body.correo;

    //Consultamos a BD
    const Usuario = require('../models/usuario.model');
    const usuario = await Usuario.findOne({ where: {correo: correo}});
    if(!usuario){
        //No hay correo registrado
        response(res,HttpStatus.UNPROCESABLE_ENTITY,'Correo no registrado.');
        return;
    }else{
        let {id,idTipoUsuario,distAct} = usuario;
        if(idTipoUsuario == 3 && !distAct){
            response(res,HttpStatus.UNPROCESABLE_ENTITY,`Activación de distribuidor pendiente`);
            return;
        }
        //Se genera un codigo de 6 digitos para validar correo
        const CodigoRenuevaClave = require('../models/codigo.renovar.clave.model');
        let codigo = generarCodigo();
        let exp = Date.now() + 300000; //expira en 5 min
        await CodigoRenuevaClave.create({codigo: codigo, exp: exp, idUsuario: id});
        const content = contentNuevaClave(codigo);
        enviarCorreo(correo, content.subject, content.body);
        
        response(res,HttpStatus.OK,'Se envió código para renovar clave.');
    }
};

const cambiarClave = async (req, res) => {
    let validator = new Validator(req.body,{
        correo: 'required|email',
        clave: 'required|string',
        codigo: 'required|integer'
    });
    if(validator.fails()){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Datos no válidos o incompletos`);
        return;
    }

    let {correo, clave, codigo} = req.body;

    const Usuario = require('../models/usuario.model');
    const Archivo = require('../models/archivo.model');
    const CodigoRenuevaClave = require('../models/codigo.renovar.clave.model');

    const usuario = await Usuario.findOne({
        include: {
            model: Archivo,
            attributes: ['path']
        },
        where: {correo: correo}
    });

    if(!usuario){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,'Correo no registrado.');
        return;
    }else{
        let idUsuario = usuario.id;
        const codigoRenueva = await CodigoRenuevaClave.findOne({
            where: {
                idUsuario: idUsuario, 
                codigo: codigo,
                exp: {
                    [Op.gt]: Date.now()
                },
                estado: 1
            }
        });
        if(!codigoRenueva){
            response(res,HttpStatus.UNPROCESABLE_ENTITY,'Código inválido.');
            return;
        }else{
            //cambia clave
            usuario.clave = sha256(clave);
            await usuario.save();

            codigoRenueva.estado = 0;
            await codigoRenueva.save();

            let {verificado} = usuario;
            
            if(verificado){
                //se genera nuevo token para iniciar sesion
                usuario.clave = null;
                let {expDate, token} = generarToken(usuario);
                response(res,HttpStatus.OK,`Clave renovada. Sesión iniciada`, {
                    exp: expDate,
                    usuario: usuario,
                    jwt: token
                });
            }else{
                response(res,HttpStatus.OK,`Verificación pendiente`, {
                    usuario: usuario
                });
            }
        }
    }

};

const sha256 = (secret) => {
    return crypto.createHash('sha256').update(secret).digest('hex');
};

const generarCodigo = () => {
    return Math.floor(100000 + Math.random() * 900000);
}

const generarToken = (usuario) => {
    let exp = Math.floor(Date.now() / 1000) + (60 * 60);
    let expDate = (new Date(exp*1000)).toISOString();
    let token = jwt.sign({
        exp: exp,
        data: {idUsuario: usuario.id}
    }, process.env.TOKEN_SECRET,{
        algorithm: 'HS256',
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE
    });

    return {expDate, token};
}

module.exports = {login, signUp, confirmarCorreo, solicitarCodigoVerificacion, solicitarCodigoNuevaClave, cambiarClave};