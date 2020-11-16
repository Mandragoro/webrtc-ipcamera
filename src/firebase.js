import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/messaging';
// import * as firebase from 'firebase/app';\
import firebaseConfig from './firebaseConfig';

class Firebase {
  constructor() {

    app.initializeApp(firebaseConfig);
    this.db = app.firestore();
    this.auth = app.auth();
    this.toki = this.token();
    this.serverTimestamp = app.firestore.FieldValue.serverTimestamp();
    this.firestore = app.firestore;
    this.messaging = app.messaging(); // Retrieve Firebase Messaging object.
    this.messaging.usePublicVapidKey("BNDfMe9OE0GcpP0fRr8tOGnL3NY6tuFra9mFYgwNlxA3jg7Y-dYEI_IGY_uvv7lJ944P1au-Pn8OFN08SY5CxVo"); // Add the public key generated from the console here.
    
    this.messaging.onTokenRefresh(() => { // Callback fired if Instance ID token is updated.
      console.log('onTokenRefresh');
      this.messaging.getToken().then((refreshedToken) => {
        console.log('Token refreshed.');
        this.setTokenSentToServer(false);
        this.sendTokenToServer(refreshedToken);
      }).catch((err) => {
        console.log('Unable to retrieve refreshed token ', err);
      });
    });

  }

  onMessage = (pushFunction) => {
    console.log('onMessage')
    this.messaging.onMessage((payload) => {
      console.log('onMessage: ', payload);
      pushFunction(payload);
    })
  }

  sendTokenToServer (currentToken, deviceName) {
    console.log('sendTokenToServer')
    console.log('currentToken')
    if (!this.isTokenSentToServer()) {
      console.log('Sending token to server...');

      // this.db.collection("users").doc(this.user().uid).set({
      //   messagingId: currentToken,
      // }, { merge: true }).then(function() {
      //     console.log("Document written");
      // }).catch(function(error) {
      //     console.error("Error adding document: ", error);
      // });

      // const roomRef = await db.collection(`users/${uid}/rooms`).doc();
      this.db.collection("users").doc(this.user().uid).update({
        messagingIds: this.firestore.FieldValue.arrayUnion(currentToken),
      }).then(function() {
          console.log("Document written");
      }).catch(function(error) {
          console.error("Error adding document: ", error);
      });

      this.setTokenSentToServer(true);
    } else {
        console.log("Token already sent to server so won't send it again unless it changes");
    }
  }

  isTokenSentToServer() {
    console.log('isTokenSentToServer')
    return window.localStorage.getItem('sentToServer') === 'true';
  }

  setTokenSentToServer(sent) {
    console.log('setTokenSentToServer')
    window.localStorage.setItem('sentToServer', sent ? true : false);
  }

  getMessagingToken = () => {
    console.log('getMessagingToken')
    // Get Instance ID token. Initially this makes a network call, once retrieved subsequent calls to getToken will return from cache.
    this.messaging.getToken().then((currentToken) => {
      console.log('currentToken: ', currentToken)
      if (currentToken) {
        this.sendTokenToServer(currentToken);
      } else {
        console.log('No Instance ID token available. Request permission to generate one.');
        this.messaging.requestPermission();
        this.setTokenSentToServer(false);
      }
    }).catch((err) => {
      console.log('An error occurred while retrieving token. ', err);
      this.setTokenSentToServer(false);
    });
  }

  token = async() => {
    console.log('******************Get User Token**********************');
    const user = this.user()
    if (user) {
      console.log('User Found');
        return await user.getIdToken(/* forceRefresh */ false).then(token => { return token });
    } else {
      console.log('User NOT Found');
        return null;
    }
  }

  user() {
    console.log('user')
    console.log(this.auth.currentUser)
    return this.auth.currentUser;
  }

  // *** Auth API ***
  doCreateUserWithEmailAndPassword = (email, password) =>
  this.auth.createUserWithEmailAndPassword(email, password);

  doSignInWithEmailAndPassword = (email, password) =>
  this.auth.signInWithEmailAndPassword(email, password);

  doSignOut = () => this.auth.signOut();

  doPasswordReset = email => this.auth.sendPasswordResetEmail(email);

  doPasswordUpdate = password =>
  this.auth.currentUser.updatePassword(password);
}
export default Firebase;