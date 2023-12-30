const { COOKIE_EXPIRE } = require("../constant");

const sendToken = (user, statusCode, res) => {
  console.log("============user====================", user);
  const token = user.getJWTToken();
  const cookieExpire = COOKIE_EXPIRE;

  const options = {
    expires: new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, user, token });
};

module.exports = sendToken;
