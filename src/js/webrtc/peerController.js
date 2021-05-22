
export default class PeerController {
    constructor() {

        this.localStream = null;
        this.remoteStream = null;

        /////////////////////////////////////////////
        const io = require('socket.io-client');
        this.socket = io.connect();
     
        this.isChannelReady = false;
        this.isInitiator = false;
        this.room = prompt('Enter room name:');
     
        if (this.room !== '') {
            this.socket.emit('create or join', this.room);
            console.log('Attempted to create or join room', this.room);
        }
        //////////////////////////////////////////////

        this.pcConfig = {
            'iceServers': [
              {
                'urls': 'stun:stun.l.google.com:19302'
              },
              {
                'urls': 'turn:numb.viagenie.ca',
                'credential': 'muazkh',
                'username': 'webrtc@live.com'
              },
              {
                'urls': 'turn:192.158.29.39:3478?transport=udp',
                'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                'username': '28224511:1379330808'
              },
              {
                'urls': 'turn:192.158.29.39:3478?transport=tcp',
                'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                'username': '28224511:1379330808'
              }
            ]
        };
    
        this.isStarted = false;
        this.peerConnection = this.createPeerConnection();
        this.dataChannel = this.initDataChannel();
    
        this.socket.on('created', function(room) {
            console.log('Created room ' + room);
            this.isInitiator = true;
            // changeCameraPosition();
        });
    
        this.socket.on('full', function(room) {
            //TODO show user that room is full.
            console.log('Room ' + room + ' is full');
        });
          
        this.socket.on('join', function (room){
            console.log('Another peer made a request to join room ' + room);
            console.log('You are the initiator of room ' + room + '!');
            this.isChannelReady = true;
        });
          
        this.socket.on('joined', function(room) {
            console.log('Joined room: ' + room);
            this.isChannelReady = true;
        });
          
        this.socket.on('log', function(array) {
            console.log.apply(console, array);
        });
          
        this.socket.on('message', function(message) {
            console.log('Client received message:', message);
            if (message === 'got user media') {
                this.maybeStart();
            } else if (message.type === 'offer') {
                if (!this.isInitiator && !this.isStarted) {
                    this.maybeStart();
                }
                this.peerConnection.setRemoteDescription(message)
                .then(function () {
                    return doAnswer();
                })
            } else if (message.type === 'answer' && this.isStarted) {
                this.peerConnection.setRemoteDescription(new RTCSessionDescription(message));
            } else if (message.type === 'candidate' && this.isStarted) {
                    let candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                });
                this.peerConnection.addIceCandidate(candidate);
            } else if (message === 'bye' && this.isStarted) {
                handleRemoteHangup();
            }
        });
        
    }

    maybeStart() {
        console.log('>>>>>>> maybeStart() ', this.isStarted, this.localStream, this.isChannelReady);
        if (!this.isStarted && typeof this.localStream !== 'undefined' && this.isChannelReady) {
          console.log('>>>>>> creating peer connection');
          this.createPeerConnection();
          
          for (const track of this.localStream.getTracks()) {
            this.peerConnection.addTrack(track);
            console.log('added track to peerconnection');
          }
      
          this.isStarted = true;
          console.log('isInitiator', this.isInitiator);
          if (this.isInitiator) {
            this.initDataChannel();
            console.log('Created RTCDataChannel');
            this.doCall();
          }
      
        //   gameController.startSharedSceneSync();
        }
    }

    initLocalStream(stream) {
        console.log('Adding local stream.');
        console.log('this: ' + this);
        console.log('stream: ' + stream);
        this.localStream = stream;
        this.localVideo.srcObject = stream;
        this.sendMessage('got user media');
        if (this.isInitiator) {
          this.maybeStart();
        }
    }

    createPeerConnection() {
        try {
            let peerConnection;
            if (location.hostname !== 'localhost') {
                peerConnection = new RTCPeerConnection(this.pcConfig);
            } else {
                peerConnection = new RTCPeerConnection(this.pcConfig);
            } 
        
            peerConnection.onicecandidate = this.handleIceCandidate;
            peerConnection.ontrack = this.handleTrackAdded;
            peerConnection.ondatachannel = this.handleDataChannelAdded;
        
            console.log('Created RTCPeerConnnection: ' + peerConnection);
            return peerConnection;

          } catch (e) {
            console.log('Failed to create PeerConnection, exception: ' + e.message);
            alert('Cannot create RTCPeerConnection object.');
            return;
        }
    }

    initDataChannel() {
        console.log('CREATING DATACHANNEL gameUpdates')
        let dataChannel = this.peerConnection.createDataChannel('gameUpdates', {
            ordered: false,
            id: this.room
        });
        dataChannel.onmessage = this.handleReceiveMessage;
        dataChannel.onerror = function (error) {
            console.log("Data Channel Error:", error);
        };
        dataChannel.onopen = this.handleDataChannelStatusChange;
        dataChannel.onclose = this.handleDataChannelStatusChange;
        
        console.log('CREATED DATACHANNEL gameUpdates');
        return dataChannel;
    }

    handleIceCandidate(event) {
        console.log('icecandidate event: ', event);
        if (event.candidate) {
            this.sendMessage({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            });
        } else {
            console.log('End of candidates.');
        }
    }

    sendMessage(message) {
        console.log('Client sending message: ', message);
        this.socket.emit('message',this.room, message); 
    }

    handleTrackAdded(event) {
        if (event.streams && event.streams[0]) {
            console.log("event streams detected")
            this.remoteVideo.srcObject = event.streams[0];
        } else {
            if (!this.remoteStream) {
                console.log("Creating new MediaStream")
                this.remoteStream = new MediaStream();
            }
            console.log("adding track to remote stream")
            this.remoteStream.addTrack(event.track);
            this.remoteVideo.setAttribute('src', this.remoteStream);
            this.remoteVideo.srcObject = this.remoteStream;
        }
        this.remoteVideo.autoplay = true;
    }

    handleDataChannelAdded(event) {
        console.log('Received Channel Callback');
        this.dataChannel = event.channel;
        this.dataChannel.onmessage = this.handleReceiveMessage;
        this.dataChannel.onerror = function (error) {
            console.log("Data Channel Error:", error);
        };
        this.dataChannel.onopen = this.handleDataChannelStatusChange;
        this.dataChannel.onclose = this.handleDataChannelStatusChange;
        console.log('CREATED DATACHANNEL gameUpdates');
    }

        
    handleDataChannelStatusChange() {
        if (this.dataChannel) {
            let state = this.dataChannel.readyState;
      
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
        this.peerConnection.createOffer(this.setLocalAndSendMessage, this.handleCreateOfferError);
    }

    doAnswer() {
        console.log('Sending answer to peer.');
        this.peerConnection.createAnswer().then(
          this.setLocalAndSendMessage,
          this.onCreateSessionDescriptionError
        );
    }

    handleCreateOfferError(event) {
        console.log('createOffer() error: ', event);
    }

    setLocalAndSendMessage(sessionDescription) {
        this.peerConnection.setLocalDescription(sessionDescription);
        console.log('setLocalAndSendMessage sending message', sessionDescription);
        this.sendMessage(sessionDescription);
    }
      
    onCreateSessionDescriptionError(error) {
        console.log('Failed to create session description: ' + error.toString());
    }
      
    hangup() {
        console.log('Hanging up.');
        this.stopConnection();
        this.sendMessage('bye');
    }

    handleRemoteHangup() {
        console.log('Session terminated.');
        this.stopConnection();
        this.isInitiator = true; //when remote leaves, this client will be the new initiator
    }

    stopConnection() {
        this.isStarted = false;
        this.dataChannel.close();
        this.peerConnection.close();
        this.peerConnection = null;
        this.remoteVideo.pause();
        this.remoteVideo.removeAttribute('src'); // empty source
        this.remoteVideo.removeAttribute('autoplay');
        this.remoteStream = null;
        this.remoteVideo.load();
    }

    ///////////////////////////////////////////////
    /////   synchronization of gameobjects    /////
    ///////////////////////////////////////////////

    startGameSync() {
        // let interval = setInterval(sendGameobjectPositions, 30);
    }
  
    sendGameobjectPositions() {
        //TODO send JSON Strings of gameobject and positions
        if (this.dataChannel && this.dataChannel.readyState === "open") {
            // dataChannel.send(getSceneJSON());
        }
    }
    /////////////////////////////////////
}

