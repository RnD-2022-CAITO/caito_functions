// these are cloud functions called from the teacher side
// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');

// http callable function (add a teacher). data param: firstName, lastName
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
        role: 'teacher',
    });
});

// http callable function (add a bio section). data param: sectionName, sectionData
exports.addBioSection = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("addBioSection context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    return admin.firestore().collection('teacher-info').doc(context.auth.uid).set({
         [data.sectionName] : data.sectionData,
    }, { merge: true });
});

// http callable function (retrieves a list of assigned surveys; answers part).
exports.getAllAssignedSurveys_Answers = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("getAllAssignedSurveys_Answers context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    return admin.firestore().collection('survey-answer').where('teacherID', '==', context.auth.uid).get()
    .then((res) => 
    {
        return res.docs.map(doc => doc.data());
    });;
});

// http callable function (retrieves a specific assigned survey; answers part).
exports.getAssignedSurvey_Answers = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("getAllAssignedSurveys_Answers context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    return admin.firestore().collection('survey-answer').doc(data.answerID).get()
    .then((res) => 
    {
        return res.data();
    });;
});

// http callable function (updates an assigned survey; answers part).
// data param: answerID, answers array
exports.updateAssignedSurvey_Answers = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("updateAssignedSurvey_Answers context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    return admin.firestore().collection('survey-answer').doc(data.answerID).update({
        answers: data.answers,
        isSubmitted: data.isSubmitted
    });
});

// http callable function (retrieves an assigned survey; questions part).
// data param: questionID
exports.getAssignedSurvey_Questions = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("getAssignedSurvey_Questions context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    return admin.firestore().collection('survey-question').doc(data.questionID).get()
    .then((res) => 
    {
        return res.data();
    });;
});

// http callable function (retrieves the individual teacher's information).
exports.getBasicTeacherInfo = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("getBasicTeacherInfo context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    return admin.firestore().collection('teacher-info').doc(context.auth.uid).get()
    .then((res) => 
    {
        return res.data();
    });;
});