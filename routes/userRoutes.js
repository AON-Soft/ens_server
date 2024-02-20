const express = require('express')
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
  forgotPasswordverifyOtp,
  getBalance,
  getAllAdmins,
  getAllAgents,
  addBalance,
} = require('../controllers/userController')
const {
  isAuthenticatedUser,
  isAuthorizeRoles,
  isAuthenticatedUserTemp,
} = require('../middleware/auth')

const router = express.Router()

router.route('/register').post(registerUser)
router.route('/verify/register').post(isAuthenticatedUserTemp, verifyOTP)
router.route('/login').post(loginUser)

router.route('/password/forgot').post(forgotPassword)
router.route('/password/verify-otp').post(forgotPasswordverifyOtp)
router.route('/password/reset').put(resetPassword)

router.route('/logout').get(logout)
router.route('/me').get(isAuthenticatedUser, getUserDetails)
router.route('/password/update').put(isAuthenticatedUser, updatePassword)
router.route('/me/update').put(isAuthenticatedUser, updateProfile)

router
  .route('/admin/users')
  .get(isAuthenticatedUser, isAuthorizeRoles('admin', 'super_admin',), getAllUsers)
router
  .route('/admin/admins')
  .get(isAuthenticatedUser, isAuthorizeRoles('admin', 'super_admin',), getAllAdmins)
router
  .route('/admin/agents')
  .get(isAuthenticatedUser, isAuthorizeRoles('admin', 'super_admin',), getAllAgents)

router
  .route('/admin/user/:id')
  .get(isAuthenticatedUser, isAuthorizeRoles('admin', 'super_admin',), getSingleUser)
  .put(isAuthenticatedUser, isAuthorizeRoles('admin', 'super_admin',), updateUserRole)
  .delete(isAuthenticatedUser, isAuthorizeRoles('admin', 'super_admin'), deleteUser)

router.route('/getOtp').get(getOtp)

router.route('/self/balance').get(isAuthenticatedUser, getBalance)
router.route('/self/balance/add/:id').post(isAuthenticatedUser, isAuthorizeRoles('admin', 'super_admin'), addBalance)

module.exports = router
