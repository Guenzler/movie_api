const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    Models = require('./models.js'),
    passportJWT = require('passport-jwt');

let Users = Models.User,
    JWTStrategy = passportJWT.Strategy,
    ExtractJWT = passportJWT.ExtractJwt;

passport.use(
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
        }, // username and password are the fields within HTML form, if they are named different, this can be specified here
        async (username, password, callback) => {
            console.log(username, password);
            await Users.findOne({ username: username })
                .then((user) => {
                    if (!user) {
                        console.log('incorrect username');
                        return callback(null, false, {
                            message: 'Incorrect username or password.',
                        });
                    }
                    console.log('finished');
                    return callback(null, user);
                })
                .catch((error) => {
                    if (error) {
                        console.error(error);

                        return callback(error);
                    }
                })
        }
    )
);

/* the first parameter is an object that specifys 1. how to extract the token from the request and 2. the key for encryption
then follows the handler which expects the token as its first parameter, the callback funcition as its second parameter */

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'your_jwt_secret'
},
    async (jwtPayload, callback) => {
        return await Users.findById(jwtPayload._id)
            .then((user) => {
                return callback(null, user);
            })
            .catch((error) => {
                return callback(error)
            });
    }));