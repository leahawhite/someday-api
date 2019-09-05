const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe.only('Notes endpoints', () => {
  let db 
  const { testUsers, testFolders, testNotes } = helpers.makeNotesFixtures()
  
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

  describe('GET /api/notes', () => {
    context('Given no notes in database', () => {
      it('responds with 200 and an empty array', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, [])
      })
    })
    context('Given there are notes in the database', () => {
      const testUsers = helpers.makeUsersArray()
      const testFolders = helpers.makeFoldersArray()
      const testNotes = helpers.makeNotesArray()

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
      
      // beforeEach('seed tables', () => {
      //   helpers.seedNotesTables(
      //     db,
      //     testUsers,
      //     testFolders,
      //     testNotes
      //   )
      // })
      
      it('responds with 200 and all of the folders', () => {
        const expectedNotes = testNotes.map(note =>
          helpers.makeExpectedNote(
            note,
            testUsers,
            testFolders,
        ))
        return supertest(app)
        .get('/api/notes')
        .expect(200, expectedNotes)
      })
    })
    context('Given an XSS attack note', () => {
      const testUsers = helpers.makeUsersArray()
      const testFolders = helpers.makeFoldersArray()
      // const { maliciousNote, expectedNote } = makeMaliciousNote()

      beforeEach('insert malicious note', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('noteful_notes')
              .insert([maliciousNote])
          })
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200)
          .expect(res => {
            expect(res.body[0].note_name).to.eql(expectedNote.note_name)
            expect(res.body[0].content).to.eql(expectedNote.content)
          })
      })
    })
  })

})

// get all, get by id, post, patch, delete