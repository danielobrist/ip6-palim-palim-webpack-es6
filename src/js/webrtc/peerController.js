import PeerConnection from "./peerConnection";

export default class PeerController {
    constructor() {
    
        this._peerConnection = new PeerConnection();
        this._dataChannel = null;

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
    }


    setRemoteDescription(message) {
        this._peerConnection.setRemoteDescription(new RTCSessionDescription(message));
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
            this._peerConnection = peerConnection;

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
        this._dataChannel = dataChannel;
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
        if (this.dataChannel) {
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

    call() {
        doCall(this._peerConnection);
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

    stopConnection() {
        // this.isStarted = false;
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

    get peerConnection() {
        return this._peerConnection;
    }

    set peerConnection(peerConnection) {
        this._peerConnection = peerConnection;
    }

    get dataChannel() {
        return this._dataChannel;
    }

    set dataChannel(dataChannel) {
        this._dataChannel = dataChannel;
    }
}

function doCall(peerConnection) {
    console.log('Calling... on pc ' + peerConnection);
    console.log('Sending offer to peer');
    // myPeerConnection.createOffer(successCallback, failureCallback, [options]) 
    peerConnection.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}
  
function doAnswer() {
    console.log('Sending answer to peer.');
    peerConnection.createAnswer().then(
      setLocalAndSendMessage,
      onCreateSessionDescriptionError
    );
}

function setLocalAndSendMessage(sessionDescription) {
    peerConnection.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    tpeerConnection.sendMessage(sessionDescription);
}
  
function onCreateSessionDescriptionError(error) {
    console.log('Failed to create session description: ' + error.toString());
}

function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}

function handleRemoteHangup() {
    console.log('Session terminated.');
    this.stopConnection();
    // this.isInitiator = true; //when remote leaves, this client will be the new initiator
}

