import dotenv from "dotenv";
import jwt from 'jsonwebtoken';
dotenv.config();

export function issueJWT(user) {

    const id = user.id;

    const expiresIn = '1d';

    const payload = {
        sub: id,
        iat: Date.now()
    };

    const signedToken = jwt.sign(payload, process.env.SECRET, { expiresIn: expiresIn});

    return {
        token: "Bearer " + signedToken,
        expires: expiresIn
    }
}