const { DataTypes, Model } = require('sequelize');
const db = require('.');
const Archivo = require('./archivo.model')

class Anuncio extends Model{}

Anuncio.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    titulo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING(300)
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

module.exports = Anuncio;