const { DataTypes, Model } = require('sequelize');
const db = require('.');
const Usuario = require('./usuario.model');

class CodigoVerificacion extends Model{}

CodigoVerificacion.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Usuario,
            key: 'id'
        }
    },
    codigo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    exp: {
        type: DataTypes.DATE,
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

module.exports = CodigoVerificacion;