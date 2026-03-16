const firebaseAdmin = require("firebase-admin");
const serviceAccount = require("../../../BarberSyndicateServiceAccountKey.json");
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

module.exports = firebaseAdmin;
