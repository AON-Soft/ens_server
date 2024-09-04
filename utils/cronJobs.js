// 2. Create cronJobs.js
const cron = require('node-cron')
const User = require('../models/userModel')
const Transaction = require('../models/transactionModel')

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const usersToRenew = await User.find({
    lastRenewalDate: { $lte: oneYearAgo },
    role: { $ne: 'admin' }, // Exclude admin from automatic renewal
  })

  for (const user of usersToRenew) {
    if (user.balance >= user.renewalFee) {
      user.balance -= user.renewalFee
      user.lastRenewalDate = new Date()
      await user.save()

      // Create a transaction record for the renewal
      await Transaction.create({
        transactionType: 'id_renewal',
        transactionAmount: user.renewalFee,
        sender: user._id,
        receiver: "system", // System
        paymentType: 'points',
        transactionRelation: 'user-To-admin',
      })
    } else {
      // Handle insufficient balance (e.g., send notification, deactivate account)
    }
  }
})
