const express = require("express");
const {
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  getUserDetails,
  updatePassword,
  updateProfile,
  getAllUsers,
  getSingleUser,
  updateUserRole,
  deleteUser,
  verifyOTP,
  getOtp,
} = require("../controllers/userController");
const {
  isAuthenticatedUser,
  isAuthorizeRoles,
  isAuthenticatedUserTemp,
} = require("../middleware/auth");

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/verify/register").post(isAuthenticatedUserTemp, verifyOTP);
router.route("/login").post(loginUser);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset").put(resetPassword);
router.route("/logout").get(logout);
router.route("/me").get(isAuthenticatedUser, getUserDetails);
router.route("/password/update").put(isAuthenticatedUser, updatePassword);
router.route("/me/update").put(isAuthenticatedUser, updateProfile);

router
  .route("/admin/users")
  .get(isAuthenticatedUser, isAuthorizeRoles("Admin"), getAllUsers);
router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, isAuthorizeRoles("Admin"), getSingleUser)
  .put(isAuthenticatedUser, isAuthorizeRoles("Admin"), updateUserRole)
  .delete(isAuthenticatedUser, isAuthorizeRoles("Admin"), deleteUser);

router.route("/getOtp").get(getOtp);

module.exports = router;
