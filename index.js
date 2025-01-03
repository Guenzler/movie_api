const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
const cors = require('cors');
const { check, validationResult } = require('express-validator');
let swaggerJsdoc = require('swagger-jsdoc'),
  swaggerUi = require('swagger-ui-express');

//mongoose.connect('mongodb://localhost:27017/movieDB'); //for local testing
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const express = require('express'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  fs = require('fs'),
  path = require('path');

const app = express();

// log to console
app.use(morgan('common'));

/* disable logging to file for live app
// log to log.txt
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });
app.use(morgan('short', { stream: accessLogStream }));
*/

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//app.use(cors());  //allow requests from all origins

/**
 * Array of allowed origins for CORS.
 * @name allowedOrigins
 * @type {string[]}
 */
let allowedOrigins = ['http://localhost:8080', 'https://localhost:8080', 'https://movie-app-483832.netlify.app', 'https://guenzler.net', 'https://movieapp.guenzler.net'];
/**
 * CORS configuration 
 * @name configCORS
 * @param {Object} app - The Express app instance.
 * @param {Array<string>} allowedOrigins - List of allowed origins.
 */
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) { // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application does not allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

/**
 * Swagger configuration options.
 * @name configSwagger
 * @type {Object}
 */
var options = {
  swaggerDefinition: {
    openapi: "3.1.0",
    info: {
      title: "My Movie API",
      version: "1.0.0",
      description: "Server side component of web application that will allow users register, login, update user information and deregister. Registered users will be able to access information about movies",
    },
  },
  apis: ["./swagger.yaml"],
};
/**
 * Swagger specifications generated from the options.
 * @type {Object}
 */
var swaggerSpecs = swaggerJsdoc(options);

/**
 * Sets up Swagger UI middleware for the Express app.
 * @name setUpSwagger
 * @param {string} path - The path where Swagger UI will be available.
 * @param {function} serve - The Swagger UI serve middleware.
 * @param {function} setup - The Swagger UI setup middleware.
 */
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

/**
 * Create a new user
 * @name CreateUser
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} The created user object
 */
app.post('/users',
  //Validation logic here
  [
    check('username', 'Username is required and must contain at least 5 characters').isLength({ min: 5 }),
    check('username', 'Username must only contain alphanumeric characters').isAlphanumeric(),
    check('password', 'Password is required and must be between 5 and 15 characters long').isLength({ min: 5, max: 15 }),
    check('email', 'Email does not appear to be valid').isEmail()
  ],
  async (req, res) => {

    //check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.password);
    await Users.findOne({ username: req.body.username }) //check if user already exists
      .then((user) => {
        if (user) {
          return res.status(400).send('Username ' + req.body.username + ' already exists');
        } else {
          Users
            .create({
              username: req.body.username,
              password: hashedPassword,
              email: req.body.email,
              birthdate: req.body.birthdate
            })
            .then((newUser) => { res.status(201).json(newUser) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            })
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });

/**
 * Update user information
 * @name UpdateUser
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} The updated user object
 */
app.put('/users/:username',
  //Validation logic here
  [
    check('username', 'Username is required and must contain at least 5 characters').isLength({ min: 5 }),
    check('username', 'Username must only contain alphanumeric characters').isAlphanumeric(),
    check('password', 'Password is required and must be between 5 and 15 characters long').isLength({ min: 5, max: 15 }),
    check('email', 'Email does not appear to be valid').isEmail()
  ],

  passport.authenticate('jwt', { session: false }),

  async (req, res) => {

    //check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.password);

    // check if username matches the user saved in token
    if (req.user.username !== req.params.username) {
      return res.status(400).send('Permission denied');
    }

    await Users.findOneAndUpdate({ username: req.params.username }, {
      $set:
      {
        username: req.body.username,
        password: hashedPassword,
        email: req.body.email,
        birthdate: req.body.birthdate
      }
    },
      { new: true })
      .then((updatedUser) => {
        res.status(200).json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      })
  });

/**
 * Add a favorite movie to a user's list
 * @name AddFavoriteMovie
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} The updated user object
 */
app.post('/users/:Username/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {

  // check if username matches the user saved in token
  if (req.user.username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }

  await Users.findOneAndUpdate({ username: req.params.Username },
    {
      $addToSet: { favoriteMovies: req.params.MovieID }
    },
    { new: true })
    .then((updatedUser) => {
      res.status(200).json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Remove a favorite movie from a user's list
 * @name RemoveFavoriteMovie
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} The updated user object
 */
app.delete('/users/:Username/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {

  // check if username matches the user saved in token
  if (req.user.username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }

  await Users.findOneAndUpdate({ username: req.params.Username },
    { $pull: { favoriteMovies: req.params.MovieID } },
    { new: true })
    .then((updatedUser) => {
      if (updatedUser) {
        res.status(200).json(updatedUser);
      } else {
        res.status(400).send("User not found");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Delete a user by username
 * @name DeleteUser
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {string} Success message
 */
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {

  // check if username matches the user saved in token
  if (req.user.username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }

  await Users.findOneAndDelete({ username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send('User ' + req.params.Username + ' was sucessfully deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Welcome message
 * @name /
 * @function
 * @memberof module:routes
 * @returns {string} Welcome message
 */
app.get('/', (req, res) => {
  res.status(200).send('Welcome to this movie app');
});

/**
 * Get a list of all movies
 * @name GetMovies
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object[]} Array of movie objects
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.find()
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Get a movie by title
 * @name GetMovieByTitle
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} The movie object
 */
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ Title: req.params.title })
    .then((movie) => {
      if (movie) {
        res.status(200).json(movie);
      } else {
        res.status(404).send('no movie found');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


/**
 * Get genre description by title
 * @name GetGenreDescription
 * @function
 * @memberof module:routes
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} Object containing genre description
 */
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ "Genre.Name": req.params.genreName })
    .then((movie) => {
      if (movie) {
        res.status(200).json(movie.Genre);
      } else {
        res.status(404).send('Genre not found');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Get movie director by name
 * @name GetMovieDirector
 * @function
 * @memberof module:routes
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} Object containing movie director information
 */
app.get('/movies/directors/:directorName', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ "Director.Name": req.params.directorName })
    .then((movie) => {
      if (movie) {
        res.status(200).json(movie.Director);
      } else {
        res.status(404).send('Director not found');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Get all favorite movies of user
 * @name GetFavoriteMovies
 * @function
 * @memberof module:routes
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Array} Array containing movie IDs
 */
app.get('/users/:Username/favoriteMovies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  Users.findOne({ username: req.params.Username })
    .then((user) => {
      if (user) {
        res.status(200).send(user.favoriteMovies);
      } else {
        res.status(400).send('User not found');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

/**
 * Listen for requests
 * @name ListenRequests
 * @function
 * @memberof module:server
 * @param {number} port - The port number on which the server will listen
 */
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});