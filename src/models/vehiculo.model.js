const { DataTypes, Model } = require('sequelize');
const db = require('.');
const {Usuario} = require('./usuario.model')

class Vehiculo extends Model{}

Vehiculo.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    marca: {
        type: DataTypes.STRING(20)
    },
    modelo: {
        type: DataTypes.STRING(20)
    },
    year: {
        type: DataTypes.SMALLINT
    },
    path: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    }
}, {
    sequelize: db.sequelize
});
Vehiculo.belongsTo(Usuario, {as: 'cliente', foreignKey: 'idCliente'});

module.exports = Vehiculo;