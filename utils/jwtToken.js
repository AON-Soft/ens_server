const { COOKIE_EXPIRE } = require("../constant");

const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();
  const cookieExpire = COOKIE_EXPIRE;

  const options = {
    expires: new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  // user paylod
  const responsePayload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVefified: true,
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, user: responsePayload, token });
};

module.exports = sendToken;
