const express = require('express')
const {
  isAuthorizeRoles,
  isAuthenticated,
  isAuthenticatedShop,
} = require('../middleware/auth')
const {
  updateCategory,
  deleteCategory,
  createCategoryByAdmin,
  createCategoryByShop,
  getAllCategoriesByshop,
  getAllCategoriesByAdmin,
  getAllCategoriesByUser,
  getAllCategory,
} = require('../controllers/categoryController')

const router = express.Router()

router
  .route('/admin/shop/category/new/:id')
  .post(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), createCategoryByAdmin)

router
  .route('/shop/category/new')
  .post(
    isAuthenticated,
    isAuthorizeRoles('shop_keeper', 'shop_keeper', 'admin', 'super_admin'),
    isAuthenticatedShop,
    createCategoryByShop,
  )

router
  .route('/shop/category/:id')
  .put(isAuthenticated, updateCategory)
  .delete(isAuthenticated, deleteCategory)
  
router
  .route('/shop/categories')
  .get(isAuthenticated, isAuthorizeRoles('shop_keeper', 'shop_keeper', 'admin', 'super_admin'), isAuthenticatedShop, getAllCategoriesByshop)

router
  .route('/admin/shop/categories/:id')
  .get(isAuthenticated, getAllCategoriesByAdmin)

router
  .route('/all/shop/categories/:id')
  .get(isAuthenticated, getAllCategoriesByUser)

router
  .route('/product/category/all')
  .get(getAllCategory)


module.exports = router
