const jwt = require("jsonwebtoken");
const { JWT_EXPIRE } = require("../constant");

const sendTempToken = (user, statusCode, res) => {
  const token = jwt.sign(
    user,
    JWT_EXPIRE,
    {
      expiresIn: JWT_EXPIRE,
    }
  );

  const cookieExpire = JWT_EXPIRE

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
