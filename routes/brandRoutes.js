const express = require('express')
const {
  isAuthorizeRoles,
  isAuthenticated,
  isAuthenticatedShop,
} = require('../middleware/auth')
const {
  createBrandByAdmin,
  createBrandByShop,
  updateBrand,
  deleteBrand,
  getAllBrandByshop,
  getAllBrandsByAdmin,
} = require('../controllers/brandController')

const router = express.Router()

router
  .route('/admin/shop/brand/new/:id')
  .post(isAuthenticated, isAuthorizeRoles('admin'), createBrandByAdmin)

router
  .route('/shop/brand/new')
  .post(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper'),
    createBrandByShop,
  )

router
  .route('/shop/brand/:id')
  .put(isAuthenticated, updateBrand)
  .delete(isAuthenticated, deleteBrand)
router
  .route('/shop/brands')
  .get(isAuthenticated, isAuthenticatedShop, getAllBrandByshop)

router.route('/admin/shop/brands/:id').get(isAuthenticated, getAllBrandsByAdmin)

module.exports = router
