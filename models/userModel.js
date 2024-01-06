const { mongoose } = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter your Name"],
    maxLength: [30, "Name cna not excced 30 charaters"],
    minLength: [2, "Name should have more then 2 characters long"],
  },
  email: {
    type: String,
    required: [true, "Please Enter your Email"],
    unique: true,
    validate: [validator.isEmail, "Please Enter a valid Email"],
  },
  mobile: {
    type: String,
    validate: {
      validator: function (v) {
        return /\d{11}/.test(v);
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
    // unique: true,
  },
  password: {
    type: String,
    required: [true, "Please Enter your Password"],
    minLength: [6, "Password should have more then 6 characters long"],
    select: false,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
      default: "This is Sample Id",
    },
    url: {
      type: String,
      default: "This is sample URL",
    },
  },

  role: {
    type: String,
    default: "user",
    enum: ["admin", "agent", "user", "shop_keeper"],
  },
  balance: {
    type: Number,
    default: 0,
    validate: {
      validator: function (v) {
        // Validate that the value is a valid number
        return !isNaN(parseFloat(v)) && isFinite(v);
      },
      message: (props) => `${props.value} is not a valid number for balance!`,
    },
  },
  dueBalance: {
    type: Number,
    default: 0,
    validate: {
      validator: function (v) {
        // Validate that the value is a valid number
        return !isNaN(parseFloat(v)) && isFinite(v);
      },
      message: (props) => `${props.value} is not a valid number for balance!`,
    },
  },
  bonusBalance: {
    type: Number,
    default: 0,
    validate: {
      validator: function (v) {
        // Validate that the value is a valid number
        return !isNaN(parseFloat(v)) && isFinite(v);
      },
      message: (props) => `${props.value} is not a valid number for balance!`,
    },
  },

  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "active", "hold", "rejectd"],
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

//jwt token
userSchema.methods.getJWTToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET || "fjhhIOHfjkflsjagju0fujljldfgl",
    {
      expiresIn: process.env.JWT_EXPIRE || "5d",
    }
  );
};

//compare pasword
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//Generaing Pasword Reset Token
userSchema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hashing the reset token
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Setting the hashed token to the resetPasswordToken field
  this.resetPasswordToken = hashedResetToken;

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  // Return the non-hashed token (resetToken) for email purposes
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
