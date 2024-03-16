const express = require('express')
const { isAuthenticated, isAuthorizeRoles } = require('../middleware/auth')
const { createTag, updateTag, deleteTag, getAllTag } = require('../controllers/tagController')

const router = express.Router()

router
  .route('/tag/create')
  .post(isAuthenticated, isAuthorizeRoles('shop_keeper'),  createTag)

router
  .route('/tag/update/:id')
  .put(isAuthenticated, isAuthorizeRoles('shop_keeper'),  updateTag)

router
  .route('/tag/delete/:id')
  .delete(isAuthenticated, isAuthorizeRoles('shop_keeper'),  deleteTag)

router.route('/tag/all').get(isAuthenticated, isAuthorizeRoles('shop_keeper'), getAllTag)

module.exports = router
