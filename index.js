const express = require('express'),
  morgan = require('morgan'),
  fs = require('fs'),
  path = require('path');

const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});

// array with ten movies
let topMovies = [
  { title: 'The Lord of the Rings: The Fellowship of the Ring', director: 'Peter Jackson', writers: 'J.R.R. Tolkien, Fran Walsh, Philippa Boyens' },
  { title: 'The Lord of the Rings, The Two Towers', director: 'Peter Jackson', writers: 'J.R.R. Tolkien, Fran Walsh, Philippa Boyens' },
  { title: 'The Lord of the Rings, The Return of the King', director: 'Peter Jackson', writers: 'J.R.R. Tolkien, Fran Walsh, Philippa Boyens' },
  { title: 'Star Wars: Episode IV - A New Hope', director: 'George Lucas', writers: 'George Lucas' },
  { title: 'Casablanca', director: 'Michael Curtiz', writers: 'Julius J. Epstein, Philip G. Epstein, Howard Koch' },
  { title: 'Modern Times', director: 'Charles Chaplin', writers: 'charles Chaplin' },
  { title: '2001: A Space Odyssey', director: 'Stanley Kubrick', writers: 'Stanley Kubrick, Arthur C. Clarke' },
  { title: 'A Beautiful Mind', director: 'Ron Howard', writers: 'Akiva Goldsman, Sylvia Nasar' },
  { title: 'Bues Brothers', director: 'John Landis', writers: 'Dan Aykroyd, John Landis' },
  { title: 'Harry Potter and the Sorcerer\'s stone', director: 'Chris Columbus', writers: 'J.K. Rowling, Steve Kloves' }
];

// log to console
app.use(morgan('common'));

// log to log.txt
app.use(morgan('short', {stream: accessLogStream}));

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Welcome to my Movie Api!');
});

app.get('/movies', (req, res) => {
  res.json(topMovies);
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