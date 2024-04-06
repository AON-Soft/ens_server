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
  getAllShopKeepers,
  updateUserStatus,
  imageUpload,
  userSerchByEmail,
  updateAdminAgentPassword,
  getLastSevenDaysUsers,
  getSingleChildrens,
  getOrderBalances,
} = require('../controllers/userController')
const {
  isAuthenticatedUser,
  isAuthorizeRoles,
  isAuthenticatedUserTemp,
  isAuthenticated,
} = require('../middleware/auth')
const orderBalanceModel = require('../models/orderBalanceModel')

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
  .route('/admin/shop_keepers')
  .get(isAuthenticatedUser, isAuthorizeRoles('admin', 'super_admin',), getAllShopKeepers)

router
  .route('/admin/user/:id')
  .delete(isAuthenticatedUser, isAuthorizeRoles('admin', 'super_admin'), deleteUser)

router
  .route('/user/details/:id')
  .get(getSingleUser)

router
  .route('/user/single')
  .get(getSingleChildrens)

router
  .route('/admin/user/role/:id')
  .put(isAuthenticatedUser, isAuthorizeRoles('admin', 'super_admin'), updateUserRole)

router
  .route('/admin/user/status/:id')
  .put(isAuthenticatedUser, isAuthorizeRoles('admin', 'super_admin'), updateUserStatus)

router.route('/getOtp').get(getOtp)

router.route('/self/balance').get(isAuthenticatedUser, getBalance)
router.route('/self/balance/add/:id').post(isAuthenticatedUser, isAuthorizeRoles('admin', 'super_admin'), addBalance)

router.route('/user/search').get(userSerchByEmail)

// file upload
router.route('/upload').post(imageUpload)

router.route('/admin/agent/update/:id').put(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), updateAdminAgentPassword)

router.route('/user/seven-days-order').get(getLastSevenDaysUsers)

router.route('/order/balances').get(isAuthenticatedUser, getOrderBalances)

router.route('/balance/all/delete/:id').delete((req, res) => {
  orderBalanceModel.deleteOne({ _id: req.params.id })
    .then(() => {
      console.log('Document deleted successfully');
      res.status(200).json({ success: true, message: 'Document deleted successfully' });
    })
    .catch((err) => {
      console.error('Error deleting document:', err);
      res.status(500).json({ success: false, message: 'Error deleting document' });
    });
});


module.exports = router
