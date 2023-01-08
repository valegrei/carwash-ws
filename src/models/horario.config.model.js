const { DataTypes, Model } = require('sequelize');
const db = require('.');
const {Usuario} = require('./usuario.model');
const Horario = require('./horario.model');
const Direccion = require('./direccion.model');

class HorarioConfig extends Model{}

HorarioConfig.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    lunes: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    martes: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    miercoles: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    jueves: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    viernes: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    sabado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    domingo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    horaIni: {
        type: DataTypes.TINYINT,
        allowNull: false,
    },
    minIni: {
        type: DataTypes.TINYINT,
        allowNull: false,
    },
    horaFin: {
        type: DataTypes.TINYINT,
        allowNull: false,
    },
    minFin: {
        type: DataTypes.TINYINT,
        allowNull: false,
    },
    intervalo: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    },
}, {
    sequelize: db.sequelize
});
HorarioConfig.belongsTo(Usuario, {as: 'Distrib', foreignKey: 'idDistrib'});
HorarioConfig.belongsTo(Direccion, {as: 'Local', foreignKey: 'idLocal'});
HorarioConfig.hasMany(Horario, {as: 'Horario', foreignKey: 'idHorarioConfig'});

module.exports = HorarioConfig;