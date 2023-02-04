const { DataTypes, Model } = require('sequelize');
const db = require('.');
const Reserva = require('./reserva.model');
const Servicio = require('./servicio.model');

class ReservaServicios extends Model { }

ReservaServicios.init({
    ReservaId: {
        type: DataTypes.INTEGER,
        references: {
            model: Reserva,
            key: 'id'
        }
    },
    ServicioId: {
        type: DataTypes.INTEGER,
        references: {
            model: Servicio,
            key: 'id'
        }
    },
    precio: {
        type: DataTypes.DECIMAL(18,2),
        allowNull: false,
    },
    duracion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    sequelize: db.sequelize
});
Reserva.belongsToMany(Servicio, {through: 'ReservaServicios'});
Servicio.belongsToMany(Reserva, {through: 'ReservaServicios'});

module.exports = ReservaServicios;