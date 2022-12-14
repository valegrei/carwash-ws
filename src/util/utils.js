const crypto = require('crypto');

const sha256 = (secret) => {
    return crypto.createHash('sha256').update(secret).digest('hex');
};

const generarCodigo = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

module.exports = {sha256, generarCodigo};