import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

// IMPORT 3D MAP

const gltfLoader = new GLTFLoader();
gltfLoader.load("./public/arcade.glb",
    function(glb){
        scene.add(glb.scene);
        glb.scene.traverse(child=>{
            // meshes
            if(child.isMesh){
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                    child.material.roughness = 1.0; 
                    child.material.metalness = 0.0;             
                }
            // groups
            }
        })
        player.instance = scene.getObjectByName("Chicken");
        camera.lookAt(player.instance.position);
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

// GSAP ANIMATION FUNCTIONS

// Player movement
function movePlayer(targetPosition, targetRotation, targetPositionCamera){
    player.isMoving = true;

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