const jwtSecret = 'your_jwt_secret'; // This has to be the same key used in the JWTStrategy

const jwt = require('jsonwebtoken'),
    passport = require('passport');

require('./passport'); //my local passport file

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.username, //This is the username that will be encoded i the JWT
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


/* with the command passport.authenticate(...) the passport strategy is called and executed; 'local' meaning the localStrategy
passport.authenticate is middleware function and takes the login data from the req.body
It then authenticates the user and calls the callback function with the parameters (null, false, {message: Incorrect username or password.'}) if the username doesn't exist, 
the paramters (null, user) if it finds the user, and (error) if there is an unspecified error. 
About login: passport exposes a login(user, function()) function on req that can be used to establish a login session. when the login operation completes, user will be assigned to req.user */
