const express = require('express')
const FoldersService = require('./folders-service')

const foldersRouter = express.Router()

foldersRouter 
  .route('/')
  .get((req, res, next) => {
    FoldersService.getAllFolders(
      req.app.get('db')
    )
      .then(folders => {
        res.json(folders)
      })
      .catch(next)
  })

foldersRouter
  .route('/:folder_id')
  .get((req, res, next) => {
    FoldersService.getById(req.app.get('db'), req.params.folder_id)
      .then(folder => {
        if (!folder) {
          return res.status(404).json({
            error: { message: `Folder doesn't exist` }
          })
        }
        res.json(folder)
      })
      .catch(next)
  })

  module.exports = foldersRouter