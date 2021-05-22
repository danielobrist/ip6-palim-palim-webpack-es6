import Config from './data/config';
import Detector from './utils/detector';
import Main from './app/main';
import PeerController from './webrtc/peerController';

// Styles
import './../css/app.scss';

let localStream, remoteStream;

const localVideo = document.querySelector('#localVideo');
const remoteVideo = document.querySelector('#remoteVideo');

// Check environment and set the Config helper
if(__ENV__ === 'dev') {
  console.log('----- RUNNING IN DEV ENVIRONMENT! -----');

  Config.isDev = true;
}

function init() {

  if (!Config.isDev) {
    const peerController = new PeerController();
  }

  // Check for webGL capabilities
  if(!Detector.webgl) {
    Detector.addGetWebGLMessage();
  } else {
    const container = document.getElementById('appContainer');
    new Main(container);
  }
}

function initStream() {
  console.log('initStream with this: ' + this)
  navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    .then(initLocalStream)
    .catch(function(e) {
      console.log('ERROR getting user media:' + e.message)
      alert('getUserMedia() error: ' + e.name);
    });
}

function initLocalStream(stream) {
  console.log('Adding local stream.');
  console.log('stream: ' + stream);
  localStream = stream;
  localVideo.srcObject = stream;
  // this.sendMessage('got user media');
  // if (this.isInitiator) {
  //   this.maybeStart();
  // }
}

initStream()
init();
