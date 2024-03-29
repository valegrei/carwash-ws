const dbConfig = require('../config/db.config');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(
    dbConfig.DB,
    dbConfig.USER,
    dbConfig.PASSWORD,
    {
        host: dbConfig.HOST,
        dialect: dbConfig.dialect,
        dialectOptions: dbConfig.dialectOptions,
        timezone: dbConfig.timezone,
        operatorsAliases: 0,
        pool: {
            max: dbConfig.pool.max,
            min: dbConfig.pool.min,
            acquire: dbConfig.pool.acquire,
            idle: dbConfig.pool.idle
        },
        logging: dbConfig.logging,
    }
);

const db = {};

db.sequelize = sequelize;

module.exports = db;