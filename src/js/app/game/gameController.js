export {GameController};

import {dataChannel} from '../../webrtc/videoCall';

let localObjects = []; // JSONs of locally maintained objects - we send updates for these
// let localObjectsMap = new Map();

const GameController = () => {

    function addLocalObject(obj) {

        console.log("localObject added for game sync: " + JSON.stringify(obj) + " id: " + obj.id)
        let customObject = {uuid: obj.uuid, position: obj.position, rotation: obj.rotation};
        let json = JSON.stringify(customObject);
        localObjects.push(json);

        // localObjectsMap.set(obj.id, json);

    }

    let sharedSceneSync; 
    function startSharedSceneSync() {
        // sharedSceneSync = setInterval(sendLocalObjectsUpdate, 30);
        // console.log("STARTED SHARED SCENE SYNC")
    }

    function stopSharedSceneSync() {
        clearInterval(sharedSceneSync);
    }

    function sendSharedSceneUpdates() {
    //TODO send all localObjects in the shared scene to remote

    //if there are objects from this client in the shared scene

    //then send their pos/rot etc to remote
    }

    // sends a single object right now, used when dragging
    function sendGameobjectUpdate(objectJson) {
        if (dataChannel && typeof objectJson !== 'undefined' && dataChannel.readyState === "open") {
            dataChannel.send(objectJson);
        }
    }

    function sendLocalObjectsUpdate() {
        // console.log("localObjects: " + localObjects);
        if (dataChannel !== 'undefined' && dataChannel.readyState === "open"){
            localObjects.forEach(element => {
                dataChannel.send(element);
                console.log("Sent Update of local Object " + element)
            });
        }
    }

    function updateRemoteObjects(data) {
        let obj = JSON.parse(data);
        // console.log('Parsed JSON uuid: ' + obj.uuid + ', positionx: ' + obj.position.x + ', rotationx: ' + obj.rotation._x);
    
        //TODO update only specific object!
        localElement = getLocalObject
        cube.position.x = obj.position.x;
        cube.position.y = obj.position.y;
        cube.position.z = obj.position.z;
        cube.rotation.x = obj.rotation._x;
        cube.rotation.y = obj.rotation._y;
        cube.rotation.z = obj.rotation._z;
    
        //TOOD maybe tween/interpolate between positions
    
    }

    return {
        addLocalObject,
        startSharedSceneSync,
        stopSharedSceneSync,
        sendGameobjectUpdate,
        updateRemoteObjects
    }

}