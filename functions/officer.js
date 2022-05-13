// these are cloud functions called from the officer side
// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');

// http callable function (add a survey of questions). 
// data param: questions nested array(eg: 1->question, type, options)
exports.addSurveyQuestions = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("addSurveyQuestions context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    return admin.firestore().collection('survey-question').add({
        officerID: context.auth.uid,
        title: data.title,
        questions: data.questions,
        scheduledDate: data.scheduledDate,
        createdDate: new Date(),
    }).then((res) => {
        return res.id;
    });
    /*.then(function(docRef) {
        admin.firestore().collection('officer-info').doc(context.auth.uid).update ({
            survey: FieldValue.arrayUnion(docRef), //push survey id into officer's survey array
        });
    */
});

// http callable function (distribute a survey to a (only one) teacher). for each teacher, add a survey-answer doc.
// data param: questionID, teacherID
exports.distributeSurvey = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("distributeSurvey context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    return admin.firestore().collection('survey-answer').add({
        answers: [],
        questionID: data.questionID,
        teacherID: data.teacherID,
    });
    /*.then(function(docRef) {
        admin.firestore().collection('officer-info').doc(context.auth.uid).update ({
            survey: FieldValue.arrayUnion(docRef), //push survey id into officer's survey array
        });.then((res) => 
    {
        return res.docs.map(doc => doc.data());
    });
    */
});

// http callable function (retrieves a list of teachers).
exports.getAllTeachers = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("getAllTeachers context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    return admin.firestore().collection('teacher-info').get().then((res) => 
    {
        return res.docs.map(doc => doc.data());
    });;
});


// http callable function (delete a teacher from teacher-info collection and auth). 
// data param: teacherID
exports.deleteTeacher = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("deleteTeacher context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }

    // delete user from auth
    admin.auth().deleteUser(data.teacherID);
    // delete user from collection
    const doc = admin.firestore().collection('teacher-info').doc(data.teacherID);
    return doc.delete();
});

// http callable function (retrieves officer's list of created surveys; questions part).
exports.getAllCreatedSurveys_Questions = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("getAllCreatedSurveys_Questions context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    return admin.firestore().collection('survey-question').where('officerID', '==', context.auth.uid).get()
    .then((res) => 
    {
        return res.docs.map(doc => doc.data());
    });
});