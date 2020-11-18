// import logo from './logo.svg';
import React from 'react'
import './App.css';
import Main from './Main.js';

// import firebase from 'firebase';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import  {withFirebase}  from './FirebaseContext';
import FirebaseContext from "./FirebaseContext";

const useStyles = makeStyles({
  loginContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    '& > div': {
      width: '100%',
      maxWidth: '80%',
      padding: 50,
      height: '30%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    },
    '& > div:last-child': {
      width: '100%',
      maxWidth: 400,
      padding: 50,
      height: '30%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    },
  },
  title: {
    width: '80%',
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
  },
  textFieldsContainer: {
    width: '100%',
    display: 'flex',
    marginBottom: 28,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    '& div:first-child': {
      marginBottom: 12,
    },
  },
  buttonContainer: {
    width: '100%',
  },
  errorMessage: {
    color: '#db7093',
  }
});

function App(props) {

  const { firebase } = props;

  const classes = useStyles();

  const getMessagingToken = firebase.getMessagingToken;
  const onMessage = firebase.onMessage;

  const [credentials, setCredentials] = React.useState({email:'', password:''})
  // const [user, setUser] = React.useState(null)
  const [authUser, setAuthUser] = React.useState(null);
  const [redirectToReferrer, setRedirectToReferrer] = React.useState(false);
  const [loginCheck, setLoginCheck] = React.useState(false);
  const [showSignUp, setShowSignUp] = React.useState(false);
  const [loginError, setLoginError] = React.useState(null);

  let authListener = React.useRef(null);

  React.useEffect(() => {
    authListener.current = firebase.auth.onAuthStateChanged(user => {
      if (user) {
        //TODO: Do I need this? I think not...
        // firebase.auth.currentUser.getIdToken(/* forceRefresh */ false).then(function(idToken) {
        //   console.log(idToken);
        //   // Send token to your backend via HTTPS
        // }).catch(function(error) {
        //   // Handle error
        // });
        !authUser && setAuthUser(() => user); // FIXME: check this wall, changing to true instead of user grants access
        !redirectToReferrer && setRedirectToReferrer(() => true);
      } else {
        redirectToReferrer === true && setRedirectToReferrer(() => false);
        authUser !== null && setAuthUser(() => null);
      }
      !loginCheck && setLoginCheck(() => true);
      // spinnerService.hide("loading");
    });
    return () => { authListener.current(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // firebase.auth().onAuthStateChanged(function(user) {
  //   if (user) {
  //     console.log('User is signed in');
  //     setUser(user)
  //     // let displayName = user.displayName;
  //     // let email = user.email;
  //     // let emailVerified = user.emailVerified;
  //     // let photoURL = user.photoURL;
  //     // let isAnonymous = user.isAnonymous;
  //     // let uid = user.uid;
  //     // let providerData = user.providerData;
  //   } else {
  //     console.log('User is signed out');
  //   }
  // });

  const handleChange = (event) => {
    setCredentials((current) => ({...current, [event.target.name]: event.target.value}))
  }

  const handleShowSignUp = (event) => {
    setLoginError(null);
    setShowSignUp((current) => (!current))
  }

  const handleLogin = (firebase) => {
    console.log("handleLogin")
    // firebase.auth().signInWithEmailAndPassword(credentials.email, credentials.password)
    // .catch(function(error) {
    //   // console.log(error);
    // });

    firebase
      .doSignInWithEmailAndPassword(credentials.email, credentials.password)
      .then(data => {
        console.log("SIGNED IN!!!", data);
        // spinnerService.hide("loading");
        loginError && setLoginError(null);
        setAuthUser(() => data);
        setRedirectToReferrer(() => true);
      })
      .catch(error => {
        console.log("SIGN IN ERROR!!!", error);
        setLoginError(error.message);
        // spinnerService.hide("loading");
      });
  }

  const handleSignUp = () => {
    console.log('sign up')
    firebase
      .doCreateUserWithEmailAndPassword(credentials.email, credentials.password)
      .then(data => {
        console.log("SIGNED IN!!!", data);
        // spinnerService.hide("loading");
        loginError && setLoginError(null);
        setAuthUser(() => data);
        setRedirectToReferrer(() => true);
      })
      .catch(error => {
        console.log("CREATE USER ERROR!!!", error);
        setLoginError(error.message);
        // spinnerService.hide("loading");
      });
  }

  return (
    <div>
      <FirebaseContext.Consumer>
      {firebase => {
        return (
          <React.Fragment>
            {authUser ?
              <header className="App-header">
                <Typography component='p' variant="h3" className={classes.title} color="textPrimary" gutterBottom>
                  WebRTC Android "IP Camera"
                </Typography>
                <Main uid={authUser.uid} getMessagingToken={getMessagingToken} onMessage={onMessage} />
              </header>
            :
              <React.Fragment>
                <div className={classes.loginContainer}>

                  <div>
                  <Typography component='p' variant="h3" className={classes.title} color="textPrimary" gutterBottom>
                    WebRTC Android "IP Camera"
                  </Typography>
                  </div>

                  <div>
                    <div className={classes.textFieldsContainer}>
                      <TextField variant='outlined' fullWidth id="standard-basic" label="Email" name='email' type='text' value={credentials.email} onChange={handleChange} />
                      <TextField variant='outlined' fullWidth id="standard-basic" label="Password" name='password' type='password' value={credentials.password} onChange={handleChange} />
                    </div>
                    <div>
                    {loginError && 
                    <Typography component='p' variant="subtitle2" className={classes.errorMessage} color="textPrimary" gutterBottom>
                      {loginError}
                    </Typography>}
                    </div>
                    <div className={classes.buttonContainer}>
                      {showSignUp ?
                        <Button fullWidth variant='contained' color='primary' onClick={()=>handleSignUp(firebase)} >
                          signup
                        </Button>
                      :
                        <Button fullWidth variant='contained' color='primary' onClick={()=>handleLogin(firebase)} >
                          login
                        </Button>
                      }
                    </div>
                  </div>

                  {showSignUp ?
                    <Button variant='text' color='primary' onClick={handleShowSignUp} >
                      Cancel
                    </Button>
                  :
                    // <Button variant='text' color='primary' onClick={handleShowSignUp} >
                    //   Create an account
                    // </Button>
                    null
                  }
                  
                </div>
              </React.Fragment>
            }
          </React.Fragment>
        );}}
      </FirebaseContext.Consumer>
    </div>
  );
}

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         {/* <img src={logo} className="App-logo" alt="logo" /> */}
//         <LogIn />
//         <Main />
//       </header>
//     </div>
//   );
// }

// export default App;
export default withFirebase(App);
