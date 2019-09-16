const xss = require('xss')

const NotesService = {
  getAllNotes(knex, author) {
    return knex.select('*')
    .from('notes')
    .where('author', author)
  },
  getById(knex, id) {
    return knex.select('*')
    .from('notes')
    .where('id', id)
    .first()
  },
  insertNote(knex, newNote) {
    return knex
      .insert(newNote)
      .into('notes')
      .returning('*')
      .then(([note]) => note)
      .then(note =>
        NotesService.getById(knex, note.id)
      )
  },
  updateNote(knex, id, newNoteFields) {
    return knex('notes')
      .where({ id })
      .update(newNoteFields, returning=true)
      .returning('*')
  },
  deleteNote(knex, id) {
    return knex('notes')
      .where({ id })
      .delete()
  },
  serializeNote(note) {
    return {
      id: note.id,
      what: xss(note.what),
      how: xss(note.how),
      who: xss(note.who),
      link: xss(note.link),
      thoughts: xss(note.thoughts),
      favorite: note.favorite,
      author: note.author,
      date_created: new Date(note.date_created).toLocaleString(),
      date_edited: new Date(note.date_edited).toLocaleString(),
      folder: note.folder
    }
  }
}

module.exports = NotesService