const { DataTypes, Model } = require('sequelize');
const db = require('.');
const {Usuario} = require('./usuario.model');
const Direccion = require('./direccion.model');

class Horario extends Model{}

Horario.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    fechaHora: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    horaIni: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    horaFin: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
    },
}, {
    sequelize: db.sequelize,
    indexes: [
        {
            unique: true,
            fields: ['fecha', 'horaIni', 'horaFin', 'idHorarioConfig']
        }
    ]
});
Horario.belongsTo(Usuario, {as: 'Distrib', foreignKey: 'idDistrib'});
Horario.belongsTo(Direccion, {as: 'Local', foreignKey: 'idLocal'});

module.exports = Horario;