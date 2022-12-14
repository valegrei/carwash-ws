const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const logger = require('./logger');

dotenv.config();


const enviarCorreoAdmins = async (asunto, mensaje) => {
    const {Usuario} = require('../models/usuario.model');
    const admins = await Usuario.findAll({
        attributes: ['correo'],
        where: {idTipoUsuario: 1, estado: 1}    //Admin, Activo(1)
    });
    const correosAdmin = admins.map(e => e.correo).join(',');

    enviarCorreoGen(
        process.env.APP_EMAIL_ADDR,
        process.env.APP_EMAIL_PASS,
        process.env.APP_EMAIL_ADDR,
        correosAdmin,
        asunto,
        mensaje,
    );
}

const enviarCorreo = (correoDestino, asunto, mensaje) => {
    enviarCorreoGen(
        process.env.APP_EMAIL_ADDR,
        process.env.APP_EMAIL_PASS,
        correoDestino,
        null,
        asunto,
        mensaje,
    );
}

const enviarCorreoGen = (correoDesde, passDesde, correoDestino, correosCCO, asunto , mensaje)=>{
    var mailOptions = {
        from: correoDesde,
        to: correoDestino,
        bcc: correosCCO,
        subject: asunto,
        text: mensaje
    };

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: correoDesde,
          pass: passDesde,
        }
    }).sendMail(mailOptions, function(error, info){
        if (error) {
            logger.error(error);
        } else {
            logger.info(`Email sent: ${info.response}`);
        }
    });
};

const contentNotifDistribActivado = (razSocial, ruc) => {
    const content = {
        subject: `Registro de distribuidor (${ruc}) aprobado`,
        body: `Estimados usuario:\nSe aprobó el registro como distribuidor a:\n\nRaz. Social:\t${razSocial}\nNro. de RUC:\t${ruc}\n\nYa puede iniciar sesión con su correo y contraseña.`   
    }
    return content;
};

const contentNotifDistribRegistrado = (razSocial, ruc) => {
    const content = {
        subject: `Registro de distribuidor (${ruc}) pendiente a aprobacion`,
        body: `Estimados usuario:\n\nSe registró como distribuidor a:\n\nRaz. Social:\t${razSocial}\nNro. de RUC:\t${ruc}\n\nEstá pendiente su aprobación por el administrador.\nSe le notificará por este medio las novedades de su registro.`   
    }
    return content;
};

const contentNotifAdminRegistrado = (correo, clave) => {
    const content = {
        subject: `Acceso como administrador`,
        body: `Estimados usuario:\n\nSu correo se registró como administrador en nuestra aplicación.\nPuede iniciar sesión en el aplicativo con las siguientes credenciales\n\nCorreo: ${correo}\nClave: ${clave}`   
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
        body: `Estimado/a usuario/a:\n\nSe generó el siguiente código para verificar su correo\n\n${codigo}\n\nPor favor introducirlo en la aplicación antes que expire.`   
    }
    return content;
}

const contentNuevaClave = (codigo) => {
    const content = {
        subject: `Código para renovar clave: ${codigo}`,
        body: `Estimado/a usuario/a:\n\nSe generó el siguiente código para renovar su clave secreta.\n\n${codigo}\n\nPor favor introducirlo en la aplicación antes que expire. Si no solicitó renovar su contraseña, ignore este correo.`
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
};