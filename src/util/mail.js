const nodemailer = require('nodemailer');
const logger = require('./logger');
const { getNombreDoc, formatFechaHR, concatenarServicios, formatHorario } = require('./utils');

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

const enviarCorreoAdmins = async (content) => {
    const {correoServer, passServer} = await getCorreoServer();
    const correosAdmin = await getCorreoAdmins();

    enviarCorreoGen(
        correoServer,
        passServer,
        correoServer,
        correosAdmin,
        content,
    );
}

const enviarCorreo = async (correoDestino, content, correoCCO = null) => {
    const {correoServer, passServer} = await getCorreoServer();
    enviarCorreoGen(
        correoServer,
        passServer,
        correoDestino,
        correoCCO,
        content,
    );
}

const enviarCorreoGen = async (correoDesde, passDesde, correoDestino, correosCCO, content)=>{
    const {host, port, secure} = await getConfigSMTP();
    let mailOptions = {
        from: correoDesde,
        to: correoDestino,
        bcc: correosCCO,
        subject: content.subject,
        text: content.text,
        html: content.html,
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
    return {
        subject: `[CarWash Peru] Registro de distribuidor (${ruc}) aprobado`,
        text: `Estimado usuario:\nSe aprobó el registro como distribuidor a:\n\nRaz. Social:\t${razSocial}\nNro. de RUC:\t${ruc}\n\nYa puede iniciar sesión con su correo y contraseña.`   
    };
};

const contentNotifDistribRegistrado = (razSocial, ruc) => {
    return {
        subject: `[CarWash Peru] Registro de distribuidor (${ruc}) pendiente a aprobacion`,
        text: `Estimado usuario:\n\nSe registró como distribuidor a:\n\nRaz. Social:\t${razSocial}\nNro. de RUC:\t${ruc}\n\nEstá pendiente su aprobación por el administrador.\nSe le notificará por este medio las novedades de su registro.`   
    };
};

const contentNotifAdminRegistrado = (correo, clave) => {
    return {
        subject: `[CarWash Peru] Acceso como administrador`,
        text: `Estimado usuario:\n\nSu correo se registró como administrador en nuestra aplicación.\nPuede iniciar sesión en el aplicativo con las siguientes credenciales\n\nCorreo: ${correo}\nClave: ${clave}`   
    };
};

const contentNotifAdminDistribRegistrado = (correo,razSocial, ruc) => {
    return {
        subject: `[CarWash Peru] Se registró distribuidor (${ruc}), pendiente aprobación`,
        text: `Estimado administrador:\n\nSe registró como distribuidor a:\n\nRaz. Social:\t${razSocial}\nNro. de RUC:\t${ruc}\nCorreo:\t\t${correo}\n\nEstá pendiente su aprobación o rechazo previa verificación.\nAcceda a la aplicación para para revisarlo.`   
    };
};

const contentVerificacion = (codigo) => {
    return {
        subject: `[CarWash Peru] Código de verificación de correo: ${codigo}`,
        text: `Estimado usuario:\n\nSe generó el siguiente código para verificar su correo\n\n${codigo}\n\nPor favor introducirlo en la aplicación antes que expire.`   
    };
}

const contentNuevaClave = (codigo) => {
    return {
        subject: `[CarWash Peru] Código para renovar clave: ${codigo}`,
        text: `Estimado usuario:\n\nSe generó el siguiente código para renovar su clave secreta.\n\n${codigo}\n\nPor favor introducirlo en la aplicación antes que expire. Si no solicitó renovar su contraseña, ignore este correo.`
    };
};

const notificarNuevaReserva = async (idReserva) => {
    const Reserva = require('../models/reserva.model');
    const Servicio = require('../models/servicio.model');
    const Vehiculo = require('../models/vehiculo.model');
    const { Usuario } = require('../models/usuario.model');
    const Direccion = require('../models/direccion.model');
    
    try{
        const reserva = await Reserva.findOne({
            attributes: ['id', 'fecha', 'horaIni', 'duracionTotal'],
            include: [
                {
                    model: Servicio,
                    attributes: ['nombre'],
                },
                {
                    model: Vehiculo,
                    attributes: ['marca', 'modelo', 'year', 'placa']
                }, {
                    model: Usuario,
                    as: "cliente",
                    attributes: ['nombres', 'apellidoPaterno', 'apellidoMaterno'
                        , 'nroDocumento', 'idTipoDocumento','correo']
                }, {
                    model: Direccion,
                    as: 'Local',
                    attributes: ['direccion', 'departamento', 'provincia', 'distrito'],
                },{
                    model: Usuario,
                    as: 'distrib',
                    attributes: ['razonSocial', 'correo','idTipoDocumento','nroDocumento'],
                    where:{
                        estado: 1
                    }
                },
            ],
            where: {id: idReserva},
        });

        if(reserva != null){
            const content = contentNuevaReserva(reserva);
            enviarCorreo(null, content,`${reserva.distrib.correo},${reserva.cliente.correo}`);
        }
    }catch(e){
        logger.error(e);
    }
}

const contentNuevaReserva = (reserva) => {
    return {
        subject: `[CarWash Peru] Nueva reserva: Nro. ${reserva.id} - ${formatFechaHR(reserva.fecha)}`,
        html: `
        <p>Estimado usuario:</p>
        
        <p>Se registr&oacute; una nueva reserva:</p>
        
        <table border="1" cellpadding="10" cellspacing="0">
            <tbody>
                <tr>
                    <td><strong>Cliente</strong></td>
                    <td>${reserva.cliente.nombres} ${reserva.cliente.apellidoPaterno} ${reserva.cliente.apellidoMaterno}
                    <br />${getNombreDoc(reserva.cliente.idTipoDocumento)}: ${reserva.cliente.nroDocumento}</td>
                </tr>
                <tr>
                    <td><strong>Distribuidor</strong></td>
                    <td>${reserva.distrib.razonSocial}
                    <br />${getNombreDoc(reserva.distrib.idTipoDocumento)}: ${reserva.distrib.nroDocumento}</td>
                </tr>
                <tr>
                    <td><strong>Local</strong></td>
                    <td>${reserva.Local.departamento} - ${reserva.Local.provincia} - ${reserva.Local.distrito}
                    <br />${reserva.Local.direccion}</td>
                </tr>
                <tr>
                    <td><strong>Veh&iacute;culo</strong></td>
                    <td>${reserva.Vehiculo.marca} ${reserva.Vehiculo.modelo} ${reserva.Vehiculo.year}
                    <br />${reserva.Vehiculo.placa}</td>
                </tr>
                <tr>
                    <td><strong>Fecha y Hora</strong></td>
                    <td>${formatFechaHR(reserva.fecha)}<br />${formatHorario(reserva.horaIni, reserva.duracionTotal)}</td>
                </tr>
                <tr>
                    <td><strong>Servicios</strong></td>
                    <td>
                    <ul>
                        ${concatenarServicios(reserva.Servicios)}
                    </ul>
                    </td>
                </tr>
            </tbody>
        </table>
        `
    };
};

const contentTest = () => {
    return {
        subject: `[CarWash Peru] Prueba de correo exitosa`,
        text: `Estimado usuario:\n\nSe comprobó la configuración del correo electrónico del servidor.`
    };
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
    notificarNuevaReserva,
};