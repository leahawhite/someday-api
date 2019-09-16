# Someday API

[Someday](https://github.com/leahawhite/someday) is a note-keeping app that creates reminders of all of the cool movies, TV, travel locations, and related topics you want to explore in the future. This is the API that serves and stores all data for the app.

## Server is hosted on Heroku:

[https://murmuring-badlands-92884.herokuapp.com/](https://murmuring-badlands-92884.herokuapp.com/)

## API Endpoints
Users
- POST '/api/users' creates a new user upon signup

Auth
- POST '/api/auth/login' matches given user credentials and provides a JWT token

Folders
- GET '/api/folders' gets all category folders in the database

Notes
- GET '/api/notes
- GET '/api/notes/:note_id' gets a place by ID
- POST '/api/notes' creates a new note
- PATCH '/api/notes/:note_id' updates a note
- DELETE '/api/notes/:note_id' deletes a note

## Technology Used
- Node.js
- Express
- PostgreSQL
- Knex.js
- Mocha
- Chai
- Supertest

## Security
This application uses JWT authentication.

