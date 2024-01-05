const express = require("express");
const {
  isAuthenticatedUser,
  isAuthenticatedShop,
  isAuthorizeRoles,
} = require("../middleware/auth");
const {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
} = require("../controllers/categoryController");

const router = express.Router();

router
  .route("/shop/category/new")
  .post(
    isAuthenticatedUser,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    createCategory
  );

router
  .route("/shop/category/:id")
  .put(
    isAuthenticatedUser,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    updateCategory
  )
  .delete(
    isAuthenticatedUser,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    deleteCategory
  );
router.route("/category/shop/:id").get(isAuthenticatedUser, getAllCategories);

module.exports = router;
