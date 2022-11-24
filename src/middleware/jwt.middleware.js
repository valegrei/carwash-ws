import dotenv from 'dotenv';
import { expressjwt } from "express-jwt";

dotenv.config();

const jwtMiddleware = expressjwt({
    secret: process.env.TOKEN_SECRET,
    algorithms: ["HS256"],
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE
});

export default jwtMiddleware;