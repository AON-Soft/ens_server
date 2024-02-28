const fs = require('fs').promises
const cloudinary = require('cloudinary')
const bcrypt = require('bcryptjs')
const otpGenerator = require('otp-generator')
const User = require('../models/userModel')
const Otp = require('../models/otpModel.js')
const Shop = require('../models/shopModel.js')
const Token = require('../models/tokenModel.js')

const sendToken = require('../utils/jwtToken')
// const sendEmail = require("../utils/sendEmail.js");
const sendTempToken = require('../utils/TempJwtToken.js')
const ErrorHandler = require('../utils/errorhander.js')

const catchAsyncError = require('../middleware/catchAsyncError.js')
const orderedProductModel = require('../models/orderedProductModel.js')

//Register a User: /api/v1/register
exports.registerUser = catchAsyncError(async (req, res, next) => {
  var { name, email, password, token, role } = req.body;

  // Verify if the role is 'user' and token is provided
  let isValidToken = null;
  if (role === 'user' && token) {
    isValidToken = await Token.findOne({ token: token, isUsed: false });
  }

  // Check if the token is not valid or used
  if (!isValidToken && role === 'user' && token !== 'admin') {
    return next(new ErrorHandler('The token is not valid or used.', 404));
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      if (existingUser.status === 'active') {
        return next(new ErrorHandler(`${email} is already registered`, 401));
      }
      return next(new ErrorHandler(`${email} is already registered`, 401));
    }

    // Check if user has existing OTP
    let getUser = await Otp.findOne({ email: email });

    // Generate OTP
    const otp = otpGenerator.generate(4, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);

    let createdUser = null;

    if (!getUser) {
      // If user does not have OTP, create new OTP and user
      await Otp.create({ email, otp, getOtp: otp });
      createdUser = await User.create({ name, email, password, role });
    } else {
      // If user already has OTP, update OTP and user details
      getUser.otp = otp;
      getUser.getOtp = otp;
      await getUser.save();
      
      createdUser = await User.findOneAndUpdate({ email }, { name, email, password, role });
    }

      // Update parent and children fields based on token
    if (isValidToken) {
      // Update parent field of the new user with the userId associated with the token
      createdUser.parent = isValidToken.userId;
      await createdUser.save();

      // Update children field of the token owner
      const tokenOwner = await User.findById(isValidToken.userId);
      tokenOwner.children.push(createdUser._id);
      await tokenOwner.save();

      // Mark the token as used
      isValidToken.isUsed = true;
      await isValidToken.save();
    }

    // Fetch token owner's details
    let tokenOwnerDetails = null;
    if (isValidToken) {
      tokenOwnerDetails = await User.findById(isValidToken.userId);
    }

    // Prepare response payload including token owner's details
    const responsePayload = {
      id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      isVerified: false,
      token: isValidToken,
      parent: tokenOwnerDetails ? tokenOwnerDetails.parent : null,
    };

    sendTempToken(responsePayload, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.verifyOTP = catchAsyncError(async (req, res, next) => {
  const { otp } = req.body

  const { email, id, token } = req.user

  let user = null

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
  if (token === null) {
    user = await User.findByIdAndUpdate(
      id,
      { status: 'active' },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      },
    )
  } else {
    user = await User.findByIdAndUpdate(
      id,
      { status: 'active', parent: token.userId },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      },
    )
  }

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
  if (token !== null) {
    await Token.findByIdAndUpdate(
      token._id,
      { isUsed: true, tokenUsedBy: id },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      },
    )
    await User.findByIdAndUpdate(
      token.userId,
      { $push: { children: user._id } },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      },
    )
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
    .populate('parent', 'name email') 
    .populate('children', 'name email').exec() 

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
  const newUserData = req.body

  if (req.files && req.files.avatar) {
    if (req.user.avatar !== '') {
      const user = await User.findById(req.user.id)
      const imageId = user.avatar.public_id
      const tempFilePath = `temp_${Date.now()}.jpg`
      await fs.writeFile(tempFilePath, req.files.avatar.data)

      if (imageId === '') {
        const myCloud = await cloudinary.v2.uploader.upload(tempFilePath, {
          folder: 'avatars',
          width: 150,
          crop: 'scale',
        })

        newUserData.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        }
        await fs.unlink(tempFilePath)
      } else {
        await cloudinary.v2.uploader.destroy(imageId)

        const myCloud = await cloudinary.v2.uploader.upload(tempFilePath, {
          folder: 'avatars',
          width: 150,
          crop: 'scale',
        })

        newUserData.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        }
        await fs.unlink(tempFilePath)
      }
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

//Get All Admin(admin)
exports.getAllAdmins = catchAsyncError(async (_, res) => {
  const users = await User.find({ role: 'admin' })

  res.status(200).json({ success: true, users })
})

//Get All Agents (admin)
exports.getAllAgents = catchAsyncError(async (_, res) => {
  const users = await User.find({ role: 'agent' })

  res.status(200).json({ success: true, users })
})

//Get All Shopkeeper (admin)
exports.getAllShopKeepers = catchAsyncError(async (_, res) => {
  const users = await User.find({ role: 'shop_keeper' })

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
    role: req.body.role,
  }

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })

  const user = await User.findById(req.params.id)

  res.status(200).json({ success: true, user })
})

//Update User status ---Admin
exports.updateUserStatus = catchAsyncError(async (req, res, _) => {
  const newUserData = {
    status: req.body.status,
  }

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })

   const user = await User.findById(req.params.id)

  res.status(200).json({ success: true, user })
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

exports.addBalance = catchAsyncError(async (req, res, next) => {
  const {balance, bonusBalance} = req.body
 
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(new ErrorHandler(`User not found`, 400))
  }

  // Update main balance if provided
  if (balance !== undefined) {
    user.balance = (user.balance || 0) + balance;
  }

  // Update bonus balance if provided
  if (bonusBalance !== undefined) {
    user.bonusBalance = (user.bonusBalance || 0) + bonusBalance;
  }

  await user.save();

  const response = {
    balance: user.balance,
    bonusBalance: user.bonusBalance,
  }

  res.status(202).json({ success: true, response })
})

