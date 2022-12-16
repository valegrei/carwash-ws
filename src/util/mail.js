const nodemailer = require('nodemailer');
const logger = require('./logger');

const getCorreoServer = async () => {
    const {Parametro} = require('../models/parametro.model');
    const pCorreo = await Parametro.findOne({where:{clave: 'EMAIL_ADDR'}});
    const pPass = await Parametro.findOne({where:{clave: 'EMAIL_PASS'}});
    const correoServer = pCorreo.valor
    const passServer = pPass.valor
    return {correoServer, passServer};
};

const getCorreoAdmins = async () => {
    const {Usuario} = require('../models/usuario.model');
    const admins = await Usuario.findAll({
        attributes: ['correo'],
        where: {idTipoUsuario: 1, estado: 1}    //Admin, Activo(1)
    });
    const correosAdmin = admins.map(e => e.correo).join(',');
    return correosAdmin;
};

const getConfigSMTP = async () => {
    const {Parametro} = require('../models/parametro.model');
    const pHost = await Parametro.findOne({where:{clave: 'EMAIL_HOST'}});
    const pPort = await Parametro.findOne({where:{clave: 'EMAIL_PORT'}});
    const pSecure = await Parametro.findOne({where:{clave: 'EMAIL_SSL_TLS'}});
    const host = pHost.getDataValue("valor")
    const port = parseInt(pPort.valor)
    const secure = parseInt(pSecure.valor)!=0
    return {host, port, secure};
};

const enviarCorreoAdmins = async (asunto, mensaje) => {
    const {correoServer, passServer} = await getCorreoServer();
    const correosAdmin = await getCorreoAdmins();

    enviarCorreoGen(
        correoServer,
        passServer,
        correoServer,
        correosAdmin,
        asunto,
        mensaje,
    );
}

const enviarCorreo = async (correoDestino, asunto, mensaje) => {
    const {correoServer, passServer} = await getCorreoServer();
    enviarCorreoGen(
        correoServer,
        passServer,
        correoDestino,
        null,
        asunto,
        mensaje,
    );
}

const enviarCorreoGen = async (correoDesde, passDesde, correoDestino, correosCCO, asunto , mensaje)=>{
    const {host, port, secure} = await getConfigSMTP();
    let mailOptions = {
        from: correoDesde,
        to: correoDestino,
        bcc: correosCCO,
        subject: asunto,
        text: mensaje
    };
    let config = {
        //service: 'gmail',
        host: host,
        port: port,
        secure: secure,
        auth: {
          user: correoDesde,
          pass: passDesde,
        }
    }

    nodemailer.createTransport(config)
    .sendMail(mailOptions, function(error, info){
        if (error) {
            logger.error(error);
        } else {
            logger.info(`Email sent: ${info.response}`);
        }
    });
};

const verifyConfig = async (host, port, secure) => {
    try{
        let transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: secure,
        });
        return await transporter.verify();
    }catch(error){
        logger.error(error);
        return false;
    }
};

const contentNotifDistribActivado = (razSocial, ruc) => {
    const content = {
        subject: `Registro de distribuidor (${ruc}) aprobado`,
        body: `Estimado usuario:\nSe aprobó el registro como distribuidor a:\n\nRaz. Social:\t${razSocial}\nNro. de RUC:\t${ruc}\n\nYa puede iniciar sesión con su correo y contraseña.`   
    }
    return content;
};

const contentNotifDistribRegistrado = (razSocial, ruc) => {
    const content = {
        subject: `Registro de distribuidor (${ruc}) pendiente a aprobacion`,
        body: `Estimado usuario:\n\nSe registró como distribuidor a:\n\nRaz. Social:\t${razSocial}\nNro. de RUC:\t${ruc}\n\nEstá pendiente su aprobación por el administrador.\nSe le notificará por este medio las novedades de su registro.`   
    }
    return content;
};

const contentNotifAdminRegistrado = (correo, clave) => {
    const content = {
        subject: `Acceso como administrador`,
        body: `Estimado usuario:\n\nSu correo se registró como administrador en nuestra aplicación.\nPuede iniciar sesión en el aplicativo con las siguientes credenciales\n\nCorreo: ${correo}\nClave: ${clave}`   
    }
    return content;
};

const contentNotifAdminDistribRegistrado = (correo,razSocial, ruc) => {
    const content = {
        subject: `Se registró distribuidor (${ruc}), pendiente aprobación`,
        body: `Estimado administrador:\n\nSe registró como distribuidor a:\n\nRaz. Social:\t${razSocial}\nNro. de RUC:\t${ruc}\nCorreo:\t\t${correo}\n\nEstá pendiente su aprobación o rechazo previa verificación.\nAcceda a la aplicación para para revisarlo.`   
    }
    return content;
};

const contentVerificacion = (codigo) => {
    const content = {
        subject: `Código de verificación de correo: ${codigo}`,
        body: `Estimado usuario:\n\nSe generó el siguiente código para verificar su correo\n\n${codigo}\n\nPor favor introducirlo en la aplicación antes que expire.`   
    }
    return content;
}

const contentNuevaClave = (codigo) => {
    const content = {
        subject: `Código para renovar clave: ${codigo}`,
        body: `Estimado usuario:\n\nSe generó el siguiente código para renovar su clave secreta.\n\n${codigo}\n\nPor favor introducirlo en la aplicación antes que expire. Si no solicitó renovar su contraseña, ignore este correo.`
    }
    return content;
};

const contentTest = () => {
    const content = {
        subject: `Prueba de correo exitosa`,
        body: `Estimado usuario:\n\nSe comprobó la configuración del correo electrónico del servidor.`
    }
    return content;
};

module.exports = {
    enviarCorreo,
    enviarCorreoAdmins,
    contentVerificacion,
    contentNuevaClave, 
    contentNotifDistribActivado,
    contentNotifDistribRegistrado, 
    contentNotifAdminDistribRegistrado,
    contentNotifAdminRegistrado,
    verifyConfig,
    contentTest,
};