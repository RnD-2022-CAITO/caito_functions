// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');
require('dotenv').config();

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

const nodemailer = require('nodemailer');
// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
const gmailEmail = process.env.EMAIL;
const gmailPassword = process.env.PASSWORD;
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

// Your company name to include in the emails
// TODO: Change this to your app or company name to customize the email sent.
const APP_NAME = 'enlight';

// [START sendWelcomeEmail]
/**
 * Sends a welcome email to new user.
 */
// [START onCreateTrigger]
exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
// [END onCreateTrigger]
  // [START eventAttributes]
  const email = user.email; // The email of the user.
  const displayName = user.displayName; // The display name of the user.
  // [END eventAttributes]

  return sendWelcomeEmail(email, displayName);
});
// [END sendWelcomeEmail]

// [START sendByeEmail]
/**
 * Send an account deleted email confirmation to users who delete their accounts.
 */
// [START onDeleteTrigger]
exports.sendByeEmail = functions.auth.user().onDelete((user) => {
// [END onDeleteTrigger]
  const email = user.email;
  const displayName = user.displayName;

  return sendGoodbyeEmail(email, displayName);
});
// [END sendByeEmail]

// [START sendNewSurveyEmail]
/**
 * Send an new survey email notification to users who has new survey to fill in
 */
// [START sendNewSurveyEmail]
exports.sendNewSurveyEmail = functions.firestore.document('/{collection}/{id}') //id is survey-answers
.onCreate((snap, context) => {
  // [END sendNewSurveyEmail]
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
  // [END sendNewSurveyEmail]

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
  //functions.logger.log(`New welcome email sent to: ${email}`);
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
  //functions.logger.log(`Account deletion confirmation email sent to: ${email}`);
  console.log(`Account deletion confirmation email sent to: ${email}`);
  return null;
}

// Sends a goodbye email to the given user.
async function sendNewSurveyEmail(email, displayName) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: email,
  };

  // The user unsubscribed to the newsletter.
  mailOptions.subject = `New Survey!`;
  mailOptions.text = `Hey ${displayName || ''}!, We're notifying that you have a new survey in your ${APP_NAME} account to fill in.`;
  await mailTransport.sendMail(mailOptions);
  //functions.logger.log(`Account deletion confirmation email sent to: ${email}`);
  console.log(`New survey notification email sent to: ${email}`);
  return null;
}