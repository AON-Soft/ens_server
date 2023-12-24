const express = require("express");

const { isAuthenticatedUser, isAuthorizeRoles } = require("../middleware/auth");

const { registerShop, loginShop } = require("../controllers/shopController");

const router = express.Router();

router
  .route("/register-shop")
  .post(isAuthenticatedUser, isAuthorizeRoles("Shop Keeper"), registerShop);

router.route("/login-shop/:id").post(loginShop);

module.exports = router;
