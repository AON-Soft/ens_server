const express = require('express')
const { isAuthenticated, isAuthorizeRoles } = require('../middleware/auth')
const { createServiceCharge, updateServiceCharge, deleteServiceCharge, getAllServiceCharge } = require('../controllers/serviceChargeController')

const router = express.Router()

router
  .route('/service-charge/create')
  .post(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'),  createServiceCharge)

router
  .route('/service-charge/update/:id')
  .put(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'),  updateServiceCharge)

router
  .route('/service-charge/delete/:id')
  .delete(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'),  deleteServiceCharge)

router.route('/service-charge/all').get(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), getAllServiceCharge)

module.exports = router
