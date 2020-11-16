import React from 'react';
import firebase from 'firebase';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import { Typography } from '@material-ui/core';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import {SERVER_TOKEN} from './firebaseConfig';
// import axios from 'axios'

const axios = window.axios;

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  buttons: {
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 42,
    '& div': {
      display: 'flex',
      // width: '80vw',
    },
    '& button': {
      margin: 8,
    },
  },
  message: {
    textAlign: 'center',
    marginBottom: 42,
  },
  roomIdText: {
    color: '#7b68ee',
  },
  videosContainer: {
    width: '90vw',
    margin: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '& div': {
      display: 'flex',
      flexWrap: 'wrap',
      '& video': {
        height: '100%',
        width: '100%',
        maxWidth: 680,
        margin: 'auto',
        padding: 12,
        display: 'flex',
        flexBasis: 300,
      },
    },
  },
  formControl: {
    minWidth: 120,
  },
}));

function setMediaBitrates(sdp) {
  return setMediaBitrate(setMediaBitrate(sdp, "video", 200), "audio", 50);
}
 
function setMediaBitrate(sdp, media, bitrate) {
  var lines = sdp.split("\n");
  var line = -1;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf("m="+media) === 0) {
      line = i;
      break;
    }
  }
  if (line === -1) {
    console.log("Could not find the m line for", media);
    return sdp;
  }
  console.log("Found the m line for", media, "at line", line);
 
  // Pass the m line
  line++;
 
  // Skip i and c lines
  while(lines[line].indexOf("i=") === 0 || lines[line].indexOf("c=") === 0) {
    line++;
  }
 
  // If we're on a b line, replace it
  if (lines[line].indexOf("b") === 0) {
    console.log("Replaced b line at line", line);
    lines[line] = "b=AS:"+bitrate;
    return lines.join("\n");
  }
  
  // Add a new b line
  console.log("Adding new b line before line", line);
  var newLines = lines.slice(0, line)
  newLines.push("b=AS:"+bitrate)
  newLines = newLines.concat(lines.slice(line, lines.length))
  return newLines.join("\n")
}

function Main(props) {

  const {
    uid,
    getMessagingToken,
    onMessage,
  } = props;

  const classes = useStyles();

  const [currentRoom, setCurrentRoom] = React.useState({});
  const [open, setOpen] = React.useState(false);
  const [buttonsDisabled, setButtonsDisabled] = React.useState({
    cameraBtn: false,
    hangupBtn: true,
    createBtn: true,
    joinBtn: true,
  });
  // const [peerConnection, setPeerConnection] = React.useState(null);
  const peerConnection = React.useRef(null);
  const peerConnections = React.useRef([]);
  const [roomId, _setRoomId] = React.useState('');
  const [rooms, setRooms] = React.useState([]);
  const [videoEnabled, setVideoEnabled] = React.useState({local: null, remote: null});
  const [pushNotificationsSent, setPushNotificationsSent] = React.useState('');

  const [localStream, setLocalStream] = React.useState(null);
  // const [remoteStream, setRemoteStream] = React.useState(null);
  const [remoteVideos, setRemoteVideos] = React.useState({});
  const remoteVideosRefs = React.useRef(remoteVideos);

  const remoteVideoRefs = React.useRef([]);
  const localVideoRef = React.useRef(null);
  const roomIdRef = React.useRef(roomId); // Listeners need a ref, can't access latest state
  const ongoingCallRef = React.useRef(false);
  const cameraId = React.useRef(null);
  const pushTimeout = React.useRef(null);

  React.useEffect(() => {
    getRooms();
    getMessagingToken() //TODO: send device name to store it along messagin id
    onMessage(handlePushNotificationArrived);
    return () => {
      clearTimeout(pushTimeout.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (roomId) {
      console.log(roomId)
    }
  }, [roomId])

  React.useEffect(() => {
    console.log('Rooms: ', rooms);
    if (rooms.length > 0) {
      openUserMedia(true);
      setVideoEnabled(()=>({local: true, remote: false}))
      setButtonsDisabled((current) => ({...current, createBtn: true, joinBtn: true}));
      // joinRoomById(rooms[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms])

  React.useEffect(() => {
    // This is only for auto join
    if (localStream !== null) {
      // console.log('localStream: ',localStream)
      // console.log('remoteStream: ',remoteStream)
      localVideoRef.current.srcObject = localStream;
      joinRoomById(rooms[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream])

  React.useEffect(() => {
    if (videoEnabled.local === true) {
      console.log('videoEnabled.local: ',videoEnabled.local)
      // joinRoomById(rooms[0]);
    }
  }, [videoEnabled.local])

  React.useEffect(() => {
    console.log('---remoteVideos Effect---')
    if (Object.keys(remoteVideos).length > 0) {
      console.log(remoteVideos)
      console.log(remoteVideoRefs)
      Object.keys(remoteVideos).forEach((id, index)=> {
        console.log(id)
        console.log(remoteVideoRefs.current[index])
        console.log(remoteVideoRefs.current[index].srcObject)
        if(remoteVideoRefs.current[index].srcObject === null) {
          console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
          console.log(remoteVideos[id])
          remoteVideoRefs.current[index].srcObject = remoteVideos[id];
        }
      })
      // remoteVideoRefs.current[0].srcObject.addEventListener('removetrack', (event) => {
      //   console.log(`Video track: ${event.track.label} removed`);
      //   console.log(event.track.label);
      // });
    }

    // if (remoteVideos.length > 0) {
    //   remoteVideos.forEach((stream, index)=>{
    //     remoteVideoRefs.current[index].srcObject = stream;
    //   })
    // }

    // console.log(remoteVideos)
    // if (remoteVideos.length > 0) {
    //   remoteVideos.forEach((stream, index)=>{
    //     remoteVideoRefs.current[index].srcObject = stream;
    //   })
    // }
  }, [remoteVideos])

  const setRoomId = data => {
    roomIdRef.current = data;
    _setRoomId(data);
  };

  const handlePushNotificationArrived = (payload) => {
    // Push notification arrived on FOREGROUND
    console.log(payload)
  };

  const handleSelectChange = (event) => {
    console.log(event.target.value)
    setRoomId(event.target.value);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const configuration = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  const getLocalTracks = () => {
    localStream.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, localStream);
    });
  }

  const addTracksListener = (peerConnection) => {
    if (peerConnections.current.length > 0) {
      console.log('---add track listener---')
      peerConnection.addEventListener('track', event => {
        console.log('Got remote track:', event.streams[0]);
        let tmpRemoteStream = new MediaStream(); // create new media stream for incoming tracks
        event.streams[0].getTracks().forEach(track => {
          console.log('Add a track to the remoteStream:', track);
          tmpRemoteStream.addTrack(track);
        });
        remoteVideosRefs.current = {...remoteVideosRefs.current, [event.streams[0].id]:tmpRemoteStream};
        setRemoteVideos((current) => ({...current, [event.streams[0].id]:tmpRemoteStream}));
      });
    }
  }

  const addIceCandidateListener = async(peerConnection, docId) => {
    if (peerConnections.current.length > 0) {
      const db = firebase.firestore();
      // const roomRef = await db.collection(`users/${uid}/rooms`).doc(roomIdRef.current);
      // const callerCandidatesCollection = roomRef.collection('callerCandidates');
      const callerCandidatesCollection = await db.collection(`users/${uid}/rooms/${roomIdRef.current}/cameras/${docId}/callerCandidates`);
      // const callerCandidatesCollection = roomRef.collection('callerCandidates');
      peerConnection.addEventListener('icecandidate', event => {
        if (!event.candidate) {
          console.log('Got final candidate!');
          return;
        }
        console.log('Got candidate: ', event.candidate);
        callerCandidatesCollection.add(event.candidate.toJSON());
      });
    }
  }

  const sendPushNotifications = async() => {
    console.log('Sending push notifications to all registered devices...')
    const db = firebase.firestore();
    const tokensSnapshot = await db.collection(`users`).doc(uid).get();
    const tokens = tokensSnapshot.data().messagingIds;
    const errorTokenIndexes = [];
    let results = [];
    console.log('Push tokens: ', tokens);
    console.log('SERVER_TOKEN: ', SERVER_TOKEN);

    const config = {
      headers: { Authorization: `Bearer ${SERVER_TOKEN}` }
    };

    pushTimeout.current = setTimeout(() => {
      // badge: 72x72.png
      // icon: 512.png
      const bodyParameters = {
        "data": {
          "title": "Incoming call...",
          "body": "Start webrtc chat",
          "icon": "./logo192.png",
          "badge": "./logo192.png",
          // "click_action": "https://google.com"
        },
        // "to": token
        "registration_ids": tokens
      };
  
      axios.post('https://fcm.googleapis.com/fcm/send', 
      bodyParameters,
      config
      ).then(function (response) {
        // console.log(response);
        results = response.data.results;
        // console.log(results);
        results.forEach((token, index) => {
          if (token.hasOwnProperty('error')) {
            errorTokenIndexes.push(tokens[index]);
          }
        });
        // console.log(errorTokenIndexes);
        if (errorTokenIndexes.length > 0) {
          db.collection(`users`).doc(uid).update({
            messagingIds: firebase.firestore.FieldValue.arrayRemove(...errorTokenIndexes),
          }).then(function() {
              console.log("Unregistered messagingIds tokens deleted...");
          }).catch(function(error) {
              console.error("Error removing tokens from messagingIds array: ", error);
          });
        }

        setPushNotificationsSent('Push notifications sent');
      }).catch(function (error) {
        console.log(error);
        setPushNotificationsSent('Error sending push notifications', error);
      });
    }, 5000);
  }
  
  async function createRoom() {
    setButtonsDisabled((current) => ({...current, createBtn: true, joinBtn: true}));
    setVideoEnabled(() => ({local: false, remote: true}))
    const db = firebase.firestore();
    const roomRef = await db.collection(`users/${uid}/rooms`).doc();
  
    console.log('Create PeerConnection with configuration: ', configuration);
    // peerConnection.current = new RTCPeerConnection(configuration);
    peerConnections.current = [new RTCPeerConnection(configuration)];
  
    registerPeerConnectionListeners(peerConnections.current[0]);
  
    // Code for collecting ICE candidates below
    const callerCandidatesCollection = roomRef.collection('callerCandidates');
    peerConnections.current[0].addEventListener('icecandidate', event => {
      if (!event.candidate) {
        console.log('Got final candidate!');
        return;
      }
      console.log('Got candidate: ', event.candidate);
      callerCandidatesCollection.add(event.candidate.toJSON());
    });
    // Code for collecting ICE candidates above
  
    // Code for creating a room below
    const offer = await peerConnections.current[0].createOffer({offerToReceiveVideo:true,offerToReceiveAudio:true});
    await peerConnections.current[0].setLocalDescription(offer);
    offer.sdp = setMediaBitrates(offer.sdp); // Change bitrate, limit WebRTC bandwidth
    console.log('Created offer:', offer);
    console.log('Created offer:', offer.sdp);
  
    const roomWithOffer = {
      'offer': {
        type: offer.type,
        sdp: offer.sdp,
      },
    };

    await roomRef.set(roomWithOffer);
    setRoomId(roomRef.id);
    console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);
    setCurrentRoom(() => ({
      roomId: roomRef.id,
      message:`You are the caller, Room ID: `
    }))
    sendPushNotifications();
    // Code for creating a room above
  
    peerConnections.current[0].addEventListener('track', event => {
      console.log('Got remote track:', peerConnections.current[0]);
      // console.log('Got remote track:', peerConnection.current.getSenders());
      console.log('Got remote track:', event.streams[0]);
      console.log('Got remote track ID:', event);
      let tmpRemoteStream = new MediaStream(); // create new media stream for incoming tracks
      event.streams[0].getTracks().forEach(track => {
        console.log('Add a track to the remoteStream:', track);
        tmpRemoteStream.addTrack(track);
      });
      remoteVideosRefs.current = {...remoteVideosRefs.current, [event.streams[0].id]:tmpRemoteStream};
      setRemoteVideos((current) => ({...current, [event.streams[0].id]:tmpRemoteStream}));
      // setRemoteVideos((current) => {
      //   let n = new Map(current);
      //   n.set({[event.streams[0].id]:tmpRemoteStream})
      //   return n;
      // });
      // setRemoteVideos((current) => ([...current, tmpRemoteStream]));
    });
  
    // Listening for remote session description below
    roomRef.collection(`cameras`).onSnapshot(async snapshot => {
      console.log('remote session')
      snapshot.docChanges().forEach(async(change) => {
        console.log(change.doc.id)
        console.log(change.doc.data())
        console.log(change.doc.data().offer)
        if (change.type === 'added') {
          if (!peerConnections.current[0].currentRemoteDescription && change.doc.data() && change.doc.data().answer) {
            console.log('Got remote description: ', change.doc.data().answer);
            const rtcSessionDescription = new RTCSessionDescription(change.doc.data().answer);
            await peerConnections.current[0].setRemoteDescription(rtcSessionDescription);
          } 
          else if (change.doc.data() && change.doc.data().offer) {
            console.log('Got remote description: ', change.doc.data().offer);

            const tmpPeerConntection = new RTCPeerConnection(configuration);
            peerConnections.current = [...peerConnections.current, tmpPeerConntection];
            console.log(peerConnections.current)
            const lastPc = peerConnections.current.length - 1;
            registerPeerConnectionListeners(peerConnections.current[lastPc]);
            addIceCandidateListener(peerConnections.current[lastPc], change.doc.id);
            addTracksListener(peerConnections.current[lastPc]);

            await peerConnections.current[lastPc].setRemoteDescription(new RTCSessionDescription(change.doc.data().offer));
            const answer = await peerConnections.current[lastPc].createAnswer();
            console.log('Created answer:', answer);
            await peerConnections.current[lastPc].setLocalDescription(answer);
            answer.sdp = setMediaBitrates(answer.sdp); // Change bitrate, limit WebRTC bandwidth
  
            const roomWithAnswer = {answer: {type: answer.type, sdp: answer.sdp}};
            // await roomRef.update(roomWithAnswer);
            await roomRef.collection("cameras").doc(change.doc.id).update(roomWithAnswer);
          }
          // Listen for remote ICE candidates below
          roomRef.collection(`cameras/${change.doc.id}/calleeCandidates`).onSnapshot(snapshot => {
            snapshot.docChanges().forEach(async change => {
              if (change.type === 'added') {
                let data = change.doc.data();
                console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                if (peerConnections.current.length > 0) {
                  const lastPc = peerConnections.current.length - 1;
                  await peerConnections.current[lastPc].addIceCandidate(new RTCIceCandidate(data));
                } else {
                  await peerConnections[0].current.addIceCandidate(new RTCIceCandidate(data));
                }
              }
            });
          });
          // Listen for remote ICE candidates above
        }
      })
    });
    // Listening for remote session description above
  }
  
  async function joinRoom() {
    setButtonsDisabled((current)=>({...current, createBtn: true, joinBtn: true}));
    handleClickOpen()
  }

  async function getRooms() {
    const db = firebase.firestore();
    const roomRef = db.collection(`users/${uid}/rooms`);
    const roomSnapshot = await roomRef.get();
    let idsArr = [];
    roomSnapshot.forEach(doc => {
      // console.log(doc.id, '=>', doc.data());
      idsArr.push(doc.id);
    });
    setRooms(() => idsArr);
    if (idsArr.length > 0) {
      return true
    } else return false
  }

  async function isOngoingCall() {
    const db = firebase.firestore();
    const roomRef = db.collection(`users/${uid}/rooms`);
    const roomSnapshot = await roomRef.get();
    roomSnapshot.forEach(async doc => {
      if (doc.data().ongoing === true) {
        ongoingCallRef.current = true;
      }
    });
  }
  
  async function joinRoomById(roomId) {
    setCurrentRoom(() => ({
      roomId: roomId,
      message:`You are the callee, Room ID: `
    }))
    setRoomId(roomId);
    const db = firebase.firestore();
    const roomRef = db.collection(`users/${uid}/rooms`).doc(`${roomId}`);
    const roomSnapshot = await roomRef.get();
    console.log('Got room:', roomSnapshot.exists);

    await isOngoingCall(); // Check if there is an ongoing call
  
    if (roomSnapshot.exists) {
      console.log('Create PeerConnection with configuration: ', configuration);
      peerConnection.current = new RTCPeerConnection(configuration);
      registerPeerConnectionListeners(peerConnection.current);
      getLocalTracks();

      // Code for collecting ICE candidates below
      // const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
      const camerasCollection = roomRef.collection('cameras').doc();
      cameraId.current = camerasCollection.id;
      console.log('calleeCandidatesCollection')
      peerConnection.current.addEventListener('icecandidate', event => {
        console.log('addEventListener icecandidate');
        if (!event.candidate) {
          console.log('Got final candidate!');
          return;
        }
        console.log('Got candidate: ', event.candidate);
        // calleeCandidatesCollection.add(event.candidate.toJSON());
        roomRef.collection(`cameras/${camerasCollection.id}/calleeCandidates`).add(event.candidate.toJSON());
        console.log(camerasCollection.id)
      });
      // Code for collecting ICE candidates above

      // tmpPeerConnection.addEventListener('track', event => {
      //   console.log('Got remote track:', event.streams[0]);
      //   event.streams[0].getTracks().forEach(track => {
      //     console.log('Add a track to the remoteStream:', track);
      //     // remoteStream.addTrack(track);
      //   });
      // });
      
      if (ongoingCallRef.current === true) {
        console.log('---------ongoingCallRef--------------:', ongoingCallRef.current);
        // const roomRef2 = db.collection(`users/${uid}/rooms`)
        // roomRef.onSnapshot(async snapshot => {
        //   console.log('Got remote description: ', snapshot.data());
        //   console.log('Got remote description: ', snapshot.data().answer);
        //   if (snapshot.data() && snapshot.data().answer) {
        //     const rtcSessionDescription = new RTCSessionDescription(snapshot.data().answer);
        //     await peerConnection.current.setRemoteDescription(rtcSessionDescription);
        //   }
        //   // snapshot.docChanges().forEach(async(change) => {
        //   //   console.log(change.doc.data())
        //   // })
        // })

        roomRef.collection(`cameras`).doc(camerasCollection.id).onSnapshot(async snapshot => {
          if (snapshot.data() && snapshot.data().answer) {
            console.log('Got remote description: ' ,snapshot.data().answer)
            const rtcSessionDescription = new RTCSessionDescription(snapshot.data().answer);
            await peerConnection.current.setRemoteDescription(rtcSessionDescription);
          }
        })

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        offer.sdp = setMediaBitrates(offer.sdp); // Change bitrate, limit WebRTC bandwidth
        console.log('Created offer:', offer);

        const roomWithOffer = {'offer': {type: offer.type,sdp: offer.sdp}};
        await roomRef.collection(`cameras`).doc(`${camerasCollection.id}`).set(roomWithOffer);

        // Listening for remote ICE candidates below
        roomRef.collection(`cameras/${camerasCollection.id}/callerCandidates`).onSnapshot(snapshot => {
          console.log('remote ICE candidates')
          snapshot.docChanges().forEach(async change => {
            if (change.type === 'added') {
              let data = change.doc.data();
              console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(data));
            }
          });
        });
        // Listening for remote ICE candidates above

      } else {
        // Code for creating SDP answer below
        const offer = roomSnapshot.data().offer;
        console.log('Got offer:', offer);
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        console.log('Created answer:', answer);
        await peerConnection.current.setLocalDescription(answer);
        answer.sdp = setMediaBitrates(answer.sdp); // Change bitrate, limit WebRTC bandwidth
    
        const roomWithAnswer = {answer: {type: answer.type, sdp: answer.sdp}};
        // await roomRef.update(roomWithAnswer);
        await roomRef.collection(`cameras`).doc(`${camerasCollection.id}`).set(roomWithAnswer);
        await roomRef.update({ongoing: true});
        // Code for creating SDP answer above

        // Listening for remote ICE candidates below
        roomRef.collection('callerCandidates').onSnapshot(snapshot => {
          console.log('remote ICE candidates')
          snapshot.docChanges().forEach(async change => {
            if (change.type === 'added') {
              let data = change.doc.data();
              console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(data));
            }
          });
        });
        // Listening for remote ICE candidates above
      }
    }
  }
  
  async function openUserMedia(isAutoAnwer) {
    const min = Math.ceil(0);
    const max = Math.floor(1);
    const r = Math.floor(Math.random() * (max - min + 1) + min);
    console.log('-------------------------------',r)
    try {
      if (isAutoAnwer === true) {
        const stream = await navigator.mediaDevices.getUserMedia(
          {
            video: { 
              facingMode: "environment",
              frameRate: { ideal: 10, max: 15 }
             } ,  
            audio: true
            // audio: r === 1 ? true : false ,
          });
        // document.querySelector('#localVideo').srcObject = stream;
        setLocalStream(() => (stream));
      }

      // if (isAutoAnwer === false) {
      //   console.log(isAutoAnwer)
      //   let tmpRemoteStream = new MediaStream();
      //   // setRemoteStream(() => (tmpRemoteStream));
      //   // document.querySelector('#remoteVideo').srcObject = tmpRemoteStream;
      // }
    
      // console.log('Stream:', document.querySelector('#localVideo').srcObject);
      isAutoAnwer===true ? setButtonsDisabled(()=>({
        cameraBtn: true,
        hangupBtn: false,
        createBtn: true,
        joinBtn: true,
      }))
      :
      setButtonsDisabled(()=>({
        cameraBtn: true,
        hangupBtn: false,
        createBtn: false,
        joinBtn: false,
      }))
    } catch (error) {
      console.log(error);
      setCurrentRoom(() => ({
        roomId: '',
        message: error.message
      }))
    }
  }
  
  async function hangUp(e) {

    if (videoEnabled.local === true) {
      const tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      localVideoRef.current.srcObject = null;
      peerConnection.current.close();
      setLocalStream(null);
    }
  
    if (videoEnabled.remote === true) {
      if (remoteVideos) {
        Object.values(remoteVideos).forEach((remoteVideo) => {
          remoteVideo.getTracks().forEach(track => track.stop());
        })
      }
      remoteVideoRefs.current.forEach(ref => {
        if(ref) ref.srcObject = null
      })
      // peerConnection.current.close();
      peerConnections.current.forEach(peerConnection => peerConnection.close())
      remoteVideosRefs.current = {};
      setRemoteVideos(() => ({}));
    }

    setButtonsDisabled((current) => ({...current, cameraBtn:false, joinBtn: true, createBtn: true, hangupBtn: true}))
    setPushNotificationsSent(() => (''))
    setCurrentRoom(() => {})
  
    // Delete room on hangup
    console.log('roomId: ',roomId)
    console.log('roomId: ',roomIdRef.current)
    let tmpRoomId = roomId ? roomId : roomIdRef.current;
    if (tmpRoomId) {
      const db = firebase.firestore();
      const roomRef = db.collection(`users/${uid}/rooms`).doc(tmpRoomId);

      // if (videoEnabled.local && cameraId.current) {
      //   const calleeCandidates = await roomRef.collection(`cameras/${cameraId.current}/calleeCandidates`).get();
      //   console.log('delete calleeCandidates')
      //   calleeCandidates.forEach(async candidate => {
      //     await candidate.ref.delete();
      //   });
      //   const callerCandidates = await roomRef.collection(`cameras/${cameraId.current}/callerCandidates`).get();
      //   console.log('delete callerCandidates')
      //   callerCandidates.forEach(async candidate => {
      //     await candidate.ref.delete();
      //   });
      //   roomRef.collection('cameras').doc(cameraId.current).delete();
      // } else if (videoEnabled.remote) {
        const callerCandidates = await roomRef.collection('callerCandidates').get();
        callerCandidates.forEach(async candidate => {
          await candidate.ref.delete();
        });
        const cameras = await roomRef.collection('cameras').get();
        cameras.forEach(async camera => {
          const calleeCandidates = await roomRef.collection(`cameras/${camera.id}/calleeCandidates`).get();
          calleeCandidates.forEach(async candidate => {
            await candidate.ref.delete();
          })
          const callerCandidates = await roomRef.collection(`cameras/${camera.id}/callerCandidates`).get();
          callerCandidates.forEach(async candidate => {
            await candidate.ref.delete();
          })
          await camera.ref.delete();
        });
        await roomRef.delete();
      // }
    }
  }

  const registerPeerConnectionListeners = (peerConnection) => {
    peerConnection.addEventListener('icegatheringstatechange', () => {
      console.log(
          `ICE gathering state changed: ${peerConnection.iceGatheringState}`);
    });
  
    peerConnection.addEventListener('connectionstatechange', () => {
      console.log(`Connection state change: ${peerConnection.connectionState}`);
      console.log(peerConnection);
      // --On watcher device--
      // when device answer: connecting, connected
      // when camera disconnects: disconnected, failed
      // --On camera device--
      // when device answer: connecting, connected
      // when watcher disconnects: disconnected, failed
      if (peerConnection.connectionState === 'disconnected' && peerConnection.getRemoteStreams().length > 0) {

        const streamId = peerConnection.getRemoteStreams()[0].id;
        console.log('streamId: ',streamId);

        const tmpRemoteVideosIds = Object.keys(remoteVideosRefs.current);
        console.log(tmpRemoteVideosIds)

        for (let i = 0; i < tmpRemoteVideosIds.length; i++) {
          if (tmpRemoteVideosIds[i] === streamId && peerConnections.current.length > 0) {
            console.log('found remote video index, closing it...')
            remoteVideosRefs.current[streamId].getTracks().forEach(track => track.stop());

            console.log(peerConnections.current)
            peerConnections.current[i].close();
            remoteVideoRefs.current[i].srcObject = null;

            const tmpRemoteVideos = Object.assign({}, remoteVideosRefs.current);
            delete tmpRemoteVideos[streamId]

            remoteVideosRefs.current = tmpRemoteVideos;
            setRemoteVideos(tmpRemoteVideos);

            break;

          } else if (i === tmpRemoteVideosIds.length - 1) {
            console.log('not found remote video is first one, closing it...')
            console.log(peerConnection)
            peerConnection.close()
            remoteVideoRefs.current[0].srcObject = null;
            const tmpRemoteVideos = Object.assign({}, remoteVideosRefs.current);
            delete tmpRemoteVideos[streamId]
            remoteVideosRefs.current = tmpRemoteVideos;
            setRemoteVideos(tmpRemoteVideos);
          }
        }
      } else if (peerConnection.connectionState === 'disconnected') {
        const tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => {
          track.stop();
        });
        localVideoRef.current.srcObject = null;
        peerConnection.close();
        setLocalStream(null);
      }
    });
  
    peerConnection.addEventListener('signalingstatechange', () => {
      console.log(`Signaling state change: ${peerConnection.signalingState}`);
      // --On watcher device--
      // when creating a room: have-local-offer
      // when device answer: stable
      // --On camera device--
      // when device answer: have-remote-offer
      // when device answer: stable
    });
  
    peerConnection.addEventListener('iceconnectionstatechange ', () => {
      console.log(
          `ICE connection state change: ${peerConnection.iceConnectionState}`);
    });
  }
  
  return (
    <div>
      <div id="buttons" className={classes.buttons}>
        <div>
          {!buttonsDisabled.cameraBtn && 
          <Button size="small" variant="contained" color="primary" disabled={buttonsDisabled.cameraBtn} id="cameraBtn" onClick={()=>openUserMedia(false)}>
            <span className="mdc-button__label">Open camera & mic</span>
          </Button>}
          {!buttonsDisabled.createBtn && 
          <Button size="small" variant="contained" color="primary" disabled={buttonsDisabled.createBtn} id="createBtn" onClick={createRoom}>
            <span className="mdc-button__label">Create room</span>
          </Button>}
          {!buttonsDisabled.joinBtn && 
          <Button size="small" variant="contained" color="primary" disabled={buttonsDisabled.joinBtn} id="joinBtn" onClick={joinRoom}>
            <span className="mdc-button__label">Join room</span>
          </Button>}
          {!buttonsDisabled.hangupBtn && 
          <Button size="small" variant="contained" color="primary" disabled={buttonsDisabled.hangupBtn} id="hangupBtn" onClick={hangUp}>
            <span className="mdc-button__label">Hangup</span>
          </Button>}
          <Button size="small" variant="contained" color="primary" onClick={()=>sendPushNotifications()}>
            <span>Send Push</span>
          </Button>
        </div>
      </div>

      <div className={classes.message}>
        {currentRoom &&
          <Typography className={classes.title} color="textSecondary" gutterBottom>
          {currentRoom.message}
          <Typography component='span' variant='body1' className={classes.roomIdText} color="textSecondary" gutterBottom>
            {currentRoom.roomId}
          </Typography>
        </Typography>}
        <div>
          <Typography component='span' variant='body1' color="textSecondary" gutterBottom>
            {pushNotificationsSent}
          </Typography>
        </div>
      </div>

      <div id="videos" className={classes.videosContainer}>
        <div id="videosContainer">
          {localStream && 
            <video 
              ref={el => (localVideoRef.current = el)} 
              id="myLocalVideo" 
              controls muted autoPlay playsInline
            />
          }
          {Object.keys(remoteVideos).map((id, index) => {
            console.log(id)
            return (
              <video 
                key={index} 
                ref={el => (remoteVideoRefs.current[index] = el)} 
                id="myRemoteVideo" 
                controls autoPlay playsInline
              />
            );
          })}
        </div>
      </div>

      <Dialog keepMounted={false} open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Join Call</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Join the call using an existing ID.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="ID"
            type="text"
            fullWidth
            onChange={(event) => setRoomId(event.target.value)}
          />
          {rooms.length > 0 &&
            <FormControl className={classes.formControl}>
            <InputLabel id="demo-simple-select-label">Rooms</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={roomId}
              onChange={handleSelectChange}
            >
              {rooms.map((val, index) => (<MenuItem key={index} value={val}>{val}</MenuItem>))}
            </Select>
          </FormControl>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button color="primary" onClick={() => {
            handleClose();
            joinRoomById(roomId);
            }}
          >
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default Main
