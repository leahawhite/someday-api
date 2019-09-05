const FoldersService = {
  getAllFolders(knex) {
    return knex.select('*').from('folders')
  },
  getById(knex, id) {
    return knex.select('*')
    .from('folders')
    .where('id', id)
    .first()
  }
}

module.exports = FoldersService