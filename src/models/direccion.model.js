const { DataTypes, Model } = require('sequelize');
const db = require('.');
const {Usuario} = require('./usuario.model');

class Direccion extends Model{}

Direccion.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(200)
    },
    latitud: {
        type: DataTypes.DECIMAL(8,6),
    },
    longitud: {
        type: DataTypes.DECIMAL(9,6),
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    }
}, {
    sequelize: db.sequelize
});
Direccion.belongsTo(Usuario, {foreignKey: 'idUsuario'});

module.exports = Direccion;