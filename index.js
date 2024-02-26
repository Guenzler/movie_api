const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
const cors = require('cors');
const { check, validationResult } = require('express-validator');

//mongoose.connect('mongodb://localhost:27017/movieDB');
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const express = require('express'),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
  morgan = require('morgan'),
  fs = require('fs'),
  path = require('path');

const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

// log to console
app.use(morgan('common'));

// log to log.txt
app.use(morgan('short', { stream: accessLogStream }));

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());  //allow requests from all origins

/* use this part to allow requests only from certain origins
let allowedOrigins = ['http://localhost:8080', 'https://localhost:8080', 'http://testsite.com', 'https://testsite.com'];
app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));
*/

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

// Add new user
/* expect JSON in this format
{
  username: String, (required)
  password: String, (required)
  email: String, (required)
  birthdate: Date
}*/

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

//update user information, by old username
/* expect JSON in this format
{
  username: String (required)
  password: String (required),
  email: String (required),
  birthdate: Date
}*/
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

// Add a movie to a user's list of favorites
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

// Delete a movie from a user's list of favorites
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
        res.status(200).send('Movie with ID ' + req.params.MovieID + 'was successfully deleted from favorite movie list');
      } else {
        res.status(400).send("User not found");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//delete registered user from database
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

// default response when at /
app.get('/', (req, res) => {
  res.status(200).send('Welcome to this movie app');
});

// get a list of all movies
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

// get movie by title
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

// get genre description by title
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

// get info about director by name
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

// show list of favorite movies to user
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

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});