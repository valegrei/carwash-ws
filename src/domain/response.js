const {formatFechaDB} = require('../util/utils');

class Response {
    constructor(statusCode, httpStatus, message, data){
        this.timeStamp = formatFechaDB(new Date()) //toISOString();
        this.statusCode = statusCode;
        this.httpStatus = httpStatus;
        this.message = message;
        this.data = data;
    }
}

const response = (res, httpStatus, msg, data) => {
    res.status(httpStatus.code)
    .send(new Response(httpStatus.code, httpStatus.status, msg, data));
};

module.exports = {Response, response};