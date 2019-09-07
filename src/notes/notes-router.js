const express = require('express')
const path = require('path')
const NotesService = require('./notes-service')

const jsonParser = express.json()
const notesRouter = express.Router()

notesRouter
  .route('/')
  .get((req, res, next) => {
    NotesService.getAllNotes(req.app.get('db'))
      .then(notes => {
        res.json(notes.map(NotesService.serializeNote))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { what, how, who, link, thoughts, favorite, author, folder } = req.body
    const newNote = { what, how, who, link, thoughts, favorite, author, folder }
    const requiredFields = { what, author, folder }
    
    for (const [key, value] of Object.entries(requiredFields)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body`}
        })
      }
    }
    NotesService.insertNote(
      req.app.get('db'),
      newNote
    )
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(NotesService.serializeNote(note))
      })
      .catch(next)
  })

notesRouter
  .route('/:note_id')
  .all(checkNoteExists)
  .get((req, res) => {
    res.json(NotesService.serializeNote(res.note))
  })
  .patch(jsonParser, (req, res, next) => {
    const { what, how, who, link, thoughts, favorite, author, folder } = req.body
    const noteToUpdate = { what, how, who, link, thoughts, favorite, author, folder }
    NotesService.updateNote(
      req.app.get('db'), 
      req.params.note_id, 
      noteToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  .delete((req, res, next) => {
    NotesService.deleteNote(
      req.app.get('db'),
      req.params.note_id
    )
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })
  
async function checkNoteExists(req, res, next) {
  try {
    const note = await NotesService.getById(
      req.app.get('db'),
      req.params.note_id
    )

    if (!note) {
      return res.status(404).json({
        error: { message: `Note doesn't exist`}
      })
    }
    res.note = note
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = notesRouter