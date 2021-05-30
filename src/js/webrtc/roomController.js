
export default class RoomController {
    constructor(videoChat, peerController) {
        const io = require('socket.io-client');
        this.socket = io.connect();
     
        this.hasTwoPeople = false;
        this._isInitiator = false;
        this.room = null;
     
        this._videoChat = videoChat;
        this._peerController = peerController;

        this.socket.on('created', function(room) {
            console.log('Created room ' + room);
            this.isInitiator = true;
            // joined a room as 1st person, start game
            // startGame(isInitiator);
        });
          
        this.socket.on('full', function(room) {
            //TODO show user that room is full.
            console.log('Room ' + room + ' is full');
        });
          
        this.socket.on('join', function (room){
            console.log('Another peer made a request to join room ' + room);
            console.log('This peer is the initiator of room ' + room + '!');
            this.hasTwoPeople = true;
            console.log('hasTwoPeople = ' + this.hasTwoPeople);
        });
          
        this.socket.on('joined', function(room) {
            console.log('joined: ' + room);
            // we have now 2 people, can start peerconnection! //TODO HIER

            this.hasTwoPeople = true;
            this.isInitiator = false;
            // joined a room as 2nd person, room is now ready, start game
            // startGame(isInitiator); 
        });
          
        this.socket.on('log', function(array) {
            console.log.apply(console, array);
        });

        this.socket.on('message', function(message) {
            console.log('Client received message:', message);
            if (message === 'got user media') {
                // second client has video ready, start now
                maybeStart(this.hasTwoPeople, this.isInitiator);
            } else if (message.type === 'offer') {
                if (!this.isInitiator && !this._videoChat.isStarted) {
                    maybeStart(this.hasTwoPeople, this.isInitiator);
                }
                this._peerController.setRemoteDescription(message)
              .then(function () {
                return this._peerController.doAnswer();
              })
            } else if (message.type === 'answer' && this._videoChat.isStarted) {
                this._peerController.setRemoteDescription(new RTCSessionDescription(message));
            } else if (message.type === 'candidate' && this._videoChat.isStarted) {
              var candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate
              });
              this._peerController.peerConnection.addIceCandidate(candidate);
            } else if (message === 'bye' && this._videoChat.isStarted) {
                this._peerController.handleRemoteHangup();
            }
          });
    }

    joinRoom() {
        this.room = prompt('Enter room name please:')
        if (this.room !== '') {
            this.socket.emit('create or join', this.room);
            console.log('Attempted to create or join room', this.room);
        } else {
            //TODO do something else
        }
    }

    // sends a message to the currently joined room
    sendMessage(message) {
        console.log('Client sending message: ', message);
        this.socket.emit('message', this.room, message); 
    }

    // broadcasts a message to all rooms
    broadcastMessage(message) {
        console.log('Client broadcasting message: ', message);
        this.socket.emit('message', message);
    }

    get isInitiator() {
        return this._isInitiator;
    }

    set isInitiator(isInitiator) {
        this._isInitiator = isInitiator;
    }

    get hasTwoPeople() {
        return this._hasTwoPeople;
    }

    set hasTwoPeople(hasTwoPeople) {
        this._hasTwoPeople = hasTwoPeople;
    }
}