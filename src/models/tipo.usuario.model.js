import { DataTypes, Model } from "sequelize";

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
        defaultValue: 1
    }
}, {
    timestamps: false
});

export default TipoUsuario;