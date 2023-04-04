const {response} = require('../domain/response');
const logger = require('../util/logger');
const jwt = require('jsonwebtoken');
const HttpStatus = require('../util/http.status');
const dotenv = require('dotenv');
const Validator = require('validatorjs');
const {
    enviarCorreo, 
    enviarCorreoAdmins,
    contentVerificacion, 
    contentNuevaClave, 
    contentNotifAdminDistribRegistrado, 
    contentNotifDistribRegistrado
} = require('../util/mail');
const {
    enviarMensajeWhatsapp,
    enviarMensajeAdmins,
    mensajeNotifAdminDistribRegistrado,
    mensajeNotifDistribRegistrado,
} = require('../util/whatsapp');

const {Op} = require('sequelize');
const MINUTO = 60000;   //en milisegundos
const HORA = MINUTO*60;
const DIA = HORA*24;
const MES = DIA*30;
const {generarCodigo, sha256} = require('../util/utils');

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
    const {Usuario}= require('../models/usuario.model');
    const usuario = await Usuario.findOne({
        where: {correo: correo, estado: { [Op.not]: 0 }}    //No Inactivos (0)
    });
    if(!usuario){
        //No hay correo registrado
        response(res,HttpStatus.UNPROCESABLE_ENTITY,`Correo no registrado`);
        return;
    }
    if(usuario.clave === sha256(clave)){//Se comprueba si la clave es correcta
        if(usuario.idTipoUsuario == 3 && usuario.estado == 2){  //Verificando (2) distribuidor
            response(res,HttpStatus.UNPROCESABLE_ENTITY,`Activación de distribuidor pendiente`);
            return;
        }
        if(usuario.estado == 1){    //Activo (1)

            usuario.clave = null;
            let {expDate, token} = generarToken(usuario);
            response(res,HttpStatus.OK,`Sesión iniciada`, {
                exp: expDate,
                usuario: usuario,
                jwt: token
            });
        }else{  //Verificando (2)
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
    const {Usuario} = require('../models/usuario.model');
    const usuExist = await Usuario.findOne({where:{correo: data.correo}});
    if(usuExist){
        if(usuExist.estado != 0){ 
            //Si existe usuario ya registrado
            response(res,HttpStatus.UNPROCESABLE_ENTITY,`Correo ya registrado`);
            return;
        }
        //Usuario Inactivo(0), se elimina
        await usuExist.destroy();
    }
    //Procede a insertar usuario
    Usuario.create(data)
    .then(async nuevoUsuario => {
        let {idTipoUsuario, correo, razonSocial, nroDocumento, nroCel2} = nuevoUsuario;
        
        //TODO: Si el tipo de usuario creado es Distribuidor, comunicar a los administradores para su activacion
        if(idTipoUsuario == 3){ // Verificando(2)
            //Notifico a usuario distribuidor su registro
            const mensajeDis = contentNotifDistribRegistrado(razonSocial, nroDocumento);
            const mensajeDisW = mensajeNotifDistribRegistrado(razonSocial, nroDocumento);
            enviarCorreo(correo, mensajeDis);
            enviarMensajeWhatsapp(nroCel2, mensajeDisW);
            //Notifico a administradores la verificacion y aprobacion del nuevo registro
            const mensajeAdm = contentNotifAdminDistribRegistrado(correo, razonSocial, nroDocumento);
            const mensajeAdmW = mensajeNotifAdminDistribRegistrado(correo, razonSocial, nroDocumento);
            enviarCorreoAdmins(mensajeAdm);
            enviarMensajeAdmins(mensajeAdmW);

            response(res,HttpStatus.OK,`Activación de distribuidor pendiente`,{ usuario: nuevoUsuario});
            return;
        }
        
        await generarCodigoVerificacion(nuevoUsuario);
        response(res,HttpStatus.OK,`Usuario registrado, se envió código de verificación a su correo`, { usuario: nuevoUsuario});
        return;
    }).catch(error => {
        logger.error(error);
        response(res,HttpStatus.INTERNAL_SERVER_ERROR,`Error interno al guardar usuario`);
        return;
    });
};

const generarCodigoVerificacion = async (usuario)=>{
    try{
        //Se genera un codigo de 6 digitos para validar correo
        const CodigoVerificacion = require('../models/codigo.verificacion.model');
        let codigo = generarCodigo();
        let exp = Date.now() + HORA;
        const codVerif = await CodigoVerificacion.create({codigo: codigo, exp: exp});
        await usuario.setCodigoVerificacion(codVerif);
        let {correo} = usuario;
        const content = contentVerificacion(codigo);
        enviarCorreo(correo, content);
    }catch(error){
        logger.error(error);
    }
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
    const {Usuario} = require('../models/usuario.model');
    //busco usuario por id
    let usuarioVerificar = await Usuario.findOne({
        where:{
            id: id, 
            estado: 2,  //Verificando(2)
        }
    })
    if(!usuarioVerificar){
        response(res,HttpStatus.NOT_FOUND,`Usuario no encontrado`);
        return;
    }

    let codigoActual = await usuarioVerificar.getCodigoVerificacion();
    if(codigoActual!=null && codigoActual.codigo == codigo && codigoActual.exp > Date.now()){
        //Codigo valido, se procede a confirmar
        await usuarioVerificar.setCodigoVerificacion(null);
        usuarioVerificar.estado = 1; //Activo(1)
        await usuarioVerificar.save();

        //Se genera nuevo token para sesion
        usuarioVerificar.clave = null;
        let {expDate, token} = generarToken(usuarioVerificar);
        response(res,HttpStatus.OK,`Correo confirmado. Sesión iniciada`, {
            exp: expDate,
            usuario: usuarioVerificar,
            jwt: token
        });
    }else{
        //No hay codigo
        await usuarioVerificar.setCodigoVerificacion(null);
        response(res,HttpStatus.NOT_FOUND,`Código inválido`);
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
    const {Usuario} = require('../models/usuario.model');
    const usuario = await Usuario.findOne({ where: {id: id, estado: { [Op.not]: 0}}});
    if(!usuario){
        //No hay correo registrado
        response(res,HttpStatus.UNPROCESABLE_ENTITY,'Correo no registrado.');
        return;
    }else if(usuario.estado==1){
        //Correo ya fue verificado
        response(res,HttpStatus.UNPROCESABLE_ENTITY,'Correo ya verificado.');
        return;
    }else{  //Estado: Verificando(2)
        let {idTipoUsuario} = usuario;
        if(idTipoUsuario == 3){
            response(res,HttpStatus.UNPROCESABLE_ENTITY,`Activación de distribuidor pendiente`);
            return;
        }

        await generarCodigoVerificacion(usuario);
        
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
    const {Usuario} = require('../models/usuario.model');
    const usuario = await Usuario.findOne({ where: {correo: correo, estado: { [Op.not]: 0}}});
    if(!usuario){
        //No hay correo registrado
        response(res,HttpStatus.UNPROCESABLE_ENTITY,'Correo no registrado.');
        return;
    }else{
        let {idTipoUsuario,estado} = usuario;
        if(idTipoUsuario == 3 && estado == 2){
            response(res,HttpStatus.UNPROCESABLE_ENTITY,`Activación de distribuidor pendiente`);
            return;
        }
        //Se genera un codigo de 6 digitos para validar correo
        const CodigoRenuevaClave = require('../models/codigo.renovar.clave.model');
        let codigo = generarCodigo();
        let exp = Date.now() + HORA;
        const codigoRenCla = await CodigoRenuevaClave.create({codigo: codigo, exp: exp});
        await usuario.setCodigoRenuevaClave(codigoRenCla);

        const content = contentNuevaClave(codigo);
        enviarCorreo(correo, content);
        
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

    const {Usuario} = require('../models/usuario.model');

    const usuario = await Usuario.findOne({
        where: {correo: correo}, estado: { [Op.not]: 0}
    });

    if(!usuario){
        response(res,HttpStatus.UNPROCESABLE_ENTITY,'Correo no registrado.');
        return;
    }else{
        const codigoRenueva = await usuario.getCodigoRenuevaClave();
        if(codigoRenueva!=null && codigoRenueva.codigo == codigo && codigoRenueva.exp > Date.now()){
            //cambia clave
            usuario.clave = sha256(clave);
            await usuario.save();

            await usuario.setCodigoRenuevaClave(null);

            let {estado} = usuario;
            
            if(estado==1){  //Activo(1)
                //se genera nuevo token para iniciar sesion
                usuario.clave = null;
                let {expDate, token} = generarToken(usuario);
                response(res,HttpStatus.OK,`Clave renovada. Sesión iniciada`, {
                    exp: expDate,
                    usuario: usuario,
                    jwt: token
                });
            }else{  //Verificando(2)
                response(res,HttpStatus.OK,`Verificación pendiente`, {
                    usuario: usuario
                });
            }
            
        }else{
            response(res,HttpStatus.UNPROCESABLE_ENTITY,'Código inválido.');
            return;
        }
    }

};

const generarToken = (usuario) => {
    let exp = Math.floor((Date.now() + MES) / 1000);
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