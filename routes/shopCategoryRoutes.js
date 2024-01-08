const express = require('express')

const { isAuthorizeRoles, isAuthenticated } = require('../middleware/auth')

const {
  createShopCategory,
  updateShopCategory,
  deleteShopCategory,
  getAllShopCategories,
} = require('../controllers/shopCategorycontroller')

const router = express.Router()

router
  .route('/shopCategory/create-category')
  .post(isAuthenticated, isAuthorizeRoles('admin'), createShopCategory)

router
  .route('/shopCategory/:id')
  .put(isAuthenticated, isAuthorizeRoles('admin'), updateShopCategory)
  .delete(isAuthenticated, isAuthorizeRoles('admin'), deleteShopCategory)

router.route('/shop-categories').get(isAuthenticated, getAllShopCategories)

module.exports = router
