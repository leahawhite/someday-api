const bcrypt = require('bcryptjs')
const xss = require('xss')

const UsersService = {
  hasUserWithUserName(db, full_name) {
    return db('users')
      .where({ full_name })
      .first()
      .then(user => !!user)
  },
  hasUserWithEmail(db, email) {
    return db('users')
      .where({ email })
      .first()
      .then(user => !!user)
  },
  validatePassword(password) {
    if (password.length < 6) {
      return 'Password must be between 6 and 36 characters'
    }
    if (password.length > 36) {
      return 'Password must be between 6 and 36 characters'
    }
    if (!password.match(/.*[0-9].*/)) {
      return 'Password must contain at least one digit'
    }
    return null
  },
  hashPassword(password) {
    return bcrypt.hash(password, 12)
  },
  insertUser(db, newUser) {
    return db
      .insert(newUser)
      .into('users')
      .returning('*')
      .then(([user]) => user)
  },
  serializeUser(user) {
    return {
      id: user.id,
      full_name: xss(user.full_name),
      email: xss(user.email),
    }
  }
}

module.exports = UsersService