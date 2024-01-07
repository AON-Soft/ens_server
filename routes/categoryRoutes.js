const express = require("express");
const {
  isAuthenticatedUser,
  isAuthenticatedShop,
  isAuthorizeRoles,
  isAuthenticated,
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
    isAuthenticated,
    isAuthorizeRoles("shop_keeper"),
    createCategory
  );

router
  .route("/shop/category/:id")
  .put(
    isAuthenticated,
    isAuthorizeRoles("shop_keeper"),
    updateCategory
  )
  .delete(
    isAuthenticated,
    isAuthorizeRoles("shop_keeper"),
    deleteCategory
  );
router.route("/categories").get(isAuthenticated, getAllCategories);

module.exports = router;
