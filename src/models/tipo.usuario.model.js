import { DataTypes, Model } from "sequelize";
import db from "./index.js";

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
    sequelize: db.sequelize,
    timestamps: false
});

export default TipoUsuario;