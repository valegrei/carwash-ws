const { DataTypes, Model } = require('sequelize');
const TipoDocumento = require('./tipo.documento.model');
const TipoUsuario = require('./tipo.usuario.model'); 
const db = require('.');
const Archivo = require('./archivo.model');

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
    distAct: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0
    },
    verificado: {
        type: DataTypes.BOOLEAN,
        allowNulls: false,
        defaultValue: 0
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNulls: false
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
},{
    sequelize: db.sequelize
});

Usuario.belongsTo(Archivo,{foreignKey:'idArchivoFoto'});

module.exports = Usuario;