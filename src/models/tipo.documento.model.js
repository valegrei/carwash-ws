const { DataTypes, Model } = require('sequelize');
const db = require('.');

class TipoDocumento extends Model{}

TipoDocumento.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING(4)
    },
    cntDigitos: {
        type: DataTypes.INTEGER
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1
    }
}, {
    sequelize: db.sequelize,
    timestamps: false
});

module.exports = TipoDocumento;