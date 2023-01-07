const { DataTypes, Model } = require('sequelize');
const db = require('.');

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
    path: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    mostrar: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
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