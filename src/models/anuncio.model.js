const { DataTypes, Model } = require('sequelize');
const db = require('.');
const Archivo = require('./archivo.model');

class Anuncio extends Model{}

Anuncio.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    descripcion: {
        type: DataTypes.STRING(100)
    },
    url: {
        type: DataTypes.STRING(250)
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    }
}, {
    sequelize: db.sequelize
});

Anuncio.belongsTo(Archivo,{foreignKey: 'idArchivo'});

module.exports = Anuncio;