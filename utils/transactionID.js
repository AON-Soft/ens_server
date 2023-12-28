const otpGenerator = require("otp-generator");

const uniqueTransactionID = () => {
  const randomPart = otpGenerator.generate(4, {
    digits: true,
    lowerCaseAlphabets: true,
    upperCaseAlphabets: true,
    specialChars: false,
  });
  const timestampPart = Date.now().toString().slice(-4);
  const transactionID = `${randomPart}${timestampPart}`.slice(0, 10);

  return transactionID;
};

module.exports = uniqueTransactionID;
