const cron = require('node-cron')
const User = require('../models/userModel')
const Transaction = require('../models/transactionModel')
const notificationModel = require('../models/notificationModel')

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  const renewalPeriod = 336 * 24 * 60 * 60 * 1000 // 336 days in milliseconds
  const now = new Date()
  const renewalDate = new Date(now.getTime() - renewalPeriod)

  const usersToRenew = await User.find({
    createdAt: { $lte: renewalDate },
    lastRenewalDate: { $lte: renewalDate },
    role: { $ne: 'admin' }, // Exclude admin from automatic renewal
  })

  for (const user of usersToRenew) {
    if (user.balance >= user.renewalFee) {
      user.balance -= user.renewalFee
      user.lastRenewalDate = now
      await user.save()

      // Create a transaction record for the renewal
      await Transaction.create({
        transactionType: 'id_renewal',
        transactionAmount: user.renewalFee,
        sender: user._id,
        receiver: 'system', // System
        paymentType: 'points',
        transactionRelation: 'user-To-admin',
      })

      // Create a notification for the user
      await notificationModel.create({
        userId: user._id,
        notificationType: 'system',
        status: 'success',
        title: 'Account Renewed',
        message: `Your account has been renewed for another year. ${user.renewalFee} points have been deducted from your balance.`,
      })
    } else {
      // Handle insufficient balance
      await notificationModel.create({
        userId: user._id,
        notificationType: 'system',
        status: 'failed',
        title: 'Account Renewal Failed',
        message:
          'Your account renewal failed due to insufficient balance. Please add funds to your account to avoid suspension.',
      })

      // Create an admin notification
      await notificationModel.create({
        userId: user._id,
        notificationType: 'system',
        status: 'failed',
        title: 'User Account Renewal Failed',
        message: `User ${user.name} (ID: ${user._id}) failed to renew their account due to insufficient balance.`,
        isAdminNotification: true,
      })
    }
  }
})

// New cron job to send renewal reminders
cron.schedule('0 0 * * *', async () => {
  const reminderPeriod = 326 * 24 * 60 * 60 * 1000 // 326 days in milliseconds (10 days before renewal)
  const now = new Date()
  const reminderDate = new Date(now.getTime() - reminderPeriod)

  const usersToRemind = await User.find({
    createdAt: { $lte: reminderDate },
    lastRenewalDate: { $lte: reminderDate },
    role: { $ne: 'admin' },
  })

  for (const user of usersToRemind) {
    await notificationModel.create({
      userId: user._id,
      notificationType: 'system',
      status: 'success',
      title: 'Account Renewal Reminder',
      message:
        'Your account is due for renewal in 10 days. Please ensure you have sufficient balance for the renewal fee.',
    })
  }
})
