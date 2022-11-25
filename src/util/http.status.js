const HttpStatus = {
    OK: { code: 200, status: 'OK'},
    CREATED: { code: 201, status: 'CREATED'},
    NO_CONTENT: { code: 204, status: 'NO_CONTENT'},
    BAD_REQUEST: { code: 400, status: 'BAD_REQUEST'},
    UNAUTHORIZED: {code: 401, status: 'UNAUTHORIZED'},
    NOT_FOUND: { code: 404, status: 'NOT_FOUND'},
    UNPROCESABLE_ENTITY: { code: 422, status: 'UNPROCESABLE_ENTITY'},
    INTERNAL_SERVER_ERROR: { code: 500, status: 'INTERNAL_SERVER_ERROR'}
};

module.exports = HttpStatus;