const logger = require('./logger');
const { getNombreDoc, formatFechaHR, concatenarServiciosWhat, formatHorario } = require('./utils');

const mensajeNuevaReserva = (reserva) => {
    return `[CarWash Peru] Nueva reserva: Nro. ${reserva.id} - ${formatFechaHR(reserva.fecha)}
Estimado usuario, se registró una nueva reserva:

*Cliente:*
${reserva.cliente.nombres} ${reserva.cliente.apellidoPaterno} ${reserva.cliente.apellidoMaterno}
${getNombreDoc(reserva.cliente.idTipoDocumento)}: ${reserva.cliente.nroDocumento}
*Distribuidor:*
${reserva.distrib.razonSocial}
${getNombreDoc(reserva.distrib.idTipoDocumento)}: ${reserva.distrib.nroDocumento}
*Local:*
${reserva.Local.departamento} - ${reserva.Local.provincia} - ${reserva.Local.distrito}
${reserva.Local.direccion}
*Vehículo:*
${reserva.Vehiculo.marca} ${reserva.Vehiculo.modelo} ${reserva.Vehiculo.year}
${reserva.Vehiculo.placa}
*Fecha y Hora:*
${formatFechaHR(reserva.fecha)}
${formatHorario(reserva.horaIni, reserva.duracionTotal)}
*Servicios:*
${concatenarServiciosWhat(reserva.Servicios)}
`
};

const mensajeNotifDistribActivado = (razSocial, ruc) => {
    return  `[CarWash Peru] Registro de distribuidor (${ruc}) aprobado

Estimado usuario:
Se aprobó el registro como distribuidor a:

*Raz. Social:* ${razSocial}
*Nro. de RUC:* ${ruc}

Ya puede iniciar sesión con su correo y contraseña.`;
};

const mensajeNotifDistribRegistrado = (razSocial, ruc) => {
    return `[CarWash Peru] Registro de distribuidor (${ruc}) pendiente a aprobacion

Estimado usuario:
Se registró como distribuidor a:

*Raz. Social:* ${razSocial}
*Nro. de RUC:* ${ruc}

Está pendiente su aprobación por el administrador.
Se le notificará por este medio las novedades de su registro.`;
}

const mensajeNotifAdminDistribRegistrado = (correo,razSocial, ruc) => {
    return `[CarWash Peru] Se registró distribuidor (${ruc}), pendiente aprobación

Estimado administrador:
Se registró como distribuidor a:

*Raz. Social:* ${razSocial}
*Nro. de RUC:* ${ruc}
*Correo:* ${correo}

Está pendiente su aprobación o rechazo previa verificación.
Acceda a la aplicación para para revisarlo.`
};

const enviarMensajeWhatsapp = async (destino, msg) => {
    try {
        if(destino==null || destino.length == 0){
            return;
        }
        //verifica si el destino contiene 51
        destino = destino.replace(/[\s+-]/, '');
        if (!destino.startsWith('51')) {
            destino = '51' + destino;
        }

        const { Parametro } = require('../models/parametro.model');

        const apiKey = await Parametro.findOne({
            where: {
                clave: 'WHATSAPP_API_KEY',
                estado: 1,
            }
        });

        if (apiKey == null) {
            logger.error("WHATSAPP_API_KEY no configurado");
            return;
        }

        const sender = await Parametro.findOne({
            where: {
                clave: 'WHATSAPP_SENDER',
                estado: 1,
            }
        });

        if (sender == null) {
            logger.error("WHATSAPP_SENDER no configurado");
            return;
        }

        //enviar mensaje
        fetch('https://whatsapp.bluedesk.org/send-message', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'api_key': apiKey.valor,
                'sender': sender.valor,
                'number': destino,
                'message': msg,
            })
        }).then(response => {
            logger.info(JSON.stringify(response));
        });
    } catch (e) {
        logger.error(e);
    }
}

const enviarMensajeAdmins = async (mensaje) => {
    const nrosAdmin = await getNroAdmins();

    nrosAdmin.forEach(nroAdmin => {
        enviarMensajeWhatsapp(nroAdmin, mensaje);
    });
}

const getNroAdmins = async () => {
    const {Usuario} = require('../models/usuario.model');
    const admins = await Usuario.findAll({
        attributes: ['nroCel2'],
        where: {idTipoUsuario: 1, estado: 1}    //Admin, Activo(1)
    });
    const nrosAdmin = admins.map(e => e.correo);
    return nrosAdmin;
};

module.exports = {
    enviarMensajeWhatsapp, 
    mensajeNuevaReserva,
    mensajeNotifDistribActivado,
    mensajeNotifDistribRegistrado,
    mensajeNotifAdminDistribRegistrado,
    enviarMensajeAdmins,
};