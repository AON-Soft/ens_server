const express = require("express");

const { isAuthenticatedUser, isAuthorizeRoles } = require("../middleware/auth");

const { registerShop } = require("../controllers/shopController");

const router = express.Router();

router
  .route("/register-shop")
  .post(isAuthenticatedUser, isAuthorizeRoles("Shop Keeper"), registerShop);

module.exports = router;
