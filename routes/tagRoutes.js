const express = require('express')
const { isAuthenticated, isAuthorizeRoles } = require('../middleware/auth')
const { createTag, updateTag, deleteTag, getAllTag } = require('../controllers/tagController')

const router = express.Router()

router
  .route('/tag/create')
  .post(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'),  createTag)

router
  .route('/tag/update/:id')
  .put(isAuthenticated, isAuthorizeRoles('shop_keeper',  'admin', 'super_admin'),  updateTag)

router
  .route('/tag/delete/:id')
  .delete(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'),  deleteTag)

router.route('/tag/all').get(isAuthenticated, isAuthorizeRoles('shop_keeper',  'admin', 'super_admin'), getAllTag)

module.exports = router
