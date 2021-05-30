export default class Room {

    constructor(){
        this._room = null;
        this._isRoomReady = false;
        this._isInitiator = false;
        this._isChatStarted = false;

        const io = require('socket.io-client');
        this.serverConnection = io.connect();

        this.peerConnection = null;
        this.dataChannel = null;

        this.socket.on('created', function(room) {
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
          
        this.serverConnection.on('message', function(message) {
            console.log('Client received message:', message);
            if (message === 'got user media') {
                maybeStart();
            } else if (message.type === 'offer') {
              if (!isInitiator && !isStarted) {
                maybeStart();
              }
              peerConnection.setRemoteDescription(message)
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
        });
    }

    joinRoom(room) {
        this._room = room;
        if (room !== '') {
            this.serverConnection.emit('create or join', room);
            console.log('Attempted to create or join room',room);
        } else {
            //TODO do something else
        }
    }

    sendSignalingMessage(message) {
        console.log('Client sending message: ', message);
        this.serverConnection.emit('message', this._room, message); 
    }

    
}