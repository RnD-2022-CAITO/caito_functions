const functions = require("firebase-functions");

// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");
const {firestore} = require("firebase-admin");

exports.deleteGroup = functions.https.onCall(async (data, context) => {
  if (context.app == undefined) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called from an App Check verified app.");
  }
  if (!context.auth) {
    console.log("addSurveyQuestions context:" + context);
    throw new functions.https.HttpsError(
      "unauthenticated"
    );
  }
  try {
    const doc = admin.firestore().collection('group-info').doc(data.groupId);
    return doc.delete();
  } catch (err) {
    return {
      'error': err.message
    };
  }
});

exports.getGroupTeachers = functions.https.onCall(async (data, context) => {
  if (context.app == undefined) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called from an App Check verified app.");
  }
  if (!context.auth) {
    console.log("addSurveyQuestions context:" + context);
    throw new functions.https.HttpsError(
      "unauthenticated"
    );
  }
  try {
    const res = await admin.firestore().collection('group-info').doc(data.groupId).get();
    const group = res.data();
    const promises = group.teachers.map(teacherId => {
      return admin.firestore().collection('teacher-info').doc(teacherId).get().then(res => {
        return {
          ...res.data(),
          id: res.id
        }
      });
    });
    const teachers = await Promise.all(promises);
    return {
      ...group,
      teachers: teachers
    }
  } catch (err) {
    return {
      'error': err.message
    };
  }
});

exports.findGroups = functions.https.onCall(async (data, context) => {
  if (context.app == undefined) {
    throw new functions.https.HttpsError(
        "failed-precondition",
        "The function must be called from an App Check verified app.");
  }
  if (!context.auth) {
    console.log("addSurveyQuestions context:" + context);
    throw new functions.https.HttpsError(
        "unauthenticated"
    );
  }
  try {
    const res = await admin.firestore().collection("group-info").get();
    const docs = res.docs.map(doc => {
      return {
        ...doc.data(),
        id: doc.id,
      }
    });
    return docs;

  } catch (err) {
    return {
      'error': err.message
    };
  }
});

exports.removeTeacherFromGroup = functions.https.onCall((data, context) => {
  if (context.app == undefined) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called from an App Check verified app.");
  }
  if (!context.auth) {
    console.log("addSurveyQuestions context:" + context);
    throw new functions.https.HttpsError(
      "unauthenticated"
    );
  }
  const {teacherId, groupId} = data;
  return admin.firestore().collection("group-info")
    .doc(groupId)
    .update({
      teachers: firestore.FieldValue.arrayRemove(teacherId),
    });
});

exports.groupTeacher = functions.https.onCall((data, context) => {
  if (context.app == undefined) {
    throw new functions.https.HttpsError(
        "failed-precondition",
        "The function must be called from an App Check verified app.");
  }
  if (!context.auth) {
    console.log("addSurveyQuestions context:" + context);
    throw new functions.https.HttpsError(
        "unauthenticated"
    );
  }
  const {teacherIds, groupId} = data;
  return admin.firestore().collection("group-info")
      .doc(groupId)
      .update({
        teachers: firestore.FieldValue.arrayUnion(...teacherIds),
      });
});

exports.createGroup = functions.https.onCall(async (data, context) => {
  if (context.app == undefined) {
    throw new functions.https.HttpsError(
        "failed-precondition",
        "The function must be called from an App Check verified app.");
  }
  if (!context.auth) {
    console.log("addSurveyQuestions context:" + context);
    throw new functions.https.HttpsError(
        "unauthenticated"
    );
  }
  try {
    const res = await admin.firestore().collection("group-info").add({
      name: data.name,
      teachers: [],
    });
    return res.id;
  } catch (err) {
    return err.message;
  }
});
