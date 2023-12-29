const jwt = require("jsonwebtoken");

const sendTempToken = (user, statusCode, res) => {
  const token = jwt.sign(
    user,
    process.env.JWT_SECRET || "fjhhIOHfjkflsjagju0fujljldfgl",
    {
      expiresIn: process.env.JWT_EXPIRE || "5d",
    }
  );

  const cookieExpire = process.env.COOKIE_EXPIRE
    ? process.env.COOKIE_EXPIRE
    : 2;

  const options = {
    expires: new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, user, token });
};

module.exports = sendTempToken;
