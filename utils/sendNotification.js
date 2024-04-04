const axios = require('axios');
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); 
const notificationModel = require('../models/notificationModel');
const { FCM_SERVER_KEY } = require('../constant');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function sendNotification(payload) {
    const data = {
        "to": payload.fcmToken,
        "notification": {
            "body": payload.message,
            "OrganizationId": "2",
            "content_available": true,
            "priority": "high",
            "subtitle": payload.subtitle || "Ensellers Notification",
            "title": payload.title
        },
        "data": {
            "priority": "high",
            "sound": "app_sound.wav",
            "content_available": true,
            "bodyText": payload.message,
            "organization": "Ensellers.com"
        }
    };

    try {
        const response = await axios.post('https://fcm.googleapis.com/fcm/send', data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': FCM_SERVER_KEY 
            }
        });

        let notificationStatus = 'in_queue' ;
        if (response.status === 200) {
            notificationStatus = 'success'; 
        } else {
            notificationStatus = 'failed'; 
        }
        if (response.status === 200) {
            const result = await notificationModel.create({...payload, status: notificationStatus});
            return { success: true, message: 'Notification sent successfully', data: result || [] };
        } else {
            if (response.data.error && response.data.error.code === 'messaging/registration-token-not-registered') {
                throw new Error('FCM Token is not registered');
            } else {
                console.error('FCM Notification Error:', response.data);
                throw new Error('An error occurred while sending the notification');
            }
        }
    } catch (error) {
        console.error('FCM Notification Error:', error);
        throw new Error('An error occurred while sending the notification');
    }

    // try {
    //   const payload = {
    //     notification: {
    //       title: title,
    //       body: message
    //     },
    //     token: fcmToken,
    //   };

    //   const response = await admin.messaging().send(payload);
    //   if (response) {
    //     const result = await notificationModel.create({ userId, orderId, title, message });
    //     return res.status(200).json({ success: true, message: 'Notification sent successfully', data: result || [] });
    //   }
    // } catch (error) {
    //   if (error.code === 'messaging/registration-token-not-registered') {
    //     return next(new ErrorHandler('FCM Token is not registered', 500));
    //   } else {
    //     console.error('FCM Notification Error:', error);
    //     return next(error);
    //   }
    // }
}

module.exports = sendNotification;
