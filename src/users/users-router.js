const express = require('express')
const path = require('path')
const UsersService = require('./users-service')
const usersRouter = express.Router()
const jsonParser = express.json()

usersRouter
  .post('/', jsonParser, (req, res, next) => {
    const { full_name, email, password } = req.body
    for (const field of ['full_name', 'email', 'password']) {
      if (!req.body[field]) {
        return res.status(400).json({
          error: `Missing '${field}' in request body`
        })
      }
    }
    const passwordError = UsersService.validatePassword(password)
    if (passwordError) {
      return res.status(400).json({ error: passwordError })
    }
    
    if (full_name.length < 3 || full_name.length > 36) {
      return res.status(400).json({
        error: `Full name must be between 3 and 36 characters`
      })
    }

    UsersService.hasUserWithEmail(
      req.app.get('db'),
      email
    )
      .then(hasUserWithEmail => {
        if (hasUserWithEmail) {
          return res.status(400).json({ error: `Email has already been registered` })
        }
          return UsersService.hasUserWithUserName(
            req.app.get('db'),
            full_name
          )
            .then(hasUserWithUserName => {
              if (hasUserWithUserName) {
                return res.status(400).json({ error: `Username already taken` })
              }
                  return UsersService.hashPassword(password)
                    .then(hashedPassword => {
                      const newUser = {
                        full_name,
                        email,
                        password: hashedPassword,
                      }
          
                      return UsersService.insertUser(
                        req.app.get('db'),
                        newUser
                      )
                        .then(user => {
                          res
                            .status(201)
                            .location(path.posix.join(req.originalUrl, `/${user.id}`))
                            .json(UsersService.serializeUser(user))
                        })
                    })                
            })
      })
      .catch(next) 
  })

  module.exports = usersRouter