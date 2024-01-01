const express = require("express");
const {
  isAuthenticatedUser,
  isAuthenticatedShop,
  isAuthorizeRoles,
} = require("../middleware/auth");
const { createCategory } = require("../controllers/categoryController");

const router = express.Router();

router
  .route("/shop/category/new")
  .post(
    isAuthenticatedUser,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    createCategory
  );

module.exports = router;
