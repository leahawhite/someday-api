const xss = require('xss')

const NotesService = {
  getAllNotes(knex) {
    return knex.select('*').from('notes')
  },
  serializeNote(note) {
    return {
      id: note.id,
      what: xss(note.what),
      how: xss(note.how),
      who: xss(note.how),
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