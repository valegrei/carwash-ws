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
}, {
    sequelize: db.sequelize
});
Reserva.belongsToMany(Servicio, {through: 'ReservaServicios'});
Servicio.belongsToMany(Reserva, {through: 'ReservaServicios'});

module.exports = ReservaServicios;