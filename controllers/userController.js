const User = require("../models/userModel");
const Otp = require("../models/otpModel.js");

const otpGenerator = require("otp-generator");
const crypto = require("crypto");

const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail.js");
const sendTempToken = require("../utils/TempJwtToken.js");
const ErrorHandler = require("../utils/errorhander.js");

const catchAsyncError = require("../middleware/catchAsyncError.js");

//Register a User: /api/v1/register
exports.registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const existingUserEmail = await User.findOne({ email: email });
  var getUser = null;

  if (existingUserEmail) {
    getUser = await Otp.findOne({ email: email });

    if(getUser && getUser.otpVerified){
      return next(
        new ErrorHandler(
          `This email - ${email}  is already registered`,
          401
        )
      );
    }
  }


  var createdUser = null;
  // create user 

  if (!getUser) {
    const otp = otpGenerator.generate(4, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const getOtp = otp;
    await Otp.create({ email, otp, getOtp });
    createdUser = await User.create({ name, email, password, role });
  } else {
    const otp = otpGenerator.generate(4, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    getUser.otp = otp;
    getUser.getOtp = otp;
    await getUser.save();
    // user should be upate with new req data
    createdUser = await User.findOneAndUpdate({ email }, { name, email, password, role });
  }


  const responsePayload = {
    id: createdUser._id,
    name: createdUser.name,
    email: createdUser.email,
    role: createdUser.role,
    isVefified: false,
  }

  sendTempToken(responsePayload, 201, res);
});

exports.verifyOTP = catchAsyncError(async (req, res, next) => {
  const { otp } = req.body;

  
  const {email, id } = req.user;

  const otpInfo = await Otp.findOne({ email }).select("otp");

  // test otp for Development 
  if(otp === '1234'){

    // this otp from development and no need to be checked 

  }else{

    if (!otpInfo) {
      return next(new ErrorHandler("OTP is Expired", 403));
    }
    if (otpInfo.otpVerified) {
      return next(new ErrorHandler("OTP is already verified", 400));
    }
  
    const isOtpMatched = await otpInfo.compareOtp(otp);
    if (!isOtpMatched) {
      return next(new ErrorHandler("OTP doesn't matched", 401));
    }
  }


  // user user status will update be active
  const user = await User.findByIdAndUpdate(id, { status: "active" }, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  
  const newOtpVerified = {
    otpVerified: true,
  };
  if(otpInfo){
    await Otp.findByIdAndUpdate(otpInfo._id, newOtpVerified, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
  }


  sendToken(user, 200, res);
});

//Login User
exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email & Password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email & Password", 401));
  }

  sendToken(user, 200, res);
});

//Logout
exports.logout = catchAsyncError(async (_, res, a) => {
  console.log(a);
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: "Logged Out" });
});

//forgot password
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  //Get ResetPasword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/ens/api/v1/password/reset/${resetToken}`;
  console.log("=================================", resetPasswordUrl);

  const message = `Your password reset token is :- \n\n\n ${resetPasswordUrl} \n\n if you have not request this email then, please ignore it`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

//Reset password
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  console.log("=======================", resetPasswordToken);

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password link is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password doesn't matched", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordToken = undefined;

  await user.save();
  sendToken(user, 200, res);
});

//Get User Details
exports.getUserDetails = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({ success: true, user });
});

//Update password
exports.updatePassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old Password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password doesn't matched", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});

//Update User Profile
exports.updateProfile = catchAsyncError(async (req, res, _) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  //we will add cloudinary later

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  console.log('data', user)

  res.status(200).json({ success: true });
});

//Get All Users(admin)
exports.getAllUsers = catchAsyncError(async (_, res) => {
  const users = await User.find();

  res.status(200).json({ success: true, users });
});

//Get Single Users(admin)
exports.getSingleUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`User doesn't exist with Id: ${req.params.id}`, 400)
    );
  }
  res.status(200).json({ success: true, user });
});

//Update User Role ---Admin
exports.updateUserRole = catchAsyncError(async (req, res, _) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  console.log(user);

  res.status(200).json({ success: true });
});

//Delete User ---Admin
exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User doesn't exist with Id: ${req.params.id}`, 400)
    );
  }

  await user.deleteOne();
  res.status(200).json({ success: true, message: "User Deleted Successfully" });
});

exports.getOtp = catchAsyncError(async (_, res, next) => {
  const otp = await Otp.find();
  console.log("===========otp===========", otp);

  if (!otp || otp.length === 0) {
    return next(new ErrorHandler(`OTP expired`, 400));
  }
  // getOtp = otp.getOtp;
  res.status(200).json({ success: true, otp });
});
