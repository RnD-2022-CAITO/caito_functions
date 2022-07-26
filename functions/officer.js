// these are cloud functions called from the officer side
// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');

// http callable function (add a survey of questions). 
// data param: questions nested array(eg: 1->question, type, options), title
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

// http callable function (sends an unfinished survey reminder to teacher. avoids duplicate reminders). 
// data param: questionID, question title, teacherID, scheduledDate
exports.addSurveyReminder = functions.https.onCall(async (data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("scheduleSurvey context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    let count = 0;
    await admin.firestore().collection('scheduled-survey-reminder').get().then((res) => {
        res.docs.map(doc => {
            if (doc.data().teacherID == data.teacherID && doc.data().answerID == data.answerID){
                ++count;
            }
        });
    });

    if (count == 0){
        return admin.firestore().collection('scheduled-survey-reminder').add({
            answerID: data.answerID, // eventually add link into email; might need answerID for url path
            teacherID: data.teacherID,
            expiryDate: data.expiryDate, // officer shouldn't spam; need some time frame
        });
    }else{
        return "doc exists";
    }
});

// schedular function to check for survey reminder expiry (7 days)
exports.checkSurveyReminder = functions.pubsub.schedule('every 2 minutes').onRun(async (context) => {
    let documents = [];
    let ids = [];
    await admin.firestore().collection('scheduled-survey-reminder').get().then((res) => 
    {
        documents = res.docs.map(doc => doc.data());
        ids = res.docs.map(doc => doc.id);
    });

    // current timestamp in milliseconds
    let ts = Date.now();
    let today = new Date(ts).toLocaleDateString('sv', { timeZone: 'Pacific/Auckland' });
    let index = 0;
    documents.forEach((doc) => {
        let id = String(ids.at(index));
        if (doc.expiryDate == today){
            admin.firestore().collection('scheduled-survey-reminder').doc(id).delete();
        }
        ++index;
    });
    return null;
  });

// http callable function (schedule a survey of questions to a teacher). 
// data param: questionID, question title, teacherID, scheduledDate
exports.scheduleSurvey = functions.https.onCall((data, context) => {
    // context.app will be undefined if the request doesn't include an
    // App Check token. (If the request includes an invalid App Check
    // token, the request will be rejected with HTTP error 401.)
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
      }
    if (!context.auth) {
        console.log("scheduleSurvey context:" + context);
        throw new functions.https.HttpsError (
            'unauthenticated'
        );
    }
    return admin.firestore().collection('scheduled-survey').add({
        questionID: data.questionID,
        questionTitle: data.title,
        teacherID: data.teacherID,
        scheduledDate: data.scheduledDate,
    });
}); // replace distributeSurvey on frontEnd // schedule a bunch of surveys

// schedular function to check for surveys to distribute
exports.scheduledSurveyDistribution = functions.pubsub.schedule('every 2 minutes').onRun(async (context) => {
    let documents = [];
    let ids = [];
    await admin.firestore().collection('scheduled-survey').get().then((res) => 
    {
        documents = res.docs.map(doc => doc.data());
        ids = res.docs.map(doc => doc.id);
    });

    // current timestamp in milliseconds
    let ts = Date.now();
    let today = new Date(ts).toLocaleDateString('sv', { timeZone: 'Pacific/Auckland' });
    let index = 0;
    documents.forEach((doc) => {
        let id = String(ids.at(index));
        if (doc.scheduledDate == today){
            admin.firestore().collection('survey-answer').add({
                answers: [],
                isSubmitted: false,
                questionID: doc.questionID,
                questionTitle: doc.questionTitle,
                teacherID: doc.teacherID,
            }).then((i) => {
                admin.firestore().collection('scheduled-survey').doc(id).delete();
            });
        }
        ++index;
    });
    return null;
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
        return res.docs.map(doc => ({id: doc.id, ...doc.data()}));
    });
});

// http callable function (retrieves a teacher).
exports.getTeacher = functions.https.onCall((data, context) => {
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
    return admin.firestore().collection('teacher-info').doc(data.teacherID).get()
    .then((res) => 
    {
        return res.data();
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
        return res.docs.map(doc => ({id: doc.id, ...doc.data()}));
    });
});

exports.getAllCreatedSurveys_Answers = functions.https.onCall((data, context) => {
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
    return admin.firestore().collection('survey-answer').where('questionID', '==', data.questionID).get()
    .then((res) => 
    {
        return res.docs.map(doc => ({id: doc.id, ...doc.data()}));
    });
});