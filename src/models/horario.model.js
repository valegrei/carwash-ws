const { DataTypes, Model } = require('sequelize');
const db = require('.');
const {Usuario} = require('./usuario.model');

class Horario extends Model{}

Horario.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    fecha: {
        type: DataTypes.DATE
    },
    horaIni: {
        type: DataTypes.TIME,
    },
    horaFin: {
        type: DataTypes.TIME,
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    },
    idDistrib: {
        type: DataTypes.INTEGER,
        references: {
            model: Usuario,
            key: 'id',
        }
    },
}, {
    sequelize: db.sequelize
});

module.exports = Horario;