const express = require('express')
const {
  isAuthorizeRoles,
  isAuthenticated,
  isAuthenticatedShop,
} = require('../middleware/auth')
const {
  updateCategory,
  deleteCategory,
  getAllCategories,
  createCategoryByAdmin,
  createCategoryByShop,
  getAllCategoriesByshop,
  getAllCategoriesByAdmin,
} = require('../controllers/categoryController')

const router = express.Router()

router
  .route('/admin/shop/category/new/:id')
  .post(isAuthenticated, isAuthorizeRoles('admin'), createCategoryByAdmin)

router
  .route('/shop/category/new')
  .post(
    isAuthenticated,
    isAuthenticatedShop,
    isAuthorizeRoles('shop_keeper'),
    createCategoryByShop,
  )

router
  .route('/shop/category/:id')
  .put(isAuthenticated, updateCategory)
  .delete(isAuthenticated, deleteCategory)
router
  .route('/shop/categories')
  .get(isAuthenticated, isAuthenticatedShop, getAllCategoriesByshop)

router
  .route('/admin/shop/categories/:id')
  .get(isAuthenticated, getAllCategoriesByAdmin)

module.exports = router
