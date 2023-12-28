const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();
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

module.exports = sendToken;
