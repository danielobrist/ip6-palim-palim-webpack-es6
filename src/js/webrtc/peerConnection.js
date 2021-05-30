export default class PeerConnection {
    constructor() {
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

    create() {
        try {
            let rtcPeerConnection;
            if (location.hostname !== 'localhost') {
                rtcPeerConnection = new RTCPeerConnection(this.pcConfig);
            } else {
                rtcPeerConnection = new RTCPeerConnection(this.pcConfig);
            }

            // rtcPeerConnection.onicecandidate = handleIceCandidate;
            // rtcPeerConnection.ontrack = this.handleTrackAdded;
            // rtcPeerConnection.ondatachannel = this.handleDataChannelAdded;
        
            console.log('Created RTCPeerConnnection: ' + rtcPeerConnection);
            return rtcPeerConnection;

          } catch (e) {
            console.log('Failed to create PeerConnection, exception: ' + e.message);
            alert('Cannot create RTCPeerConnection object.');
            return;
        }
    }


}