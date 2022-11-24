const dotenv = require('dotenv');
const {expressjwt} = require('express-jwt');

dotenv.config();

const jwtMiddleware = expressjwt({
    secret: process.env.TOKEN_SECRET,
    algorithms: ["HS256"],
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE
});

module.exports = jwtMiddleware;