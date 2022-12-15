
const { DataTypes, Model } = require('sequelize');
const db = require('.');


class ParametroTipo extends Model{}

ParametroTipo.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    orden: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    },
}, {
    sequelize: db.sequelize,
    timestamps: false
});

class Parametro extends Model{}

Parametro.init({
    clave: {
        type: DataTypes.STRING(20),
        allowNull: false,
        primaryKey: true,
    },
    idTipo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ParametroTipo,
            key: 'id'
        }
    },
    valor: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    },
}, {
    sequelize: db.sequelize
});

module.exports = {ParametroTipo, Parametro};