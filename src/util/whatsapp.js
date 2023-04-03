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

const enviarMensajeWhatsapp = async (destino, msg) => {
    try {
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

module.exports = {
    enviarMensajeWhatsapp, mensajeNuevaReserva
};