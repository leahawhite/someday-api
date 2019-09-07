const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Folders endpoints', () => {
  let db 
  
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

  describe('GET /api/folders', () => {
    context('Given no folders in the database', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
        .get('/api/folders')
        .expect(200, [])
      })
    })
    context('Given there are folders in the database', () => {
      const { testFolders } = helpers.makeNotesFixtures()
      
      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testFolders)
      })
      
      it('responds with 200 and all of the folders', () => {
        return supertest(app)
        .get('/api/folders')
        .expect(200, testFolders)
      })
    })
  })
  describe('GET /api/folders/:folder_id', () => {
    context('Given no folders in the database', () => {
      it('responds with 404', () => {
        const folderId = 5555
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(404, { error: { message: `Folder doesn't exist`} })
      })
    })
    context('Given there are folders in the database', () => {
      const { testFolders } = helpers.makeNotesFixtures()
      
      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testFolders)
      })
      
      it('responds with 200 and the specified folder', () => {
        const folderId = 3
        const expectedFolder = testFolders[folderId - 1]
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(200, expectedFolder)
      })
    })
  })
})