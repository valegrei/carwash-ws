const { DataTypes, Model } = require('sequelize');
const db = require('.');
const {Usuario} = require('./usuario.model');

class Servicio extends Model{}

Servicio.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(50)
    },
    precio: {
        type: DataTypes.DECIMAL(18,2),
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    }
}, {
    sequelize: db.sequelize
});
Usuario.hasMany(Servicio);
Servicio.belongsTo(Usuario);

module.exports = Servicio;