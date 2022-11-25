const { DataTypes, Model } = require('sequelize');
const db = require('.');

class TipoUsuario extends Model{}

TipoUsuario.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING(25)
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    }
}, {
    sequelize: db.sequelize,
    timestamps: false
});

module.exports = TipoUsuario;