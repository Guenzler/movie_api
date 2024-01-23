const express = require('express'),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
  morgan = require('morgan'),
  fs = require('fs'),
  path = require('path');

const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

// user array
let users = [
  {
    id: 1,
    name: "Eva",
    password: "somePassword",
    email: "someEmail",
    dateOfBirth: "1976-08-01",
    favoriteMovies: []
  },
  {
    id: 2,
    name: "Peter",
    password: "somePassword",
    email: "someEmail",
    dateOfBirth: "2001-08-01",
    favoriteMovies: ['Casablanca']
  }
];

// array with three movies
let movies = [
  {
    "Title": "Casablanca",
    "Description": "In Casablanca, Morocco in December 1941, a cynical American expatriate meets a former lover, with unforeseen complications.",
    "Genre": {
      "Name": "Drama",
      "Description": "Drama is a genre in literature, performing arts, and film that focuses on the portrayal of realistic characters, conflicts, and emotions through dialogue and action. This genre aims to engage the audience in a deeply emotional and immersive experience, often highlighting various aspects of human nature, relationships, and societal issues."
    },
    "Director": {
      "Name": "Michael Curtiz",
      "Bio": "Some example text about Bio of Michael Curtiz",
      "Birth": "1886-12-24",
      "Death": "1962-04-10"
    },
    "ImageURL": "https://media.themoviedb.org/t/p/w300_and_h450_bestv2/5K7cOHoay2mZusSLezBOY0Qxh8a.jpg",
    "Featured": false
  },
  {
    "Title": "Modern Times",
    "Description": "A bumbling tramp desires to build a home with a young woman, yet is thwarted time and time again by his lack of experience and habit of being in the wrong place at the wrong time..",
    "Genre": {
      "Name": "Comedy",
      "Description": "Comedy, type of drama or other art form the chief object of which, according to modern notions, is to amuse. It is contrasted on the one hand with tragedy and on the other with farce, burlesque, and other forms of humorous amusement."
    },
    "Director": {
      "Name": "Charles Chaplin",
      "Bio": "Sample text regarding biography of Charles Chaplin",
      "Birth": "1889-04-16",
      "Death": "1977-12-25"
    },
    "ImageURL": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Modern_Times_poster.jpg/220px-Modern_Times_poster.jpg",
    "Featured": false
  },
  {
    "Title": "2001: A Space Odyssey",
    "Description": "Humanity finds a mysterious object buried beneath the lunar surface and sets off to find its origins with the help of HAL 9000, the world's most advanced super computer.",
    "Genre": {
      "Name": "Science Fiction",
      "Description": "fiction dealing principally with the impact of actual or imagined science on society or individuals or having a scientific factor as an essential orienting component."
    },
    "Director": {
      "Name": "Stanley Kubrick",
      "Bio": "Sample text about bio of Stanley Kubrik",
      "Birth": "1928-07-26",
      "Death": "1999-03-07"
    },
    "ImageURL": "https://upload.wikimedia.org/wikipedia/en/thumb/1/11/2001_A_Space_Odyssey_%281968%29.png/220px-2001_A_Space_Odyssey_%281968%29.png",
    "Featured": false
  },
];

// log to console
app.use(morgan('common'));

// log to log.txt
app.use(morgan('short', { stream: accessLogStream }));

app.use(express.static('public'));

app.use(bodyParser.json());

// create new user
app.post('/users', (req, res) => {
  const newUser = req.body;

  if (newUser.name) {
    newUser.id = uuid.v4();
    newUser.favoriteMovies = [];
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(400).send('no name specified in user');
  }
});

//update user information
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find(user => user.id == id);

  if (user) {
    user.name = updatedUser.name;
    user.password = updatedUser.password;
    user.email = updatedUser.email;
    user.dateOfBirth = updatedUser.dateOfBirth;
    res.status(200).json(user);
  } else {
    res.status(400).send('No user with this id found');
  }
});

// add movie to favorite list of user by title
app.post('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    user.favoriteMovies.push(movieTitle);
    res.status(200).send(`Movie name has been added to user ${id}'s list of favorites`);
  } else {
    res.status(400).send('No user with this id found');
  }
});

// delete movie from favorite list of user by title
app.delete('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter(title => title !== movieTitle);
    res.status(200).send(`Movie name has been deleted from user ${id}'s list of favorites`);
  } else {
    res.status(400).send('No user with this id found');
  }
});

// delete user account
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    users = users.filter(user => user.id != id);
    res.status(200).send(`User with id ${id} has been successfully deregistered`);
  } else {
    res.status(400).send('No user with this id found');
  }
});

// get a list of all movies
app.get('/movies', (req, res) => {
  res.status(200).json(movies);
});

// get movie by title
app.get('/movies/:title', (req, res) => {
  const { title } = req.params;
  const movie = movies.find(movie => movie.Title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send('no movie found');
  }
});

app.get('/movies/:title', (req, res) => {
  const { title } = req.params;
  const movie = movies.find(movie => movie.Title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send('no movie found');
  }
});

// get genre description by title
app.get('/movies/genre/:genreName', (req, res) => {
  const { genreName } = req.params;
  const genre = movies.find(movie => movie.Genre.Name === genreName).Genre;

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send('no genre found');
  }
});

// get info about director by name
app.get('/movies/directors/:directorName', (req, res) => {
  const { directorName } = req.params;
  const director = movies.find(movie => movie.Director.Name === directorName).Director;

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send('no director found');
  }
});

// show list of favorite movies to user
app.get('/users/:id/favoriteMovies', (req, res) => {
  const { id } = req.params;
  const user = users.find(user => user.id == id);

  if (user) {
    res.status(200).send(user.favoriteMovies);
  } else {
    res.status(400).send('User not found');
  }
});

// error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// listening on Port 8080
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});