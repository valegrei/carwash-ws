const {Usuario,TipoUsuario,TipoDocumento,EstadoUsuario} = require('./usuario.model');
const CodigoVerificacion = require('./codigo.verificacion.model');
const CodigoRenuevaClave = require('./codigo.renovar.clave.model');
const Anuncio = require('./anuncio.model');
const Vehiculo = require('./vehiculo.model');
const {ParametroTipo, Parametro} = require('./parametro.model');
const logger = require('../util/logger');

const initData = async () => {
    logger.info('Cargando datos iniciales en BD...');

    await ParametroTipo.bulkCreate([
        {id: 1, nombre: 'PARAM_SERVER'},
        {id: 2, nombre: 'PARAM_CLIENT'},
    ],{
        ignoreDuplicates: true
    });
    logger.info('Datos de ParametroTipo cargados');

    await Parametro.bulkCreate([
        {clave: 'APP_EMAIL_ADDR', orden: 1, idTipo: 1, valor: 'carwashperuapp@gmail.com'},
        {clave: 'APP_EMAIL_PASS', orden: 1, idTipo: 1, valor: 'buitsphcuodcycjj'},
    ],{
        ignoreDuplicates: true
    });
    logger.info('Datos de Parametros cargados');

    await EstadoUsuario.bulkCreate([
        {id: 0, nombre: 'Inactivo'},
        {id: 1, nombre: 'Activo'},
        {id: 2, nombre: 'Verificando'},
    ],{
        ignoreDuplicates: true
    });
    logger.info('Datos de EstadoUsuario cargados');

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
    ],{
        ignoreDuplicates: true
    });
    logger.info('Datos de Usuario cargados');
};

module.exports = initData;