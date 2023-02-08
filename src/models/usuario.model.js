const { DataTypes, Model } = require('sequelize');
const db = require('.');
const CodigoRenuevaClave = require('./codigo.renovar.clave.model');
const CodigoVerificacion = require('./codigo.verificacion.model');

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
}, {
    sequelize: db.sequelize,
    timestamps: false
});

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
}, {
    sequelize: db.sequelize,
    timestamps: false
});

class EstadoUsuario extends Model{}

EstadoUsuario.init({
    id: {
        type: DataTypes.INTEGER,
        allowNulls: false,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING(11),
        timestamps: false
    },
},{
    sequelize: db.sequelize,
    timestamps: false
});

class Usuario extends Model{}

Usuario.init({
    id: {
        type: DataTypes.INTEGER,
        allowNulls: false,
        autoIncrement: true,
        primaryKey: true
    },
    correo: {
        type: DataTypes.STRING(100),
        allowNulls: false,
        unique: true
    },
    clave: {
        type: DataTypes.STRING(64),
        allowNulls: false
    },
    nombres: {
        type: DataTypes.STRING(100)
    },
    apellidoPaterno: {
        type: DataTypes.STRING(50)
    },
    apellidoMaterno: {
        type: DataTypes.STRING(50)
    },
    razonSocial: {
        type: DataTypes.STRING(100)
    },
    nroDocumento: {
        type: DataTypes.STRING(100)
    },
    nroCel1: {
        type: DataTypes.STRING(20)
    },
    nroCel2: {
        type: DataTypes.STRING(20)
    },
    estado: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
        allowNulls: false,
        references: {
            model: EstadoUsuario,
            key: 'id'
        }
    },
    idTipoUsuario: {
        type: DataTypes.INTEGER,
        references: {
            model: TipoUsuario,
            key: 'id'
        }
    },
    idTipoDocumento: {
        type: DataTypes.INTEGER,
        references: {
            model: TipoDocumento,
            key: 'id'
        }
    },
    acercaDe: {
        type: DataTypes.STRING(200)
    },
    path: {
        type: DataTypes.STRING(100)
    },
},{
    sequelize: db.sequelize
});
Usuario.hasOne(CodigoRenuevaClave, {foreignKey: 'idUsuario'});
CodigoRenuevaClave.belongsTo(Usuario, {foreignKey: 'idUsuario'});
Usuario.hasOne(CodigoVerificacion, {foreignKey: 'idUsuario'});
CodigoVerificacion.belongsTo(Usuario, {foreignKey: 'idUsuario'});

module.exports = {
    Usuario,
    EstadoUsuario,
    TipoDocumento,
    TipoUsuario,
};