const { DataTypes, Model } = require('sequelize');
const db = require('.');
const {Usuario} = require('./usuario.model');
const Horario = require('./horario.model');
const Vehiculo = require('./vehiculo.model');

class Reserva extends Model{}

Reserva.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    },
}, {
    sequelize: db.sequelize,
    indexes:[
        {
            unique: true,
            fields: ['idHorario'],
        },
    ],
});
Reserva.belongsTo(Horario, {foreignKey: 'idHorario'});
Horario.hasOne(Reserva, {foreignKey: 'idHorario'});
Reserva.belongsTo(Usuario, {as: 'cliente', foreignKey: 'idCliente'});
Reserva.belongsTo(Vehiculo, {foreignKey: 'idVehiculo'});

module.exports = Reserva;