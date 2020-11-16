# WebRTC - Android as "IP Camera"

This app creates a WebRTC stream connection between a client device and a remote device, only the remote devices stream aduio/video to the client.

### How it works?
The Idea here is to use an old Android device as a remote IP Camera using WebRTC, when the client wants to wacth the remote streams it creates a room with an offer and sends a push notification to the previously registered remote devices, when the remote device recieves the push notification Tasker intercepts it an opens the pwa, when the pwa opens it looks for active rooms of Firebase and if there is one then it opens the camera, creates an answer and store it in Firebase. When the clients sees an answer the peer to peer conection is made and starts recieving the video/audio stream.

When the client hangs up, the room is deleted and the remote devices close the video feed on the disconected event.

### Get started...
First create a file called "firebaseConfig.js" under "/src", and fill it with your own project data, you can find your project data on your firebase console.

```javascript
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

export const SERVER_TOKEN ='....';

export default firebaseConfig;
```

Run the build comand on your console: 
```javascript
$ npm run build
```

Serve the build folder: 
```javascript
$ serve -s build
```

Now you can go to localhost:5000 or the specified port and install the pwa.

### NOTE:
This app uses default STUN servers from Google and no TURN servers, so if you are behind a double NAT situation with your ISP, the connection may fail.