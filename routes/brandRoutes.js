const express = require("express");
const {
  isAuthenticatedUser,
  isAuthenticatedShop,
  isAuthorizeRoles,
} = require("../middleware/auth");
const {
  createBrand,
  updateBrand,
  deleteBrand,
  getAllBrands,
} = require("../controllers/brandController");

const router = express.Router();

router
  .route("/shop/brand/new")
  .post(
    isAuthenticatedUser,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    createBrand
  );

router
  .route("/shop/brand/:id")
  .put(
    isAuthenticatedUser,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    updateBrand
  )
  .delete(
    isAuthenticatedUser,
    isAuthenticatedShop,
    isAuthorizeRoles("Shop Keeper"),
    deleteBrand
  );
router.route("/brand/shop/:id").get(isAuthenticatedUser, getAllBrands);

module.exports = router;
