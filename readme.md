# A Movie Api

## Project description
This API is the server-side component of a web application that will provide users with access to information about different movies, directors, and genres. Users will be able to sign up, update their personal information, and create a list of their favorite movies.
The project is currently online at https://movie-app-2024-716106e34297.herokuapp.com/

## Endpoint documentation
See https://movie-app-2024-716106e34297.herokuapp.com/swagger/

## Dependencies
Node.js: JavaScript runtime environment  
Express: Back end web application framework for building RESTful APIs with Node.js  
MongoDB with Mongoose: NoSQL database and Object Data Modeling library for Node.js  
bcrypt: Express middleware for password hashing  
body-parser: Express middleware for parsing request bodies.  
express-validator: Middleware for input validation in Express.  
jsonwebtoken: Library for JWT ( JSON Web Token) generation and verification  
morgan: request logger middleware for Node.js  
passport: Authentication middleware for Node.js.  
passport-jwt: Passport strategy for JWT authentication.  
passport-local: Passport strategy for username/password authentication. 
swagger-jsdoc: library that reads JSDoc annotated source code and gereantes an OPen API specification
swagger-ui-express: Express middleware for auto-generating swager-ui generated API docs


## Authentication

All endpoints are protected except for /. To access them, users must first create an account.  
Follow the instructions in documentation.html to register

After registration, login with username and password to  
POST /login  
Keys username and password must be in lowercase  
username: yourUsername  
password: yourPassword  

After successful login, you will obtain a token  
Token must be sent as bearer token in authorization header with each request

## Changelog
v 1.0.1 Update express, express-validator and swagger-ui-express