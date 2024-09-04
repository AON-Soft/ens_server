module.exports.API_PREFIX = process.env.API_PREFIX || '/ens'
module.exports.PORT = process.env.PORT || 5000
module.exports.MONGO_URI =
  process.env.NODE_ENV == 'production'
    ? process.env.MONGO_URI
    : 'mongodb+srv://admin:admin@cluster0.xklu8.mongodb.net/ens_server'

module.exports.JWT_SECRET = process.env.JWT_SECRET
  ? process.env.JWT_SECRET
  : 'fjhhIOHfjkflsjagju0fujljldfgl'
module.exports.JWT_EXPIRE = process.env.JWT_EXPIRE
  ? process.env.JWT_EXPIRE
  : '365d'
module.exports.COOKIE_EXPIRE = process.env.COOKIE_EXPIRE
  ? process.env.COOKIE_EXPIRE
  : '365'
module.exports.SMPT_SERVICE = process.env.SMPT_SERVICE
  ? process.env.SMPT_SERVICE
  : 'gmail'
module.exports.SMS_TOKEN = process.env.SMS_TOKEN
  ? process.env.SMS_TOKEN
  : 'qcrxflkltzbfgjuy'
module.exports.APP_PASSWORD = process.env.APP_PASSWORD
  ? process.env.APP_PASSWORD
  : 'qcrxflkltzbfgjuy'
module.exports.SMPT_HOST = process.env.SMPT_HOST
  ? process.env.SMPT_HOST
  : 'ensellers.com'
module.exports.SMPT_PORT = process.env.SMPT_PORT ? process.env.SMPT_PORT : '465'
module.exports.SMPT_MAIL = process.env.SMPT_MAIL
  ? process.env.SMPT_MAIL
  : 'admin@ensellers.com'
module.exports.SMPT_PASSWORD = process.env.SMPT_PASSWORD
  ? process.env.SMPT_PASSWORD
  : '9*}tw*9e3z!q'
module.exports.FCM_SERVER_KEY = process.env.FCM_SERVER_KEY
  ? process.env.FCM_SERVER_KEY
  : 'key=AAAAQR60ZX0:APA91bFLDan_hqiMi0HWYlr1OxOxfumSKUtKQBylcS3Sap9KzZJ1UjpnbpQHiRB5d5KZPYnnHZRo5WPR3_5YrB8YEkiASA8W6H8BrypzSK3a1m-PsN9fBOAW2wpfbiEy3Z2Y1s_QnLPC'
