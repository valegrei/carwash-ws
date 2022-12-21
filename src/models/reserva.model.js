const { DataTypes, Model } = require('sequelize');
const db = require('.');
const {Usuario} = require('./usuario.model');
const Servicio = require('./servicio.model');
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
    idHorario: {
        type: DataTypes.INTEGER,
        references: {
            model: Horario,
            key: 'id',
        }
    },
    idCliente: {
        type: DataTypes.INTEGER,
        references: {
            model: Usuario,
            key: 'id',
        }
    },
    idVehiculo: {
        type: DataTypes.INTEGER,
        references: {
            model: Vehiculo,
            key: 'id',
        }
    },
    idServicio: {
        type: DataTypes.INTEGER,
        references: {
            model: Servicio,
            key: 'id',
        }
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    },
}, {
    sequelize: db.sequelize
});

module.exports = Reserva;