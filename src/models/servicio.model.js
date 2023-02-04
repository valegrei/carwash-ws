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
        type: DataTypes.STRING(50),
        allowNull: false,
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
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    },
}, {
    sequelize: db.sequelize
});
Servicio.belongsTo(Usuario,{as: 'distrib', foreignKey: 'idDistrib'});
Usuario.hasMany(Servicio,{foreignKey: 'idDistrib'});

module.exports = Servicio;