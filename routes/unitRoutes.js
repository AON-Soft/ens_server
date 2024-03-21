const express = require('express')
const { isAuthenticated, isAuthorizeRoles } = require('../middleware/auth')
const { createUnit, updateUnit, deleteUnit, getAllUnit } = require('../controllers/unitController')

const router = express.Router()

router
  .route('/unit/create')
  .post(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), createUnit)

router
  .route('/unit/update/:id')
  .put(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), updateUnit)

router
  .route('/unit/delete/:id')
  .delete(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), deleteUnit)

router.route('/unit/all').get(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), getAllUnit)

module.exports = router
