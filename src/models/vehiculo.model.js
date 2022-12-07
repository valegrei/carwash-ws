const { DataTypes, Model } = require('sequelize');
const db = require('.');
const Archivo = require('./archivo.model')
const Usuario = require('./usuario.model');

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
    idUsuario: {
        type: DataTypes.INTEGER,
        references: {
            model: Usuario,
            key: 'id'
        }
    },
    idArchivo: {
        type: DataTypes.INTEGER,
        references: {
            model: Archivo,
            key: 'id'
        }
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    }
}, {
    sequelize: db.sequelize
});

module.exports = Vehiculo;