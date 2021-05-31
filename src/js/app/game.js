import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {DragControls} from 'three/examples/jsm/controls/DragControls'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {GameController} from './game/gameController.js';
import * as Ammo from './physics/ammo.js';
import {initScene, initCamera} from './game/scene';

export {startPhys, startGame, getSceneJSON, updateRemoteObjects, moveRemoteVideoToScene};

const gameController = GameController();

// an array of objects to sync
const objectsToSync = new Map();

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

let localScene;
let localCamera;

let dragControl;
let draggableObjectsSeller = [];

let cube, cube2, cube3;
let isSeller = false;

let duckMesh;
// let orbitControls;

let physicsWorld;

const startPhys = () => {
    Ammo().then( function( Ammo ) {
        setupPhysicsWorld(Ammo);

        startGame(true);

    } )
}


function startGame(isInitiator) {


    isSeller = isInitiator;
    console.log("Started game with isInitiator = " + isInitiator);
    init();
    init3DObjects();
    activateDragControls();
    animate();
}

function setupPhysicsWorld(Ammo){

    let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache    = new Ammo.btDbvtBroadphase(),
        solver                  = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

}

function init() {

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.autoClear = false;
    document.getElementById("appContainer").appendChild( renderer.domElement );

    localScene = initScene();
    localCamera =  initCamera(isSeller);

    // orbitControls = new OrbitControls( localCamera, renderer.domElement );

}

async function init3DObjects() {
    const loader = new GLTFLoader();
    let loadedData = await loader.loadAsync('assets/models/duck.gltf');
    loadedData.scene.traverse((o) => {
        if (o.isMesh) {
            // console.dir('Loaded data: ' + JSON.stringify(o));
            duckMesh = new THREE.Mesh();
            o.scale.set(0.01,0.01,0.01);

            duckMesh = o;
            let drago = new DragControls( [duckMesh], localCamera, renderer.domElement );
            drago.addEventListener( 'drag', function(event) {
                gameController.sendGameobjectUpdate(getObjJSON(event.object));
                render();
            } );

        };
    });

    if (isSeller) { 
        // init seller specific items in local scene

        let duckMesh1 = duckMesh.clone();
        duckMesh1.name = "duckMesh1";
        localScene.add(duckMesh1);
        duckMesh1.position.set(0, -4, 0);
        objectsToSync.set(duckMesh1.name, duckMesh1);
        addObjectToDragConrols(duckMesh1);

        let duckMesh2 = duckMesh.clone();
        duckMesh2.name = "duckMesh2";
        duckMesh2.position.set(1, -4, 0);
        localScene.add(duckMesh2);
        objectsToSync.set(duckMesh2.name, duckMesh2);
        addObjectToDragConrols(duckMesh2);

    } else {
        // init buyer specific items in local scene

        let duckMesh3 = duckMesh.clone();
        duckMesh3.name = "duckMesh3";
        duckMesh3.position.set(-1, -4, 0);
        localScene.add(duckMesh3);
        objectsToSync.set(duckMesh3.name, duckMesh3);
        addObjectToDragConrols(duckMesh3);

    }

   
    renderer.outputEncoding = THREE.sRGBEncoding;

    

    // init static stuff for both (eg. counter, etc)
    // load3dAsset(loader, '../../assets/abricot.gltf', new THREE.Vector3(0.2, 0.2, 0.2), 'apricotTemplate', personalSpace);
    // load3dAsset(loader, '../../assets/banana.glb', new THREE.Vector3(0.2, 0.2, 0.2), 'bananaTemplate', personalSpace);
    const geometry = new THREE.PlaneGeometry( 4, 8/3 );
    const material = new THREE.MeshBasicMaterial( {color: 0x8B4513, side: THREE.DoubleSide} );
    const plane = new THREE.Mesh( geometry, material );
    plane.position.y = -2;
    plane.rotation.x = Math.PI / 2;
    localScene.add( plane );

}

function moveRemoteVideoToScene() {
    setTimeout(() => {
        console.log("------------moveRemoteVideoToScene-------------");
        const remoteVideo = document.getElementById("remoteVideo");
        const reomoteVideoAspectRatio = remoteVideo.offsetWidth/remoteVideo.offsetHeight;
        console.log(remoteVideo);
        console.log("width: " + remoteVideo.offsetWidth);
        console.log("height: " + remoteVideo.offsetHeight);

        const videoGeometry = new THREE.PlaneGeometry( 4, 4/reomoteVideoAspectRatio );
        const videoMaterial = makeVideoMaterial("remoteVideo");
        const cube2 = new THREE.Mesh( videoGeometry, videoMaterial );
        localScene.add( cube2 );
    }, 1000 );
}


function activateDragControls() {

    
    dragControl = new DragControls( [ ...draggableObjectsSeller ], localCamera, renderer.domElement );
    //dragControl.transforGroup = true;
    dragControl.addEventListener( 'drag', function(event) {
        gameController.sendGameobjectUpdate(getObjJSON(event.object));
        render();
    } );
   
    // dragControl.addEventListener('dragend', function(event) {
    //     if(event.object.position.y > -1.5) {

    //         let temp = event.object.clone();
    //         temp.position.set(event.object.position.x, event.object.position.y, event.object.position.z);
    //         temp.name = temp.uuid;
    //         personalSpace.add(temp);
    //         objectsToSync.set(temp.name, temp);
    //         addObjectToDragConrols(temp);
    //     }
    //     event.object.position.set(event.object.startPosition.x, event.object.startPosition.y, event.object.startPosition.z);
    // });
}

function animate() {
    requestAnimationFrame( animate );
    //cube.rotation.y += 0.01;
    // orbitControls.update();
    renderer.render( localScene, localCamera );
}

function getObjJSON(object) {
    let obj = {name: object.name, position: object.position, rotation: object.rotation};
    let json = JSON.stringify(obj);
    console.log('JSON:' + json)
    return json;
}

function getSceneJSON() {
    // TODO build and return a JSON from all localObjects, not only cube
    let cubeObj = {uuid: cube.uuid, position: cube.position, rotation: cube.rotation};
    // let json = JSON.stringify(cubeObj);
    let json = JSON.stringify(draggableObjectsSeller);
    // console.log('JSON:' + json)
    return json;
}

function updateRemoteObjects(data) {
    let obj = JSON.parse(data);
    // console.log('Parsed JSON uuid: ' + obj.uuid + ', positionx: ' + obj.position.x + ', rotationx: ' + obj.rotation._x);

    if(objectsToSync.has(obj.name)) {
        let localElement = localScene.getObjectByName(obj.name);

        localElement.position.x = obj.position.x;
        localElement.position.y = obj.position.y;
        localElement.position.z = obj.position.z;
        localElement.rotation.x = obj.rotation._x;
        localElement.rotation.y = obj.rotation._y;
        localElement.rotation.z = obj.rotation._z;
    } else {
        // creates and add to scene and objectsToSync
        duckMesh.name = obj.name;
        duckMesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        let newObj = duckMesh.clone();
        // let newObj = initCube(DEFAULT_VALUES.geometryCube, DEFAULT_VALUES.colorRed, new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z), true, draggableObjectsSeller, personalSpace);
        objectsToSync.set(newObj.name, newObj);
        // newObj.position.set(obj.position.x, obj.position.y, obj.position.z);
        localScene.add(newObj);
        addObjectToDragConrols(newObj);
    }
    
    //TOOD maybe tween/interpolate between positions
}

function addObjectToDragConrols(obj) {
    draggableObjectsSeller.push(obj);
    dragControl = new DragControls([...draggableObjectsSeller], localCamera, renderer.domElement).addEventListener('drag', function(event) {
        gameController.sendGameobjectUpdate(getObjJSON(event.object));
        render();
    });
}

function makeVideoMaterial(id) {
    let videoElement = document.getElementById(id);
    let videoTexture = new THREE.VideoTexture(videoElement);
  
    let videoMaterial = new THREE.MeshBasicMaterial({
      map: videoTexture,
      overdraw: true,
      side: THREE.DoubleSide,
    });
  
    return videoMaterial;
  }

function render() {

    renderer.render( localScene, localCamera );
}

