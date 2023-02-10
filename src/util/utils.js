const crypto = require('crypto');

const sha256 = (secret) => {
    return crypto.createHash('sha256').update(secret).digest('hex');
};

const generarCodigo = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

const formatFechaDB = (d) => {
    return d.getFullYear().toString() + "-" 
    + ((d.getMonth() + 1).toString().length == 2 ? (d.getMonth() + 1).toString() : "0" + (d.getMonth() + 1).toString()) + "-"
     + (d.getDate().toString().length == 2 ? d.getDate().toString() : "0" + d.getDate().toString()) + " " + (d.getHours().toString().length == 2 ? d.getHours().toString() : "0" + d.getHours().toString()) + ":" 
     + (d.getMinutes().toString().length == 2 ? d.getMinutes().toString() : "0" + d.getMinutes().toString()) + ":"
     + (d.getSeconds().toString().length == 2 ? d.getSeconds().toString() : "0" + d.getSeconds().toString());
}

module.exports = { sha256, generarCodigo, formatFechaDB };