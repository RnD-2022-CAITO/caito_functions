// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');

// on front end, use 
// const addTeacher = firebase.functions().httpCallable('addTeacher');
// firebase.auth().createUserWithEmailAndPassword(email, password)
//      .then((user) =>{
//          addRequest({
//              uid: user.uid, email: ..., firstName: ..., lastName: ...,
//          })
//      })

// http callable function (add a teacher). data param: uid, email, firstName, lastName
exports.addTeacher = functions.https.onCall((data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    return admin.firestore().collection('teacher-info').doc(data.uid).set ({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
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