// retrieve user data
// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');

exports.getUserInfo = functions.https.onCall( async (data, context) => {
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

    const  docExists = (await db.collection("teacher-info").doc(context.auth.uid).get()).exists

    if(docExists){
        await db.collection("teacher-info").doc(context.auth.uid).get().then((querySnapshot) => {
            return querySnapshot.data();
        })
    } else {
        await db.collection("officer-info").doc(context.auth.uid).get().then((querySnapshot) => {
            return querySnapshot.data();
        })
    }
})