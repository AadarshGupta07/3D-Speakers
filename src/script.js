import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'


// GLTF loader
const gltfLoader = new GLTFLoader()

// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()


// Lights

const dirLight = new THREE.DirectionalLight(0xffffff, 12);
const ambLight = new THREE.AmbientLight(0xffffff, 1.5);
dirLight.position.x = 2
dirLight.position.y = -1
dirLight.position.z = -6
scene.add(dirLight, ambLight)

const helper = new THREE.DirectionalLightHelper(dirLight, 5);
// scene.add( helper );

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 5
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
// controls.dampingFactor = 0.04
// controls.minDistance = 5
// controls.maxDistance = 60
// controls.enableRotate = true
// controls.enableZoom = true
// controls.maxPolarAngle = Math.PI /2.5
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor( 0x000000, 1 );
/**
 *  Texture Loader
 */
const textureLoader = new THREE.TextureLoader()
const bakedTexture = textureLoader.load('Baked.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding


/**
 *  Baked Material
 */
const bakedMaterial = new THREE.MeshStandardMaterial({ map: bakedTexture })

//model 
let model, playButtonMesh, nextButtonMesh, previousButtonMesh, displayMesh;
gltfLoader.load(
    'speakers.glb',
    (gltf) => {
        playButtonMesh = gltf.scene.children.find((child) => {
            return child.name === 'play'
        })
        nextButtonMesh = gltf.scene.children.find((child) => {
            return child.name === 'next'
        })
        previousButtonMesh = gltf.scene.children.find((child) => {
            return child.name === 'previous'
        })
        displayMesh = gltf.scene.children.find((child) => {
            return child.name === 'display'
        })
        gltf.scene.traverse((child) => {
            child.material = bakedMaterial
            child.material.metalness = 0.212
        })
        model = gltf.scene

        model.position.set(0, -4, 0)
        model.rotation.y = -Math.PI / 2

        model = gltf.scene;
        scene.add(model)


        //Get your video element:
        const video = document.getElementById("video");


        //Create your video texture:
        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.needsUpdate = true;

        const videoMaterial = new THREE.MeshBasicMaterial({map: videoTexture })


        // Adapt the size of the video texture to the display mesh size
        displayMesh.material = videoMaterial
        videoMaterial.needsUpdate = true;

    })

const rayCaster = new THREE.Raycaster()

const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1
})

let isPlaying = false
let isPreviousClicked = false
let isNextClicked = false



// create an AudioListener object
const listener = new THREE.AudioListener();
camera.add(listener);

// create a PositionalAudio object
const audioLoader = new THREE.AudioLoader();

let isPlayingSong = false;
let sound;
let playButton = document.getElementById('button')

// Audio Loader
audioLoader.load('m2.mp3', function (buffer) {
    sound = new THREE.PositionalAudio(listener);
    sound.setBuffer(buffer);
    sound.setRefDistance(1);
    sound.setPlaybackRate(1);
    sound.setLoop(true);
    sound.setVolume(1);
    // 2 will be the size radius of the object, there are more properties of sound in docs
    scene.add(sound);

    playButton.addEventListener('click', () => {
        if (!isPlayingSong) {
            sound.play();
            isPlayingSong = true;
            playButton.innerHTML = 'Pause';
        } else {
            sound.pause();
            isPlayingSong = false;
            playButton.innerHTML = 'Play';
        }

    });

    //

    window.addEventListener('click', () => {
        if (currentIntersect) {
            if (currentIntersect.object === playButtonMesh) {
                isPlaying = !isPlaying
                console.log(`Play button clicked. Is playing: ${isPlaying}`)
                //
                if (isPlaying) {
                    sound.play();
                    isPlayingSong = true;
                    playButton.innerHTML = 'Pause';
                    video.play();

                }
                if (!isPlaying) {
                    sound.pause();
                    isPlayingSong = false;
                    playButton.innerHTML = 'Play';
                    video.pause()
                }

                //
            }
            else if (currentIntersect.object === previousButtonMesh) {
                isPreviousClicked = !isPreviousClicked
                console.log(`previous button clicked. Is previous is clicked: ${isPreviousClicked}`)
                //

                //
            }
            else if (currentIntersect.object === nextButtonMesh) {
                isNextClicked = !isNextClicked
                console.log(`next button clicked. Is next is clicked: ${isNextClicked}`)
                //

                //
            }
            // reset currentIntersect to null
            currentIntersect = null
        }
    })

    //
})

const group = new THREE.Group()
scene.add(group)
group.add(model, camera)

/**
 * Animate
 */
let currentIntersect = null
const clock = new THREE.Clock()

const tick = () => {

    const elapsedTime = clock.getElapsedTime()

    // raycast buttons
    if (playButtonMesh) {
        rayCaster.setFromCamera(mouse, camera)
        const objToTest = [playButtonMesh, nextButtonMesh, previousButtonMesh]
        const intersects = rayCaster.intersectObjects(objToTest)

        intersects.length ? currentIntersect = intersects[0] : currentIntersect = null
    }
    
    // When Model is Fully Loaded
    if(model){

        // group.rotation.y = elapsedTime 
    }

    // Update Orbital Controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()