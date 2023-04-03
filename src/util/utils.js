const crypto = require('crypto');

const sha256 = (secret) => {
    return crypto.createHash('sha256').update(secret).digest('hex');
};

const generarCodigo = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

const formatFechaDB = (d) => {  //YYYY-MM-dd HH:mm:ss
    return d.getFullYear().toString() + "-" 
    + ((d.getMonth() + 1).toString().length == 2 ? (d.getMonth() + 1).toString() : "0" + (d.getMonth() + 1).toString()) + "-"
     + (d.getDate().toString().length == 2 ? d.getDate().toString() : "0" + d.getDate().toString()) + " " + (d.getHours().toString().length == 2 ? d.getHours().toString() : "0" + d.getHours().toString()) + ":" 
     + (d.getMinutes().toString().length == 2 ? d.getMinutes().toString() : "0" + d.getMinutes().toString()) + ":"
     + (d.getSeconds().toString().length == 2 ? d.getSeconds().toString() : "0" + d.getSeconds().toString());
}

const formatFechaHR = (fechaStr) => {  //YYYY-MM-dd -> dd/MM/YYYY
    return fechaStr.substring(8,10)+"/"+fechaStr.substring(5,7)+"/"+fechaStr.substring(0,4);
}

const formatHorario = (horaIni, duracionTotal) => {
    let hora = parseInt(horaIni.substring(0,2));
    let mins = parseInt(horaIni.substring(3,5));
    let minIni = hora*60 + mins;
    let minFin = minIni + duracionTotal;
    let horaFin = `${Math.floor(minFin/60)}`;
    let minsFin = `${minFin % 60}`;
    let horaFinStr = horaFin.length == 2 ? `${horaFin}` : `0${horaFin}`;
    let minsFinStr = minsFin.length == 2 ? `${minsFin}` : `0${minsFin}`;
    return `${horaIni.substring(0,5)} - ${horaFinStr}:${minsFinStr}`;
}

const getNombreDoc = (idTipoDoc) => {
    switch(idTipoDoc){
        case 1:
            return "DNI";
        case 2:
            return "RUC";
        case 3:
            return "CEXT";
        default:
            return "";
    }
}

const concatenarServicios = (servicios) => {
    let res = "";
    servicios.forEach(serv => {
        res = res + `<li>${serv.nombre}</li>\n`;
    });
    return res;
}

const concatenarServiciosWhat = (servicios) => {
    let res = "";
    servicios.forEach(serv => {
        res = res + `- ${serv.nombre}\n`;
    });
    return res;
}

module.exports = { sha256, generarCodigo, formatFechaDB, getNombreDoc, formatFechaHR, concatenarServicios, formatHorario,concatenarServiciosWhat };