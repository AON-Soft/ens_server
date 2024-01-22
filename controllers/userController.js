const cloudinary = require('cloudinary')
const bcrypt = require('bcryptjs')
const otpGenerator = require('otp-generator')

const User = require('../models/userModel')
const Otp = require('../models/otpModel.js')
const Shop = require('../models/shopModel.js')

const sendToken = require('../utils/jwtToken')
// const sendEmail = require("../utils/sendEmail.js");
const sendTempToken = require('../utils/TempJwtToken.js')
const ErrorHandler = require('../utils/errorhander.js')

const catchAsyncError = require('../middleware/catchAsyncError.js')

//Register a User: /api/v1/register
exports.registerUser = catchAsyncError(async (req, res, next) => {
  var { name, email, password, role } = req.body

  const existingUser = await User.findOne({ email: email })
  if (existingUser) {
    if (existingUser.status == 'active') {
      return next(new ErrorHandler(`${email}  is already registered`, 401))
    }
  }

  var getUser = await Otp.findOne({ email: email })

  var createdUser = null
  // create user

  // hash
  const salt = await bcrypt.genSalt(10)
  password = await bcrypt.hash(password, salt)

  if (!getUser) {
    const otp = otpGenerator.generate(4, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    })
    const getOtp = otp
    await Otp.create({ email, otp, getOtp })
    createdUser = await User.create({ name, email, password, role })
  } else {
    const otp = otpGenerator.generate(4, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    })

    getUser.otp = otp
    getUser.getOtp = otp
    await getUser.save()
    // user should be upate with new req data
    createdUser = await User.findOneAndUpdate(
      { email },
      { name, email, password, role },
    )
  }

  const responsePayload = {
    id: createdUser._id,
    name: createdUser.name,
    email: createdUser.email,
    role: createdUser.role,
    isVefified: false,
  }

  sendTempToken(responsePayload, 201, res)
})

exports.verifyOTP = catchAsyncError(async (req, res, next) => {
  const { otp } = req.body

  const { email, id } = req.user

  const otpInfo = await Otp.findOne({ email }).select('otp')

  // test otp for Development
  if (otp === '1234') {
    // this otp from development and no need to be checked
  } else {
    if (!otpInfo) {
      return next(new ErrorHandler('OTP is Expired', 403))
    }
    if (otpInfo.otpVerified) {
      return next(new ErrorHandler('OTP is already verified', 400))
    }

    const isOtpMatched = await otpInfo.compareOtp(otp)
    if (!isOtpMatched) {
      return next(new ErrorHandler("OTP doesn't matched", 401))
    }
  }

  // user user status will update be active
  const user = await User.findByIdAndUpdate(
    id,
    { status: 'active' },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    },
  )

  const newOtpVerified = {
    otpVerified: true,
  }
  if (otpInfo) {
    await Otp.findByIdAndUpdate(otpInfo._id, newOtpVerified, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    })
  }

  sendToken(user, 200, res)
})

//Login User
exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body
  let isRegisteredShop = false

  if (!email || !password) {
    return next(new ErrorHandler('Please Enter Email & Password', 400))
  }

  const user = await User.findOne({ email }).select('+password')

  if (!user) {
    return next(new ErrorHandler('Invalid Email & Password', 401))
  }

  const isPasswordMatched = await user.comparePassword(password)

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid Email & Password !', 401))
  }
  if (user.role === 'shop_keeper') {
    isRegisteredShop = (await Shop.findOne({ createdBy: user._id }))
      ? true
      : false

    console.log(isRegisteredShop)
  }

  sendToken(user, 200, res, isRegisteredShop)
})

//Logout
exports.logout = catchAsyncError(async (_, res, a) => {
  console.log(a)
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  })
  res.status(200).json({ success: true, message: 'Logged Out' })
})

//forgot password
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }).select('status')

  if (!user) {
    return next(new ErrorHandler('User not found', 404))
  }

  // Check if user is active
  if (user.status !== 'active') {
    return next(new ErrorHandler('User not active', 404))
  }

  // sent otp and save it to db
  const otp = otpGenerator.generate(4, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  })

  const getOtp = otp

  // remove OTP from db
  await Otp.deleteOne({ email: req.body.email })
  await Otp.create({ email: req.body.email, otp, getOtp, otpVerified: false })
  return res.json({
    success: true,
    message: 'OTP sent successfully',
  })
})

//Reset password
exports.forgotPasswordverifyOtp = catchAsyncError(async (req, res, next) => {
  const { otp, email } = req.body

  // check otp with email and if it is true then update password to new password
  const OtpData = await Otp.findOne({ email }).select('otp')
  // check user
  const user = await User.findOne({ email })

  if (!OtpData) {
    return next(new ErrorHandler('OTP is Expired', 403))
  }

  if (!user) {
    return next(new ErrorHandler('User not found', 404))
  }

  if (user.status !== 'active') {
    return next(new ErrorHandler('User not active', 404))
  }

  if (otp === '1234') {
    // this otp from development and no need to be checked
  } else {
    if (OtpData.otp != otp) {
      return next(new ErrorHandler("OTP doesn't matched", 401))
    }
  }

  // Verify OTP
  const newOtpVerified = {
    otpVerified: true,
  }
  await Otp.findByIdAndUpdate(OtpData._id, newOtpVerified, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })

  // return response
  return res.json({
    success: true,
    message: 'Otp is verified successfully',
  })
})

//Reset password
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const { otp, email, password } = req.body

  // check otp with email and if it is true then update password to new password
  const OtpData = await Otp.findOne({ email }).select('otp')
  // check user
  const user = await User.findOne({ email })

  if (!OtpData) {
    return next(new ErrorHandler('OTP is Expired', 403))
  }

  if (!user) {
    return next(new ErrorHandler('User not found', 404))
  }

  if (user.status !== 'active') {
    return next(new ErrorHandler('User not active', 404))
  }

  if (otp === '1234') {
    // this otp from development and no need to be checked
  } else {
    if (OtpData.otp != otp) {
      return next(new ErrorHandler("OTP doesn't matched", 401))
    }
  }

  // update otp as varified
  await Otp.findByIdAndUpdate(
    OtpData._id,
    { otpVerified: true },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    },
  )

  // update password
  const salt = await bcrypt.genSalt(10)
  const newPassword = await bcrypt.hash(password, salt)

  // udpate user by email
  user.password = newPassword
  await user.save()

  // return response
  return res.json({
    success: true,
    message: 'Password updated successfully',
  })
})

//Get User Details
exports.getUserDetails = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({ success: true, user })
})

//Update password
exports.updatePassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')
  const isPasswordMatched = await user.comparePassword(req.body.oldPassword)

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Old Password is incorrect', 400))
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password doesn't matched", 400))
  }

  user.password = req.body.newPassword

  await user.save()

  sendToken(user, 200, res)
})

//Update User Profile
exports.updateProfile = catchAsyncError(async (req, res, _) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  }
  console.log('=======================', req.body.avatar)
  if (req.body.avatar !== '') {
    const user = await User.findById(req.user.id)

    const imageId = user.avatar.public_id

    await cloudinary.v2.uploader.destroy(imageId)

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: 'avatars',
      width: 150,
      crop: 'scale',
    })

    newUserData.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })

  res.status(200).json({ success: true, user })
})

//Get All Users(admin)
exports.getAllUsers = catchAsyncError(async (_, res) => {
  const users = await User.find()

  res.status(200).json({ success: true, users })
})

exports.getAllAdmins = catchAsyncError(async (_, res) => {
  const users = await User.find({ role: 'admin' })

  res.status(200).json({ success: true, users })
})

exports.getAllAgents = catchAsyncError(async (_, res) => {
  const users = await User.find({ role: 'agent' })

  res.status(200).json({ success: true, users })
})

//Get Single Users(admin)
exports.getSingleUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return next(
      new ErrorHandler(`User doesn't exist with Id: ${req.params.id}`, 400),
    )
  }
  res.status(200).json({ success: true, user })
})

//Update User Role ---Admin
exports.updateUserRole = catchAsyncError(async (req, res, _) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  }

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })

  console.log(user)

  res.status(200).json({ success: true })
})

//Delete User ---Admin
exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(
      new ErrorHandler(`User doesn't exist with Id: ${req.params.id}`, 400),
    )
  }

  await user.deleteOne()
  res.status(200).json({ success: true, message: 'User Deleted Successfully' })
})

exports.getOtp = catchAsyncError(async (_, res, next) => {
  const otp = await Otp.find()
  console.log('===========otp===========', otp)

  if (!otp || otp.length === 0) {
    return next(new ErrorHandler(`OTP expired`, 400))
  }
  // getOtp = otp.getOtp;
  res.status(200).json({ success: true, otp })
})

exports.getBalance = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  if (!user) {
    return next(new ErrorHandler(`User not found`, 400))
  }

  const balance = {
    balance: user.balance,
    bonusBalance: user.bonusBalance,
  }

  res.status(200).json({ success: true, balance })
})
