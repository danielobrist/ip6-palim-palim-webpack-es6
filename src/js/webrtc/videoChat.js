import PeerConnection from './peerConnection';
import PeerController from './peerController';
import Room from './room';
import RoomController from './roomController';
import {maybeStart} from '../app';
export default class VideoChat {
    constructor() {
        this._room = null;
        this._isRoomReady = false;
        this._isInitiator = false;
        this._isChatStarted = false;

        this._peerConnection = new PeerConnection().create();      
        this._peerConnection.onicecandidate = this.handleIceCandidate;
        this._peerConnection.ontrack = this.handleTrackAdded;
        this._peerConnection.ondatachannel = this.handleDataChannelAdded;

        this._dataChannel;

        this._localStream = null;
        this._remoteStream = null;

        this._localVideo = document.querySelector('#localVideo');
        this._remoteVideo = document.querySelector('#remoteVideo');

        const io = require('socket.io-client');
        this.serverConnection = io.connect();

        this.maybeStart = this.maybeStart.bind(this);

        this.serverConnection.on('created', function(room) {
            console.log('Created room ' + room);
            this._isInitiator = true;
            // startGame(isInitiator);
          });
          
        this.serverConnection.on('full', function(room) {
            //TODO show user that room is full.
            console.log('Room ' + room + ' is full');
        });
          
        this.serverConnection.on('join', function (room){
            console.log('Another peer made a request to join room ' + room);
            console.log('This peer is the initiator of room ' + room + '!');
            this._isRoomReady = true;
        });
          
        this.serverConnection.on('joined', function(room) {
            console.log('joined: ' + room);
            this._isRoomReady = true;
            // startGame(isInitiator);
        });
          
        this.serverConnection.on('log', function(array) {
            console.log.apply(console, array);
        });
          
        this.serverConnection.on('message', this.handleMessage);
    }

    handleMessage(message) {
        console.log('Client received message:', message);
        if (message === 'got user media') {
            maybeStart();
        } else if (message.type === 'offer') {
          if (!this._isInitiator && ! this._isChatStarted) {
            this.maybeStart();
          }
          this._peerConnection.setRemoteDescription(message)
          .then(function () {
            return doAnswer();
          })
        } else if (message.type === 'answer' && isStarted) {
          peerConnection.setRemoteDescription(new RTCSessionDescription(message));
        } else if (message.type === 'candidate' && isStarted) {
          var candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
          });
          peerConnection.addIceCandidate(candidate);
        } else if (message === 'bye' && isStarted) {
          handleRemoteHangup();
        }
    }

    maybeStart() {
        console.log('>>>>>>> maybeStart() ', this._isChatStarted, this._localStream, this._isRoomReady);
        if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
          console.log('>>>>>> creating peer connection');
          createPeerConnection();
          
          for (const track of localStream.getTracks()) {
            peerConnection.addTrack(track);
          }
      
          isStarted = true;
          console.log('isInitiator', isInitiator);
          if (isInitiator) {
            initDataChannel();
            console.log('Created RTCDataChannel');
            doCall();
          }
      
          gameController.startSharedSceneSync();
        }
    }

    joinRoom(roomName) {
        this._room = roomName;
        if (roomName !== '') {
            this.serverConnection.emit('create or join', roomName);
            console.log('Attempted to create or join room',roomName);
        } else {
            //TODO do something else
        }
    }

    sendSignalingMessage(message) {
        console.log('Client sending message: ', message);
        console.log('Sending to room ' + this._room);
        this.serverConnection.emit('message', this._room, message); 
    }

    


    ////// PeerConnection //////
    handleIceCandidate(event) {
        console.log('icecandidate event: ', event);
        if (event.candidate) {
          this.sendSignalingMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
          });
        } else {
          console.log('End of candidates.');
        }
    }

    handleTrackAdded(event) {
        if (event.streams && event.streams[0]) {
            console.log("event streams detected")
            this._remoteVideo.srcObject = event.streams[0];
        } else {
            if (!this._remoteStream) {
                console.log("Creating new MediaStream")
                this._remoteStream = new MediaStream();
            }
            console.log("adding track to remote stream")
            this._remoteStream.addTrack(event.track);
            this._remoteVideo.setAttribute('src', this._remoteStream);
            this._remoteVideo.srcObject = this._remoteStream;
        }
        this._remoteVideo.autoplay = true;
    }

    handleDataChannelAdded(event) {
        console.log('Received Channel Callback');
        this._dataChannel = event.channel;
        this._dataChannel.onmessage = this.handleReceiveMessage;
        this._dataChannel.onerror = function (error) {
            console.log("Data Channel Error:", error);
        };
        this._dataChannel.onopen = this.handleDataChannelStatusChange;
        this._dataChannel.onclose = this.handleDataChannelStatusChange;
        console.log('CREATED DATACHANNEL gameUpdates');
    }

        
    handleDataChannelStatusChange() {
        if (this._dataChannel) {
            let state = this._dataChannel.readyState;
      
            if (state === "open") {
                console.log("DATA CHANNEL STATE: open")
            } else {
                console.log("DATA CHANNEL STATE: closed")
            }
        }
    }

    handleReceiveMessage(event) {
        // updateRemoteObjects(event.data);
    }

    doCall() {
        console.log('Sending offer to peer');
        this._peerConnection.createOffer(setLocalAndSendMessage, handleCreateOfferError);
    }

    doAnswer() {
        console.log('Sending answer to peer.');
        this._peerConnection.createAnswer().then(
          this.setLocalAndSendMessage,
          this.onCreateSessionDescriptionError
        );
    }

    handleCreateOfferError(event) {
        console.log('createOffer() error: ', event);
    }

    setLocalAndSendMessage(sessionDescription) {
        this._peerConnection.setLocalDescription(sessionDescription);
        console.log('setLocalAndSendMessage sending message', sessionDescription);
        this.sendSignalingMessage(sessionDescription);
    }
      
    onCreateSessionDescriptionError(error) {
        console.log('Failed to create session description: ' + error.toString());
    }
      
    hangup() {
        console.log('Hanging up.');
        this.stopConnection();
        this.sendSignalingMessage('bye');
    }
}
