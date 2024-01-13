import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import pg from 'pg';

const db = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT
});

db.connect();

const PUB_KEY = process.env.SECRET;

// TODO
const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: PUB_KEY
};

// TODO
export const auth = (passport) => {

    passport.use(new JwtStrategy(options, async (jwt_payload, done) => {
        try {
            const result = await db.query('SELECT * FROM users WHERE id = $1', [jwt_payload.sub]);
            const user = result.rows[0];

            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch (err) {
            return done(err, false);
        }
    }));

}