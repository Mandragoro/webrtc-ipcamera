import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
// import reportWebVitals from './reportWebVitals';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
// import {firebaseConfig} from './firebaseConfig.js';
// import firebase from "firebase/app";
// import "firebase/auth";
// import "firebase/firestore";
import FirebaseContext from './FirebaseContext';
import Firebase from './firebase.js';

const firebase = new Firebase();

// Initialize Firebase
// firebase.initializeApp(firebaseConfig);

const theme = createMuiTheme({
  palette: {
    type: "dark",
    primary: {
      main: '#7b68ee',
    },
    secondary: {
      main: '#00d1b2',
    },
    background: {
      default: "#282c34",
    }
  },
});

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FirebaseContext.Provider value={firebase}>
        <App />
      </FirebaseContext.Provider>
  </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
// serviceWorkerRegistration.unregister();
serviceWorkerRegistration.register();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../firebase-messaging-sw.js')
  .then(function(registration) {
    console.log('FireB Service worker Registration successful, scope is:', registration.scope);
  }).catch(function(err) {
    console.log('FireB Service worker registration failed, error:', err);
  });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
