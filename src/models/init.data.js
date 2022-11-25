const TipoDocumento = require('./tipo.documento.model');
const TipoUsuario = require('./tipo.usuario.model');
const Usuario = require('./usuario.model');
const CodigoVerificacion = require('./codigo.verificacion.model');
const CodigoRenuevaClave = require('./codigo.renovar.clave.model copy');
const logger = require('../util/logger');

const initData = async () => {
    logger.info('Cargando datos iniciales en BD...');

    await TipoDocumento.bulkCreate([
        {id: 1, nombre: 'DNI', cntDigitos: 8},
        {id: 2, nombre: 'RUC', cntDigitos: 11},
        {id: 3, nombre: 'CEXT', cntDigitos: 12},
    ],{
        ignoreDuplicates: true
    });
    logger.info('Datos de TipoDocumento cargados');

    await TipoUsuario.bulkCreate([
        {id: 1, nombre: 'Administrador'},
        {id: 2, nombre: 'Cliente'},
        {id: 3, nombre: 'Distribuidor'}
    ],{
        ignoreDuplicates: true
    });
    logger.info('Datos de TipoUsuario cargados');

    await Usuario.bulkCreate([
        {
            id: 1,
            correo: 'valegreib@gmail.com',
            clave: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
            nombres: 'Victor',
            apellidoPaterno: 'Alegre',
            apellidoMaterno: 'Ibáñez',
            idTipoUsuario: 1,
            idTipoDocumento: 1
        },
        {
            id: 2,
            correo: 'victoralegre2910@gmail.com',
            clave: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
            nombres: 'Victor',
            apellidoPaterno: 'Alegre',
            apellidoMaterno: 'Ibáñez',
            idTipoUsuario: 2,
            idTipoDocumento: 1
        },
        /*{
            id: 3,
            correo: 'valegrei@outlook.com',
            clave: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
            nombres: 'Victor',
            apellidoPaterno: 'Alegre',
            apellidoMaterno: 'Ibáñez',
            idTipoUsuario: 3,
            idTipoDocumento: 2
        }*/
    ],{
        ignoreDuplicates: true
    });
    logger.info('Datos de Usuario cargados');
};

module.exports = initData;