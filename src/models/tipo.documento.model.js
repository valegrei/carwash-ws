import { DataTypes, Model } from "sequelize";
import db from "./index.js";

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

export default TipoDocumento;