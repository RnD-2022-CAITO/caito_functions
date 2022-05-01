// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');

// http callable function (add a teacher). data param: uid, email, firstName, lastName
exports.addTeacher = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("addTeacher context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    return admin.firestore().collection('teacher-info').doc(context.auth.uid).set ({
        email: context.auth.token.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
    });
});

// http callable function (delete a teacher). data param: uid
exports.deleteTeacher = functions.https.onCall((data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    const doc = admin.firestore().collection('teacher-info').doc(data.uid);
    return doc.delete();
});