const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Protected endpoints', () => {
  let db

  const { testUsers, testFolders, testNotes } = helpers.makeNotesFixtures()

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanTables(db))

  afterEach('cleanup', () => helpers.cleanTables(db))

  beforeEach('insert notes', () => {
    return db
      .into('users')
      .insert(testUsers)
      .then(() => {
        return db
          .into('folders')
          .insert(testFolders)
      })
      .then(() => {
        return db
          .into('notes')
          .insert(testNotes)
      })
  })

  const protectedEndpoints = [
    {
      name: 'GET /api/notes',
      path: '/api/notes',
      method: supertest(app).get,
    },
    {
      name: 'GET /api/notes/:note_id',
      path: '/api/notes/:note_id',
      method: supertest(app).get,
    },
    {
      name: 'POST /api/notes',
      path: '/api/notes',
      method: supertest(app).post,
    },
    {
      name: 'PATCH /api/notes/:note_id',
      path: '/api/notes/:note_id',
      method: supertest(app).patch,
    },
    {
      name: 'DELETE /api/notes/:note_id',
      path: '/api/notes/:note_id',
      method: supertest(app).delete
    }
  ]

  protectedEndpoints.forEach(endpoint => {
    describe(endpoint.name, () => {
      it(`responds 401 'Missing bearer token' when no bearer token`, () => {
        return endpoint.method(endpoint.path)
          .expect(401, { error: `Missing bearer token` })
      })

      it(`responds 401 'Unauthorized request' when invalid JWT secret`, () => {
        const validUser = testUsers[0]
        const invalidSecret = 'bad-secret'
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(validUser, invalidSecret))
          .expect(401, { error: `Unauthorized request` })
      })

      it(`responds 401 'Unauthorized request' when invalid sub in payload`, () => {
        const invalidUser = { email: 'nope', id: 1 }
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(invalidUser))
          .expect(401, { error: `Unauthorized request` })
      })
    })
  })
})
