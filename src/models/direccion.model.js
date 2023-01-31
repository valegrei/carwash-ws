const { DataTypes, Model } = require('sequelize');
const db = require('.');
const {Usuario} = require('./usuario.model');

class Direccion extends Model{}

Direccion.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    }, departamento:{
        type: DataTypes.STRING(50),
    }, provincia:{
        type: DataTypes.STRING(50),
    }, distrito:{
        type: DataTypes.STRING(50),
    }, ubigeo:{
        type: DataTypes.STRING(6),
    }, direccion: {
        type: DataTypes.STRING(200),
        allowNull: false,
    }, latitud: {
        type: DataTypes.DECIMAL(8,6),
    }, longitud: {
        type: DataTypes.DECIMAL(9,6),
    }, estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    }, tipo: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
        allowNulls: false
    },
}, {
    sequelize: db.sequelize
});
Direccion.belongsTo(Usuario, {foreignKey: 'idUsuario'});

module.exports = Direccion;