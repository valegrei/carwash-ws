import { DataTypes, Model } from "sequelize";
import TipoDocumento from "./tipo.documento.model";
import TipoUsuario from "./tipo.usuario.model";

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
    verificado: {
        type: DataTypes.BOOLEAN
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1
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
    }
});

export default Usuario;