// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');
require('dotenv').config();

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

const nodemailer = require('nodemailer');
//const {getEmailTemplate} = require("./email-template");
// const gmailEmail = process.env.EMAIL;
// const gmailPassword = process.env.PASSWORD;
const gmailEmail = 'bcis.caito@gmail.com';
const gmailPassword = 'yygpatgvvwaeojur';
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  //host: 'smtp.gmail.com',
  //port: 465,
  //secure: true,
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

const APP_NAME = 'enlight';

//check the code matched
exports.checkEmailValidCode = functions.https.onCall(async (data, context) => {
  if (context.app == undefined) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called from an App Check verified app.')
  }
  try {
    const res = await admin
      .firestore()
      .collection("email-valid")
      .where("email", "==", data.email)
      .where("code", "==", data.code)
      .get();
    const docs = res.docs.map(doc => {
      return {
        ...doc.data(),
        id: doc.id,
      }
    });
    if (docs.length === 0) {
      return {
        emailValidPass: false
      }
    } else {
      let doc = docs[0];
      if (doc.createdTime + 1000 * 60 * 30 <= Date.now()) {
        return {
          emailValidPass: false
        }
      }
      return {
        emailValidPass: true
      }
    }
  } catch (err) {
    console.log('error:', err)
    return err;
  }
});

//send the email-code
exports.sendEmailValidCode = functions.https.onCall( async (data, context) => {
  if (context.app == undefined) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called from an App Check verified app.')
  }
  try {
    const code = String(100000 + Math.floor(Math.random() * 1000000));
    await admin.firestore().collection("email-valid").add({
      code: code,
      email: data.email,
      createdTime: Date.now()
    })

    const mailOptions = {
      from: `${APP_NAME} <${gmailEmail}>`,
      to: data.email,
      subject: 'Sign Up Email Valid Code',
      //html: getEmailTemplate(code)
      html:`Hello, This is your code. + ${code}`
    };

    const res = await mailTransport.sendMail(mailOptions);
    return res;
  } catch (err) {
    console.log('error:', err)
    return err;
  }
})

/**
 * Sends a welcome email to new user.
 */
exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
  const email = user.email; // The email of the user.
  const displayName = user.displayName; // The display name of the user.

  return sendWelcomeEmail(email, displayName);
});

/**
 * Send an account deleted email confirmation to users who delete their accounts.
 */
exports.sendByeEmail = functions.auth.user().onDelete((user) => {
  const email = user.email;
  const displayName = user.displayName;

  return sendGoodbyeEmail(email, displayName);
});

/**
 * Send an new survey email notification to users who has new survey to fill in
 */
exports.sendNewSurveyEmail = functions.firestore.document('/{collection}/{id}') //id is survey-answers
.onCreate((snap, context) => {
    const collection = context.params.collection;
    if (collection === 'survey-answer'){
      admin.firestore().collection('survey-answer').doc(context.params.id).get().then((res) => 
      {
        admin.firestore().collection('teacher-info').doc(res.data().teacherID).get().then((res2) => 
        {
          const displayName = res2.data().firstName + " " + res2.data().lastName;
          return sendNewSurveyEmail(res2.data().email, displayName);
          // send email here
        });
      });
    }
  });

  /**
 * Send a survey reminder email notification to users who have unfinished surveys to fill in
 */
exports.sendSurveyReminderEmail = functions.firestore.document('/{collection}/{id}') //id is survey-answers
.onCreate((snap, context) => {
    const collection = context.params.collection;
    if (collection === 'scheduled-survey-reminder'){
      admin.firestore().collection('scheduled-survey-reminder').doc(context.params.id).get().then((res) => 
      {
        admin.firestore().collection('teacher-info').doc(res.data().teacherID).get().then((res2) => 
        {
          const displayName = res2.data().firstName + " " + res2.data().lastName;
          return sendSurveyReminderEmail(res2.data().email, displayName);
          // send email here
        });
      });
    }
  });

// Sends a welcome email to the given user.
async function sendWelcomeEmail(email, displayName) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: email,
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Welcome to ${APP_NAME}!`;
  mailOptions.text = `Hey ${displayName || ''}! Welcome to ${APP_NAME}. I hope you will enjoy our service.`;
  await mailTransport.sendMail(mailOptions);
  console.log(`New welcome email sent to: ${email}`);
  return null;
}

// Sends a goodbye email to the given user.
async function sendGoodbyeEmail(email, displayName) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: email,
  };

  // The user unsubscribed to the newsletter.
  mailOptions.subject = `Bye!`;
  mailOptions.text = `Hey ${displayName || ''}!, We confirm that we have deleted your ${APP_NAME} account.`;
  await mailTransport.sendMail(mailOptions);
  console.log(`Account deletion confirmation email sent to: ${email}`);
  return null;
}

// Sends a new survey notification email to the given user.
async function sendNewSurveyEmail(email, displayName) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: email,
  };

  mailOptions.subject = `New Survey!`;
  mailOptions.text = `Hey ${displayName || ''}!, We're notifying that you have a new survey in your ${APP_NAME} account to fill in.`;
  await mailTransport.sendMail(mailOptions);
  console.log(`New survey notification email sent to: ${email}`);
  return null;
}

// Sends a new survey notification email to the given user.
async function sendSurveyReminderEmail(email, displayName) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: email,
  };

  mailOptions.subject = `Survey Reminder!`;
  mailOptions.text = `Hey ${displayName || ''}!, We're notifying that you have an unfinished survey in your ${APP_NAME} account to fill in.`;
  await mailTransport.sendMail(mailOptions);
  console.log(`Survey reminder notification email sent to: ${email}`);
  return null;
}