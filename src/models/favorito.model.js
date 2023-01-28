const { DataTypes, Model } = require('sequelize');
const db = require('.');
const {Usuario} = require('./usuario.model');
const Direccion = require('./direccion.model');

class Favorito extends Model{}

Favorito.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    },
}, {
    sequelize: db.sequelize,
});
Usuario.hasMany(Favorito, {as: 'Cliente', foreignKey: 'idCliente'});
Favorito.belongsTo(Direccion, {as: 'Local', foreignKey: 'idLocal'});
Direccion.hasMany(Favorito, {foreignKey: 'idLocal'});

module.exports = Favorito;