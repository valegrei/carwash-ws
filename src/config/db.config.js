const dbConfig = {
    HOST: process.env.DB_HOST,
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    DB: process.env.DB_NAME,
    port: process.env.DB_PORT,
    dialect: "mysql",
    dialectOptions: {
        useUTC: false, // for reading from database
    },
    timezone: '-05:00', // for writing to database
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
};

module.exports = dbConfig;