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

module.exports = router;
