const knex = require('knex')
const bcrypt = require('bcryptjs')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Users endpoints', () => {
  let db 
  const { testUsers } = helpers.makeNotesFixtures()
  const testUser = testUsers[0]

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanTables(db))

  afterEach('cleanup', () => helpers.cleanTables(db))

  describe('POST /api/users', () => {
    context('User validation', () => {
      beforeEach('insert users', () =>
        helpers.seedUsers(
          db, testUsers
        )
      )
      const requiredFields = ['full_name', 'email', 'password']

      requiredFields.forEach(field => {
        const registerAttemptBody = {
          full_name: 'test name',
          email: 'test email',
          password: 'test password'
        }

        it(`responds with 400 required error when '${field}' is missing`, () => {
          delete registerAttemptBody[field]

          return supertest(app)
            .post('/api/users')
            .send(registerAttemptBody)
            .expect(400, {
              error: `Missing '${field}' in request body`,
            })
        })
      })

        it('responds with 400 required error when full_name is too short', () => {
          const nameTooShortBody = {
            full_name: 'hi',
            email: 'test email',
            password: 'passw0rd'
          }

          return supertest(app)
            .post('/api/users')
            .send(nameTooShortBody)
            .expect(400, {
              error: 'Full name must be between 3 and 36 characters',
            })
        })

        it('responds with 400 required error when full_name is too long', () => {
          const nameTooLongBody = {
            full_name: 'Thisnameistoolongfortheapppppppppppppppppppppppppppppppp',
            email: 'test email',
            password: 'passw0rd'
          }

          return supertest(app)
            .post('/api/users')
            .send(nameTooLongBody)
            .expect(400, {
              error: 'Full name must be between 3 and 36 characters',
            })
        })

        it('responds with 400 required error when password is too short', () => {
          const shortPwdBody = {
            full_name: 'test name',
            email: 'test email',
            password: 'nope'
          }

          return supertest(app)
            .post('/api/users')
            .send(shortPwdBody)
            .expect(400, {
              error: 'Password must be between 6 and 36 characters',
            })
        })

        it('responds with 400 required error when password is too long', () => {
          const longPwdBody = {
            full_name: 'test name',
            email: 'test email',
            password: '*'.repeat(73),
          }

          return supertest(app)
            .post('/api/users')
            .send(longPwdBody)
            .expect(400, {
              error: 'Password must be between 6 and 36 characters',
            })
        })

        it('responds with 400 required error when password does not contain a digit', () => {
          const noDigitPwdBody = {
            full_name: 'test name',
            email: 'test email',
            password: 'password'
          }

          return supertest(app)
            .post('/api/users')
            .send(noDigitPwdBody)
            .expect(400, {
              error: 'Password must contain at least one digit',
            })
        })

        it('responds with 400 required error when full_name already exists in db', () => {
          const duplicateUser = {
            full_name: testUser.full_name,
            email: 'test email',
            password: '11AAaa!!'
          }
          return supertest(app)
            .post('/api/users')
            .send(duplicateUser)
            .expect(400, { error: `Username already taken` })
        })

        it('responds with 400 required error when email already exists in db', () => {
          const duplicateUser = {
            full_name: 'test name',
            email: testUser.email,
            password: '11AAaa!!'
          }
          return supertest(app)
            .post('/api/users')
            .send(duplicateUser)
            .expect(400, { error: `Email has already been registered` })
        })
      })

      context('Successful registration', () => {
        it(`responds 201, serialized user, storing bcrypted password`, () => {
          const newUser = {
            full_name: 'test user',
            email: 'test email',
            password: '11AAaa!!',
          }
          return supertest(app)
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect(res => {
              expect(res.body).to.have.property('id')
              expect(res.body.full_name).to.eql(newUser.full_name)
              expect(res.body.email).to.eql(newUser.email)
              expect(res.body).to.not.have.property('password')
              expect(res.headers.location).to.eql(`/api/users/${res.body.id}`)
            })
            .expect(res =>
              db 
                .from('users')
                .select('*')
                .where({ id: res.body.id })
                .first()
                .then(row => {
                  expect(row.full_name).to.eql(newUser.full_name)
                  expect(row.email).to.eql(newUser.email)
                  
                  return bcrypt.compare(newUser.password, row.password)
                })
                .then(compareMatch => {
                  expect(compareMatch).to.be.true
                })  
            )
         })  
      })
    })
})