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

module.exports = {enviarCorreo};