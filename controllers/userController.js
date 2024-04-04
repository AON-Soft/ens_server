/* eslint-disable no-unused-vars */
const fs = require('fs').promises
const cloudinary = require('cloudinary')
const bcrypt = require('bcryptjs')
const otpGenerator = require('otp-generator')
const { validate } = require('email-validator');
const User = require('../models/userModel')
const Otp = require('../models/otpModel.js')
const Shop = require('../models/shopModel.js')
const Token = require('../models/tokenModel.js')

const sendToken = require('../utils/jwtToken')
// const sendEmail = require("../utils/sendEmail.js");
const sendTempToken = require('../utils/TempJwtToken.js')
const ErrorHandler = require('../utils/errorhander.js')

const catchAsyncError = require('../middleware/catchAsyncError.js')
const ApiFeatures = require('../utils/apifeature.js');
const sendEmail = require('../utils/sendEmail.js');
const createLog = require('../utils/createLogs.js');

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
    await createLog('login:failed', null, `Invalid login attempt by ${email}`, 'Login attempt failed');
    return next(new ErrorHandler('Invalid Email & Password', 401))
  }
  const isPasswordMatched = await user.comparePassword(password)

  if (!isPasswordMatched) {
    await createLog('login:failed', null, `Invalid login attempt by ${email}`, 'Login attempt failed');
    return next(new ErrorHandler('Invalid Email & Password !', 401))
  }
  if (user.role === 'shop_keeper') {
    isRegisteredShop = (await Shop.findOne({ createdBy: user._id }))
      ? true
      : false

    console.log(isRegisteredShop)
  }

  await createLog('login:success', user._id, 'User logged in successfully', 'User logged in');

  sendToken(user, 200, res, isRegisteredShop)
})

//Logout
exports.logout = catchAsyncError(async (_, res) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  })
  res.status(200).json({ success: true, message: 'Logged Out' })
})

//forgot password
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }).select('status name')

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

  try {
    await sendEmail({
      name: user.name,
      email: req.body.email,
      otp: getOtp,
      subject: "Forgot Password OTP",
      message: `<p>You are receiving this email because you requested to reset your password.</p> 
                <p>Please use the following OTP:</p>`
    });

    // Save OTP to database
    await Otp.deleteOne({ email: req.body.email });
    await Otp.create({ email: req.body.email, otp, getOtp, otpVerified: false });

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    return next(new ErrorHandler("Failed to send OTP", 500));
  }

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

   // Verify OTP
  const isOtpValid = await OtpData.compareOtp(otp);
  if (!isOtpValid) {
    return next(new ErrorHandler("OTP doesn't match", 401));
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
  
  if (!OtpData) {
    return next(new ErrorHandler('OTP is Expired', 403))
  }

  const user = await User.findOne({ email })
  
  // check user
  if (!user) {
    return next(new ErrorHandler('User not found', 404))
  }

  if (user.status !== 'active') {
    return next(new ErrorHandler('User not active', 404))
  }

  // Verify OTP
  const isOtpValid = await OtpData.compareOtp(otp);
  if (!isOtpValid) {
    return next(new ErrorHandler("OTP doesn't match", 401));
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
    .populate('parent', 'name email createdAt avatar') 
    .populate('children', 'name email createdAt avatar').exec() 

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

//Update admin agent password
exports.updateAdminAgentPassword = catchAsyncError(async (req, res, next) => {
   const {name, email, mobile, oldPassword, newPassword, confirmPassword} = req.body

  const user = await User.findById(req.params.id).select('+password')
  if (oldPassword) {
    const isPasswordMatched = await user.comparePassword(oldPassword);

    if (!isPasswordMatched) {
      return next(new ErrorHandler('Old Password is incorrect', 400));
    }

    if (newPassword !== confirmPassword) {
      return next(new ErrorHandler("Password doesn't match", 400));
    }

    user.password = newPassword;
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (mobile) user.mobile = mobile;

  await user.save()

  const result = await User.findById(req.params.id).exec()

  res.status(200).json({ success: true, data:result })
})

//Get All Users(admin)
exports.getAllUsers = catchAsyncError(async (req, res) => {   
  let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const count = await User.countDocuments({ role: 'user' })
  const apiFeature = new ApiFeatures(
    User.find({ role: 'user' })
    .populate('parent', 'name email createdAt avatar') 
    .populate('children', 'name email createdAt avatar')
    .sort({ createdAt: -1 }),
    req.query)
    .search()
    .filter()
    .pagination(resultPerPage)

  let users = await apiFeature.query
  let filteredCount = users.length

  res.status(200).json({
    success: true,
    users,
    count,
    resultPerPage,
    filteredCount,
  })
})

//Get All Admin(admin)
exports.getAllAdmins = catchAsyncError(async (req, res) => { 
  let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const count = await User.countDocuments({ role: 'admin' })
  const apiFeature = new ApiFeatures(
    User.find({ role: 'admin' })
    .populate('parent', 'name email createdAt avatar') 
    .populate('children', 'name email createdAt avatar')
    .sort({ createdAt: -1 }),
    req.query)
    .search()
    .filter()
    .pagination(resultPerPage)

  let users = await apiFeature.query
  let filteredCount = users.length

  res.status(200).json({
    success: true,
    users,
    count,
    resultPerPage,
    filteredCount,
  })
})

//Get All Agents (admin)
exports.getAllAgents = catchAsyncError(async (req, res) => {
let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const count = await User.countDocuments({ role: 'agent' })
  const apiFeature = new ApiFeatures(
    User.find({ role: 'agent' })
    .populate('parent', 'name email createdAt avatar') 
    .populate('children', 'name email createdAt avatar')
    .sort({ createdAt: -1 }),
    req.query)
    .search()
    .filter()
    .pagination(resultPerPage)

  let users = await apiFeature.query
  let filteredCount = users.length

  res.status(200).json({
    success: true,
    users,
    count,
    resultPerPage,
    filteredCount,
  })
})

//Get All Shopkeeper (admin)
exports.getAllShopKeepers = catchAsyncError(async (req, res) => {
  let resultPerPage ;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const count = await User.countDocuments({ role: 'shop_keeper' })
  const apiFeature = new ApiFeatures(
    User.find({ role: 'shop_keeper' })
    .populate('parent', 'name email createdAt avatar') 
    .populate('children', 'name email createdAt avatar')
    .sort({ createdAt: -1 }),
    req.query)
    .search()
    .filter()
    .pagination(resultPerPage)

  let users = await apiFeature.query
  let filteredCount = users.length

  res.status(200).json({
    success: true,
    users,
    count,
    resultPerPage,
    filteredCount,
  })
})

//Get Single Users(admin)
exports.getSingleUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate('parent', 'name email createdAt avatar') 
    .populate('children', 'name email createdAt avatar')
    .exec();
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

  res.status(200).json({ success: true, data: user })
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

  res.status(200).json({ success: true, data: user })
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
  if (balance !== 'undefined') {
    user.balance = (user.balance || 0) + balance;
  }

  // Update bonus balance if provided
  if (bonusBalance !== 'undefined') {
    user.bonusBalance = (user.bonusBalance || 0) + bonusBalance;
  }

  await user.save();

  const response = {
    balance: user.balance,
    bonusBalance: user.bonusBalance,
  }

  res.status(202).json({ success: true, response })
})

exports.imageUpload = catchAsyncError(async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    let images = req.files.images; 

    // Check if images is not an array
    if (!Array.isArray(images)) {
      images = [images];
    }

    if (!images || images.length === 0) {
      return next(new ErrorHandler('Images not found', 404));
    }

    const uploadedImages = [];
    for (const image of images) {
      // Ensure 'image' object and 'name' property are defined before accessing
      if (image && image.name) {
        const tempFilePath = `temp_${Date.now()}_${image.name}`;
        await image.mv(tempFilePath);

        const myCloudImage = await cloudinary.v2.uploader.upload(tempFilePath, {
          folder: 'images',
          crop: 'scale',
        });

        uploadedImages.push({
          public_id: myCloudImage.public_id,
          url: myCloudImage.secure_url,
        });

        await fs.unlink(tempFilePath);
      } else {
        console.error('Image or image name is undefined:', image);
      }
    }

    res.status(200).json({ success: true, imageUrls: uploadedImages });
  } catch (error) {
    next(error);
  }
});


exports.userSerchByEmail = catchAsyncError(async (req, res, next) => {
  const { email } = req.query;
  try {
    if (!email || !validate(email)) {
      return next(new ErrorHandler('Email is invalid or not found', 400));
    }
    const result = await User.findOne({email: { $regex: new RegExp(email, 'i') }});

    if(!result){
      return next(new ErrorHandler('User not found', 400));
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error)
  }
})

exports.getLastSevenDaysUsers = catchAsyncError(async(_, res, next)=>{
   try {
        //  const today = new Date();

        // const data = {
        //     labels: [],
        //     userCounts: Array(7).fill(0),
        // };

        // const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        // for (let i = 0; i < 7; i++) {
        //     const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        //     const users = await User.find({ createdAt: { $gte: currentDate, $lt: new Date(currentDate.getTime() + 86400000) } }); // Add 1 day to currentDate

        //     data.labels.unshift(dayLabels[currentDate.getDay()]);
        //     data.userCounts[i] = users.length; 
        // }

        // // data.labels.reverse();
        // // data.userCounts.reverse();
        const today = new Date();

        const data = {
            labels: [],
            userCounts: Array(7).fill(0),
        };

        const dayLabels = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const users = await User.find({ createdAt: { $gte: currentDate, $lt: new Date(currentDate.getTime() + 86400000) } }); // Add 1 day to currentDate

            data.labels.push(dayLabels[currentDate.getDay()]);

            users.forEach(order => {
                data.userCounts[i]++;
            });
        }

        data.labels.reverse();
        data.userCounts.reverse();
       
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
})

//Get Single Children Users(admin)
exports.getSingleChildrens = catchAsyncError(async (req, res, next) => {
  const { email } = req.query;

  const user = await User.findOne({ email })
    .populate({
      path: 'parent',
      select: 'name email createdAt avatar'
    })
    .populate({
      path: 'children',
      select: 'name -_id',
      populate: {
        path: 'children',
        select: 'name -_id',
        populate: {
          path: 'children',
          select: 'name -_id',
          populate: {
            path: 'children',
            select: 'name -_id',
            populate: {
              path: 'children',
              select: 'name -_id',
              populate: {
                path: 'children',
                select: 'name -_id'
              }
            }
          }
        }
      }
    })
    .exec();

  if (!user) {
    return next(
      new ErrorHandler(`User doesn't exist with email: ${email}`, 400)
    );
  }

  res.status(200).json({ success: true, user });
});
