const express = require('express')
const { isAuthenticated, isAuthorizeRoles } = require('../middleware/auth')
const { createUnit, updateUnit, deleteUnit, getAllUnit } = require('../controllers/unitController')

const router = express.Router()

router
  .route('/unit/create')
  .post(isAuthenticated, isAuthorizeRoles('shop_keeper'), createUnit)

router
  .route('/unit/update/:id')
  .put(isAuthenticated, isAuthorizeRoles('shop_keeper'), updateUnit)

router
  .route('/unit/delete/:id')
  .delete(isAuthenticated, isAuthorizeRoles('shop_keeper'), deleteUnit)

router.route('/unit/all').get(isAuthenticated, isAuthorizeRoles('shop_keeper'), getAllUnit)

module.exports = router
