const { DataTypes, Model } = require('sequelize');
const db = require('.');

class Archivo extends Model{}

Archivo.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    path: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
}, {
    sequelize: db.sequelize
});

module.exports = Archivo;