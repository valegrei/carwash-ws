const { DataTypes, Model } = require('sequelize');
const db = require('.');
const {Usuario} = require('./usuario.model');

class HorarioConfig extends Model{}

HorarioConfig.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    dias: {
        type: DataTypes.STRING(50)
    },
    horaIni: {
        type: DataTypes.TIME,
    },
    horaFin: {
        type: DataTypes.TIME,
    },
    intervalo: {
        type: DataTypes.INTEGER,
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

module.exports = HorarioConfig;