const { DataTypes, Model } = require('sequelize');
const db = require('.');
const {Usuario} = require('./usuario.model');
const Horario = require('./horario.model');
const Vehiculo = require('./vehiculo.model');
const Direccion = require('./direccion.model');

class Reserva extends Model{}

Reserva.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    fechaHora: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    horaIni: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    duracionTotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    },
}, {
    sequelize: db.sequelize,
});
Reserva.hasMany(Horario, {foreignKey: 'idReserva'});
Horario.belongsTo(Reserva, {foreignKey: 'idReserva'});
Reserva.belongsTo(Usuario, {as: 'cliente', foreignKey: 'idCliente'});
Reserva.belongsTo(Vehiculo, {foreignKey: 'idVehiculo'});
Reserva.belongsTo(Usuario, {as: 'distrib', foreignKey: 'idDistrib'});
Reserva.belongsTo(Direccion, {as: 'Local', foreignKey: 'idLocal'});

module.exports = Reserva;