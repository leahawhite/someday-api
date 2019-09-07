const bcrypt = require('bcryptjs')

function makeUsersArray() {
  return [
    {
      id: 1,
      full_name: 'User One',
      email: 'test1@testing.com',
      password: 'password1'
    },
    {
      id: 2,
      full_name: 'User Two',
      email: 'test2@testing.com',
      password: 'password1'
    },
    { 
      id: 3,
      full_name: 'User Three',
      email: 'test3@testing.com',
      password: 'password1'
    }
  ]
}

function makeFoldersArray() {
  return [
    { 
      id: 1,
      text: "Watch",
      icon: "film" 
    },
    { 
      id: 2,
      text: "Read",
      icon: "book" 
    },
    { 
      id: 3,
      text: "Listen",
      icon: "volume-up" 
    }
  ]
}

function makeNotesArray() {
  return [
    {
      id: 1,
      what: "Really great book",
      how: "library",
      who: "Stuart",
      link: "https://great-book.com",
      thoughts: "A really great book I heard about",
      favorite: true,
      author: 1,
      date_created: new Date('09-04-2019').toLocaleString(),
      date_edited: new Date('09-04-2019').toLocaleString(),
      folder: 2
    },
    {
      id: 2,
      what: "On the Media",
      how: "WNYC",
      who: "Me",
      link: "https://www.wnycstudios.org/podcasts/otm",
      thoughts: "Good stuff",
      favorite: true,
      author: 1,
      date_created: new Date('09-04-2019').toLocaleString(),
      date_edited: new Date('09-04-2019').toLocaleString(),
      folder: 3
    },
    {
      id: 3,
      what: "Euphoria",
      how: "HBO",
      who: "Megan",
      link: "https://www.hbo.com/euphoria",
      thoughts: "Seems bleak, but Megan says it's good.",
      favorite: false,
      author: 1,
      date_created: new Date('09-04-2019').toLocaleString(),
      date_edited: new Date('09-04-2019').toLocaleString(),
      folder: 1
    }
  ]
}

function makeNotesFixtures() {
  const testUsers = makeUsersArray()
  const testFolders = makeFoldersArray()
  const testNotes = makeNotesArray()
  return { testUsers, testFolders, testNotes }
}

function makeExpectedNote(note, users, folders) {
  const noteAuthor = users && users.length && users.find(user => user.id === note.author).id
  const noteFolder = folders && folders.length && folders.find(folder => folder.id === note.folder).id

  return {
    id: note.id,
    what: note.what,
    how: note.how,
    who: note.who,
    link: note.link,
    thoughts: note.thoughts,
    favorite: note.favorite,
    author: noteAuthor,
    date_created: new Date(note.date_created).toLocaleString(),
    date_edited: new Date(note.date_edited).toLocaleString(),
    folder: noteFolder
  }
}

function cleanTables(db) {
  return db.transaction(trx =>
    trx.raw(
      `TRUNCATE notes, folders, users RESTART IDENTITY CASCADE`
    )
    .then(() =>
      Promise.all([
        trx.raw(`ALTER SEQUENCE users_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE folders_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE notes_id_seq minvalue 0 START WITH 1`),
      ])
    )
  )
}

function makeMaliciousNote() {
  const maliciousNote = {
    id: 1,
    what: 'Naughty naughty very naughty <script>alert("xss");</script>',
    how: 'HBO',
    who: 'Megan',
    link: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    thoughts: "Seems bleak, but Megan says it's good.",
    favorite: false,
    author: 1,
    date_created: new Date('09-04-2019').toLocaleString(),
    date_edited: new Date('09-04-2019').toLocaleString(),
    folder: 1
  }
  const expectedNote = {
    ...maliciousNote,
    what: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    link: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }
  return {
    maliciousNote,
    expectedNote
  }
}

function seedUsers(db, users) {
  const preppedUsers = users.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1)
  }))
  return db.into('users').insert(preppedUsers)
    .then(() =>
      db.raw(
        `SELECT setval('users_id_seq', ?)`,
        [users[users.length - 1].id]
      )
  )
}

module.exports = {
  makeUsersArray,
  makeFoldersArray,
  makeNotesArray,
  makeNotesFixtures,
  makeExpectedNote,
  makeMaliciousNote,
  cleanTables,
  seedUsers,
}