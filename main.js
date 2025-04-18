import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gamesInfo from './games.js';

// GLOBAL VARIABLES

// Window Size
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
// Player
let player = {
    instance: new THREE.Group(),
    moveDistance: 2.0,
    jumpHeight: 0.7,
    isMoving: false,
    moveDuration: 0.4
}

// Disable click events
let canClick = false;

// Intersectable objects
let clickableObjects = [];
let duckObjects = [];
let gameObjects = [];

// HTML elements
let loadingScreen = document.getElementById('loading');

let welcomePopup = document.getElementById('welcome');
let welcomePopupCloseButton = document.getElementById('welcome-exit-button');

let mailboxPopup = document.getElementById('mailbox');
let mailboxPopupCloseButton = document.getElementById('mailbox-exit-button');

let gamePopup = document.getElementById('game');
let gamePopupContent = document.getElementById('game-content');
let gameBorder = document.getElementById('game-border');
let gamePopupCloseButton = document.getElementById('game-exit-button');

// THREE.JS BASE SET UP

// Canvas
const canvas = document.getElementById('arcade-canvas');

// Renderer
const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Make everything look cooler
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;
renderer.outputEncoding = THREE.sRGBEncoding;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x38A3A5);

// Camera
const camera = new THREE.PerspectiveCamera(
    45,
    sizes.width/sizes.height,
    0.1,
    1000
);
camera.position.x = 20;
camera.position.y = 20;
camera.position.z = 20;

// Raycaster
const raycaster = new THREE.Raycaster();

// AUDIO SET UP

// Audio 
const listener = new THREE.AudioListener();
camera.add(listener);

const sound_music = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load('/public/background_music.mp3', function(buffer){
    sound_music.setBuffer(buffer);
    sound_music.setLoop(true);
    sound_music.setVolume(0.5);
    sound_music.play();
});

const sound_duck = new THREE.Audio(listener);
audioLoader.load('/public/quack.mp3', function(buffer){
    sound_duck.setBuffer(buffer);
    sound_duck.setLoop(false);
    sound_duck.setVolume(0.4);
});

const sound_jump = new THREE.Audio(listener);
audioLoader.load('/public/jump.mp3', function(buffer){
    sound_jump.setBuffer(buffer);
    sound_jump.setLoop(false);
    sound_jump.setVolume(0.3);
});

// IMPORT 3D MAP

const gltfLoader = new GLTFLoader();
gltfLoader.load("./public/arcade.glb",
    function(glb){
        scene.add(glb.scene);
       
        clickableObjects = scene.getObjectByName("Clickable").children;
        duckObjects = scene.getObjectByName("Duck").children;
        gameObjects = scene.getObjectByName("Game").children;

        player.instance = scene.getObjectByName("Chicken");
        camera.lookAt(player.instance.position);
        loadingScreen.classList.toggle('hidden');
    }
)

// LIGHT SET UP

// Ambient light
const ambLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambLight);

// Main light
const mainLight = new THREE.DirectionalLight(0xFFFF99, 0.5);
mainLight.position.set(50, 75, 50);
mainLight.target.position.set(0, 0, 0);
scene.add(mainLight.target);
scene.add(mainLight);

// ANIMATION LOOP

function animate(){
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// EVENT LISTENERS

// Player movement
function onKeyDown(event){
    if(player.isMoving) return;

    const targetPosition = new THREE.Vector3().copy(player.instance.position);
    const targetPositionCamera = new THREE.Vector3().copy(camera.position);
    let targetRotation = 0;

    switch(event.key.toLowerCase()){
        case "w":
        case "arrowup":
            targetPosition.z -= player.moveDistance;
            targetPositionCamera.z -= player.moveDistance;
            targetRotation = 0;
            break;
        case "s":
        case "arrowdown":
            targetPosition.z += player.moveDistance;
            targetPositionCamera.z += player.moveDistance;
            targetRotation = Math.PI;
            break;
        case "a":
        case "arrowleft":
            targetPosition.x -= player.moveDistance;
            targetPositionCamera.x -= player.moveDistance;
            targetRotation = Math.PI / 2;
            break;
        case "d":
        case "arrowright":
            targetPosition.x += player.moveDistance;
            targetPositionCamera.x += player.moveDistance;
            targetRotation = -Math.PI / 2;
            break;
        default:
            return;
    }

    movePlayer(targetPosition, targetRotation, targetPositionCamera);
}

// Interact with objects
function onClick(event){
    if(canClick){
        event.preventDefault();

        // Get cursor coords
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

        // Clickable objects
        let intersects = raycaster.intersectObjects(clickableObjects, true);
        for(let i = 0; i < intersects.length; i++){
            if(intersects[i].object.parent.name == "Welcome"){
                welcomePopup.classList.toggle("hidden");
                canClick = false;
                break;
            }
            if(intersects[i].object.parent.name == "Mail"){
                mailboxPopup.classList.toggle("hidden");
                canClick = false;
                break;
            }
        }
        
        // Ducks
        intersects = raycaster.intersectObjects(duckObjects, true);
        if(intersects.length > 0){
            duckJump(intersects[0].object.parent);
        }

        // Games
        intersects = raycaster.intersectObjects(gameObjects, true);
        if(intersects.length > 0){
            console.log(intersects[0].object.parent.name);
            playGame(intersects[0].object.parent)
        }
    }
}
window.addEventListener('click', onClick);

// Responsive sizing
function onResize(){
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width/sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('resize', onResize);

// Close Welcome Popup
welcomePopupCloseButton.addEventListener('click', function(event){
    welcomePopup.classList.toggle("hidden");
    enableCanClick();
});

// Close Mailbox Popup
mailboxPopupCloseButton.addEventListener('click', function(event){
    mailboxPopup.classList.toggle("hidden");
    enableCanClick();
});

// Close Game Popup
gamePopupCloseButton.addEventListener('click', function(event){
    gamePopup.classList.toggle("hidden");
    gamePopupContent.innerHTML = "";
    sound_music.play();
    enableCanClick();
});

function enableCanClick() {
    setTimeout(function() {
        canClick = true;
    }, 100);
}

// GSAP ANIMATION FUNCTIONS

// Player movement
function movePlayer(targetPosition, targetRotation, targetPositionCamera){
    player.isMoving = true;
    sound_jump.play();

    const t1 = gsap.timeline({
        onComplete: () =>{
            player.isMoving = false;
        }
    });

    // rotate player
    t1.to(player.instance.rotation, {
        y: targetRotation,
        duration: player.moveDuration * 0.3,
        ease: "power2.out"
    }, 0);

    // move player
    t1.to(player.instance.position, {
        x: targetPosition.x,
        z: targetPosition.z,
        duration: player.moveDuration,
    }, 0);

    // player jump
    t1.to(player.instance.position, {
        y: player.instance.position.y + player.jumpHeight,
        duration: player.moveDuration * 0.4,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        repeatDelay: 0.05
    }, 0);
    
    // move camera
    t1.to(camera.position, {
        x: targetPositionCamera.x,
        z: targetPositionCamera.z,
        duration: player.moveDuration
    }, 0);
}

function duckJump(duck){
    sound_duck.play();

    const t1 = gsap.timeline();

    t1.to(duck.position, {
        y: duck.position.y + 0.7,
        duration: 0.2,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        repeatDelay: 0.05
    });
}

// Play game
function playGame(gameMachine){
    sound_music.pause();

    canClick = false;

    const t1 = gsap.timeline({
        onComplete: () => {
            const gameInfo = gamesInfo[gameMachine.name];

            if(gameInfo["HasGame"]){
                gamePopupContent.innerHTML =
                `
                    ${gameInfo["Game"]}
                `;
            } else {
                gamePopupContent.innerHTML =
                `
                    <h2>${gameInfo["Name"]}</h2>
                `;
            }

            gameBorder.classList.forEach(className => {
                if(className != "game-content" && className != "popup-content"){
                    gameBorder.classList.remove(className);
                }
            })
            gameBorder.classList.add("game-" + gamesInfo[gameMachine.name]["Color"]);
            gamePopup.classList.toggle("hidden");
        }
    });

    t1.to(gameMachine.position, {
        y: gameMachine.position.y + 0.5,
        duration: 0.15,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        repeatDelay: 0.05
    })
}