//const jwtSecret = process.env.JWT_SECRETKEY; // This has to be the same key used in the JWTStrategy
const jwtSecret = 'blablabla'; //for local testing

const jwt = require('jsonwebtoken'),
    passport = require('passport');

require('./passport'); //my local passport file

let generateJWTToken = (user) => {
    let tokenUser = {_id: user._id, username: user.username};
    return jwt.sign(tokenUser, jwtSecret, {
        subject: user.username, //This is the username that will be encoded in the JWT
        expiresIn: '7d', //This specifies time of expiration of token
        algorithm: 'HS256' //This is the algorithm used to encode values of JWT
    });
}

/* POST login. */
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', { session: false }, (error, user, info) => {
            if (error || !user) {
                if (info) {
                    return res.status(400).json({
                        message: info,
                        user: user
                    });
                } else {
                    return res.status(400).json({
                        message: 'Something went wrong',
                        user: user
                    });
                }
            }
            req.login(user, { session: false }, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({ user, token });
            });
        })(req, res);
    });
}