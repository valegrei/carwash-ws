const logger = require('pino');

const log = logger({
    base: {pid: false},
    transport: {
        target: 'pino-pretty',
        options: {
            colorized: true
        }
    },
    timestamp: () => `,"time": "${new Date().toLocaleString}"`
});

module.exports = log;