const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const logger = require('./logger');

dotenv.config();

const enviarCorreo = (correo, asunto , mensaje)=>{
    var mailOptions = {
        from: process.env.APP_EMAIL_ADDR,
        to: correo,
        subject: asunto,
        text: mensaje
    };

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.APP_EMAIL_ADDR,
          pass: process.env.APP_EMAIL_PASS
        }
    }).sendMail(mailOptions, function(error, info){
        if (error) {
            logger.error(error);
        } else {
            logger.info(`Email sent: ${info.response}`);
        }
    });
};

const contentVerificacion = (nombres, apellidoPaterno, codigo) => {
    const content = {
        subject: `Código de verificación: ${codigo}`,
        body: `Estimado/a ${nombres} ${apellidoPaterno}:\nSe generó el siguiente código para verificar su correo\n\n${codigo}\n\nPor favor introducirlo en la aplicación antes que expire.`   
    }
    return content;
}

const contentNuevaClave = (nombres, apellidoPaterno, codigo) => {
    const content = {
        subject: `Código para renovar clave: ${codigo}`,
        body: `Estimado/a ${nombres} ${apellidoPaterno}:\nSe generó el siguiente código para renovar su clave secreta.\n\n${codigo}\n\nPor favor introducirlo en la aplicación antes que expire. Si no solicitó renovar su contraseña, ignore este correo.`
    }
    return content;
};

module.exports = {enviarCorreo,contentVerificacion,contentNuevaClave};