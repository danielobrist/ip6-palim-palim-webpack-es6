import Config from './data/config';
import Detector from './utils/detector';
import GameScene from './app/gameScene';
import VideoChat from './webrtc/videoChat';

// Styles
import './../css/app.scss';
import PeerController from './webrtc/peerController';
import RoomController from './webrtc/roomController';
import { VideoCall } from './webrtc/videoCall';

export {maybeStart};

// const peerController = new PeerController();
// const videoChat = new VideoChat();
// const roomController = new RoomController(videoChat, peerController)
let videoChat;
// Check environment and set the Config helper
if(__ENV__ === 'dev') {
    console.log('----- RUNNING IN DEV ENVIRONMENT! -----');

    Config.isDev = true;
}

initVideoChat()
initGame();


function initVideoChat() {
    new VideoCall();
    // videoChat = new VideoChat();
    // videoChat.joinRoom(prompt('Enter room name please:'));

    // navigator.mediaDevices.getUserMedia({
    //     video: true,
    //     audio: true
    // })
    // .then(initLocalStream)
    // .catch(function(e) {
    //     console.log('ERROR getting user media:' + e.message)
    //     alert('getUserMedia() error: ' + e.name);
    // });

}



function initGame() {
    // Check for webGL capabilities
    if(!Detector.webgl) {
        Detector.addGetWebGLMessage();
    } else {
        const container = document.getElementById('appContainer');
        new GameScene(container);
    }
}

function initLocalStream(stream) {
    console.log('Adding local stream.');
    console.log('stream: ' + stream);
    videoChat._localStream = stream;
    videoChat._localVideo.srcObject = stream;
    videoChat.sendSignalingMessage('got user media');
    // needed=?
    if (videoChat._isInitiator) {
        videoChat.maybeStart();
    }
}

function maybeStart() {
    //TODO call method in videoChat
    console.log('>>>>>>> maybeStart() ', videoChat._isChatStarted, videoChat._localStream, videoChat._isRoomReady);
    if (!videoChat._isChatStarted && typeof videoChat._localStream !== 'undefined' && videoChat._isRoomReady) {
      console.log('>>>>>> creating peer connection');
        //   createPeerConnection();
      
      for (const track of videoChat._localStream.getTracks()) {
        videoChat._peerConnection.addTrack(track);
      }
  
      videoChat._isChatStarted = true;
      console.log('isInitiator', videoChat._isInitiator);
      if (videoChat._isInitiator) {
        // initDataChannel();
        console.log('Created RTCDataChannel');
        videoChat.doCall();
      }
  
    //   gameController.startSharedSceneSync();
    }
}
