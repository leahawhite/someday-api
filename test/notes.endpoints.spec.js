const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Notes endpoints', () => {
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
      beforeEach('insert users and folders', () => {
        return db
          .into('users')
          .insert(testUsers)
          .then(() => {
            return db
              .into('folders')
              .insert(testFolders)
          })
      })

      it('responds with 200 and an empty array', () => {
        return supertest(app)
          .get('/api/notes')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, [])
      })
    })
    context('Given there are notes in the database', () => {
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
      
      it('responds with 200 and all of the folders', () => {
        const expectedNotes = testNotes.map(note =>
          helpers.makeExpectedNote(
            note,
            testUsers,
            testFolders,
        ))
        return supertest(app)
        .get('/api/notes')
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .expect(200, expectedNotes)
      })
    })
    context('Given an XSS attack note', () => {
      const { maliciousNote, expectedNote } = helpers.makeMaliciousNote()
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
              .insert([maliciousNote])
          })
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/notes')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200)
          .expect(res => {
            expect(res.body[0].what).to.eql(expectedNote.what)
            expect(res.body[0].link).to.eql(expectedNote.link)
          })
      })
    })
  })

  describe('GET /api/notes/:note_id', () => {
    context('Given no notes in the database', () => {
      beforeEach('insert users and folders', () => {
        return db
          .into('users')
          .insert(testUsers)
          .then(() => {
            return db
              .into('folders')
              .insert(testFolders)
          })
      })
      it('responds with 404', () => {
        const noteId = 5555
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Note doesn't exist`} })
      })
    })
    context('Given there are notes in the database', () => {
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
      
      it('responds with 200 and the specified note', () => {
        const noteId = 1
        const expectedNote = testNotes[noteId - 1]
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200, expectedNote)
      })
    })
    context('Given an XSS attack note', () => {
      const { maliciousNote, expectedNote } = helpers.makeMaliciousNote()

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
              .insert([maliciousNote])
          })
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/notes/${maliciousNote.id}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(200)
          .expect(res => {
            expect(res.body.what).to.eql(expectedNote.what)
            expect(res.body.link).to.eql(expectedNote.link)
          })
      })
    })
  })
  describe('POST /api/notes', () => {
    beforeEach('insert users and folders', () => {
      return db
        .into('users')
        .insert(testUsers)
        .then(() => {
          return db
            .into('folders')
            .insert(testFolders)
        })
        
    })
  
    it('creates a new note, responding with 201 and the new note', () => {
      const testFolder = testFolders[0]
      const newNote = {
        what: "This cool show",
        how: "HBO",
        who: "Todd",
        link: "www.link.com",
        thoughts: "Todd told me about it.",
        favorite: false,
        folder: testFolder.id
      }
      return supertest(app)
        .post('/api/notes')
        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
        .send(newNote)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property('id')
          expect(res.body.what).to.eql(newNote.what)
          expect(res.body.how).to.eql(newNote.how)
          expect(res.body.who).to.eql(newNote.who)
          expect(res.body.link).to.eql(newNote.link)
          expect(res.body.thoughts).to.eql(newNote.thoughts)
          expect(res.body.favorite).to.eql(newNote.favorite)
          expect(res.body.author).to.eql(testUsers[0].id)
          expect(res.body.folder).to.eql(newNote.folder)
          expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
        })
          .then(res =>
            supertest(app)
            .get(`/api/notes/${res.body.id}`)
            .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
            .expect(res.body)
          )
    })
    const requiredFields = ['what', 'folder']

    requiredFields.forEach(field => {
      const newNote = {
        what: "This cool show",
        how: "HBO",
        who: "Todd",
        link: "www.link.com",
        thoughts: "Todd told me about it.",
        favorite: false,
        folder: 1
      }

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newNote[field]

        return supertest(app)
          .post('/api/notes')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .send(newNote)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          })
      })
    })
  })
  describe('PATCH /api/notes/:note_id', () => {
    context('Given no notes', () => {
      beforeEach('insert users and folders', () => {
        return db
          .into('users')
          .insert(testUsers)
          .then(() => {
            return db
              .into('folders')
              .insert(testFolders)
          })
      })
      it('responds with 404', () => {
        const noteId = 12345
        return supertest(app)
          .patch(`/api/notes/${noteId}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Note doesn't exist`}})
      })
    })
    context('Given there are notes in the database', () => {
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
      it('responds with 200, updates and returns the article', () => {
        const idToUpdate = 2
        const updateNote = {
          thoughts: 'not so keen on it'
        }
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updateNote
        }
        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .send(updateNote)
          .expect(200)
          .then(res =>
            supertest(app)
              .get(`/api/notes/${idToUpdate}`)
              .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
              .expect(expectedNote)
          )
      })
      it('responds with 200 when updating only a subset of fields', () => {
        const idToUpdate = 2
        const updateNote = {
          what: 'updated title'
        }
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updateNote
        }

        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .send({
            ...updateNote,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(200)
          .then(res =>
            supertest(app)
              .get(`/api/notes/${idToUpdate}`)
              .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
              .expect(expectedNote)
          )
      })
    })
  })
  describe('DELETE /api/notes/:note_id', () => {
    context('Given no notes', () => {
      beforeEach('insert users and folders', () => {
        return db
          .into('users')
          .insert(testUsers)
          .then(() => {
            return db
              .into('folders')
              .insert(testFolders)
          })
      })
      it('responds with 404', () => {
        const noteId = 12345
        return supertest(app)
          .delete(`/api/notes/${noteId}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Note doesn't exist`}})
      })
    })
    context('Given notes in the database', () => {
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
      it('responds with 204 and removes the note', () => {
        const idToRemove = 2
        const expectedNotes = testNotes.filter(note => note.id !== idToRemove)
        return supertest(app)
          .delete(`/api/notes/${idToRemove}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
          .expect(204)
          .then(res =>
              supertest(app)
                .get(`/api/notes`)
                .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                .expect(expectedNotes)
          )
      })
    })
  })
})