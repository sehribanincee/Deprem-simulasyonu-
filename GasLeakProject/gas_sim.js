import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// 1. SAHNE VE AYDINLIK ORTAM KURULUMU
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0); // Aydınlık beyaz/gri arka plan
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // Güçlü genel aydınlatma
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(0, 5, 0);
scene.add(pointLight);

// 2. DETAYLI MUTFAK TASARIMI (Requirement 4)
const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Parlak beyaz duvarlar
const floorMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa }); 
const furnitureMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Ahşap
const applianceMat = new THREE.MeshStandardMaterial({ color: 0xdddddd }); // Metalik

// Zemin ve Duvarlar
const floor = new THREE.Mesh(new THREE.PlaneGeometry(25, 25), floorMat);
floor.rotation.x = -Math.PI / 2; scene.add(floor);

const createWall = (x, y, z, rotY = 0) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(25, 8), wallMat);
    wall.position.set(x, y, z); wall.rotation.y = rotY; scene.add(wall);
};
createWall(0, 4, -12); // Arka Duvar
createWall(-12, 4, 0, Math.PI / 2); // Sol Duvar

// Uzun Mutfak Dolabı
const longCounter = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 1.8), furnitureMat);
longCounter.position.set(-6, 0.6, -11); scene.add(longCounter);

// Buzdolabı ve Masaya Bitişik Düzen
const fridge = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.8, 1.8), applianceMat);
fridge.position.set(2, 1.9, -2); scene.add(fridge);

const table = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 2.5), furnitureMat);
table.position.set(5, 1, -2); scene.add(table);

// Kapı ve Pencere (İnteraktif Objeler)
const door = new THREE.Mesh(new THREE.BoxGeometry(2, 3.5, 0.1), new THREE.MeshStandardMaterial({color: 0x5D4037}));
door.position.set(9, 1.75, -11.9); scene.add(door);

const windowObj = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.1), new THREE.MeshStandardMaterial({color: 0xadd8e6, transparent: true, opacity: 0.6}));
windowObj.position.set(-11.9, 3, 0); windowObj.rotation.y = Math.PI / 2; scene.add(windowObj);

// 3. ETKİLEŞİMLİ SİSTEMLER VE RAYCASTER
let gasLevel = 100;
let systems = { stoveOn: true, windowOpen: false, doorOpen: false, aspiratorOn: false };
const raycaster = new THREE.Raycaster();

// OCAK VE GAZ PARTİKÜLLERİ
const stove = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1), new THREE.MeshStandardMaterial({color: 0x333333}));
stove.position.set(-4, 1.3, -10.5); scene.add(stove);

const particleCount = 2000;
const geometry = new THREE.BufferGeometry();
const posArr = new Float32Array(particleCount * 3);
const vels = [];
for (let i = 0; i < particleCount; i++) {
    posArr[i*3]=-4; posArr[i*3+1]=1.4; posArr[i*3+2]=-10.5;
    vels.push(new THREE.Vector3((Math.random()-0.5)*0.03, Math.random()*0.04, (Math.random()-0.5)*0.03));
}
geometry.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
const gasCloud = new THREE.Points(geometry, new THREE.PointsMaterial({color: 0x00ff00, size: 0.05, transparent: true, opacity: 0.4}));
scene.add(gasCloud);

// 4. HAREKET VE TIKLAMA KONTROLÜ (FPS)
const controls = new PointerLockControls(camera, document.body);

// Aspiratör Modeli (Assets'ten)
const loader = new GLTFLoader();
let aspiratorMesh;
loader.load('../assets/3D/fire_hose_cabinet.glb', (gltf) => {
    aspiratorMesh = gltf.scene;
    aspiratorMesh.position.set(-4, 3, -11);
    scene.add(aspiratorMesh);
});

document.addEventListener('click', () => {
    if (!controls.isLocked) {
        controls.lock();
    } else {
        // ETKİLEŞİM MANTIĞI: Tıklanan objeyi algıla
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            const dist = intersects[0].distance;

            if (dist < 4) { // Sadece yakındaysak etkileşim kur
                // Ocağa tıklandıysa
                if (obj === stove) {
                    systems.stoveOn = false;
                    console.log("Ocak kapatıldı.");
                }
                // Pencereye tıklandıysa
                if (obj === windowObj) {
                    systems.windowOpen = !systems.windowOpen;
                    windowObj.position.x = systems.windowOpen ? -13 : -11.9;
                }
                // Kapıya tıklandıysa
                if (obj === door) {
                    systems.doorOpen = !systems.doorOpen;
                    door.rotation.y = systems.doorOpen ? Math.PI / 2 : 0;
                }
                // Aspiratöre (GLB modeline) tıklandıysa
                if (aspiratorMesh && (obj === aspiratorMesh || aspiratorMesh.attach(obj))) {
                    systems.aspiratorOn = !systems.aspiratorOn;
                    console.log("Aspiratör durumu değişti.");
                }
            }
        }
    }
});

camera.position.set(0, 1.7, 8);
let moveF = false, moveB = false, moveL = false, moveR = false;
window.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') moveF = true; if(e.code === 'KeyS') moveB = true;
    if(e.code === 'KeyA') moveL = true; if(e.code === 'KeyD') moveR = true;
});
window.addEventListener('keyup', (e) => {
    if(e.code === 'KeyW') moveF = false; if(e.code === 'KeyS') moveB = false;
    if(e.code === 'KeyA') moveL = false; if(e.code === 'KeyD') moveR = false;
});

// 5. ANİMASYON DÖNGÜSÜ
let prevTime = performance.now();
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (controls.isLocked) {
        if (moveF) controls.moveForward(6 * delta); if (moveB) controls.moveForward(-6 * delta);
        if (moveL) controls.moveRight(-6 * delta); if (moveR) controls.moveRight(6 * delta);
    }

    const pos = gasCloud.geometry.attributes.position.array;
    let power = (systems.windowOpen * 0.06) + (systems.doorOpen * 0.04) + (systems.aspiratorOn * 0.08);
    
    for (let i = 0; i < particleCount; i++) {
        if (systems.stoveOn) {
            pos[i*3] += vels[i].x; pos[i*3+1] += vels[i].y; pos[i*3+2] += vels[i].z;
            if (pos[i*3+1] > 3 || power > 0) { 
                pos[i*3+1] += power; 
                if(pos[i*3+1] > 7) { pos[i*3]=-4; pos[i*3+1]=1.4; pos[i*3+2]=-10.5; }
            }
        } else {
            if (pos[i*3+1] > 0.1) pos[i*3+1] -= 0.02; // Çökme efekti
        }
    }
    gasCloud.geometry.attributes.position.needsUpdate = true;

    // UI GÜNCELLEME
    if (!systems.stoveOn && gasLevel > 0) gasLevel -= 0.6;
    if (systems.stoveOn && gasLevel < 100) gasLevel += 0.1;

    document.getElementById('gas-level').innerText = Math.floor(gasLevel);
    document.getElementById('gas-bar-fill').style.width = gasLevel + '%';
    document.getElementById('vent-status').innerText = `Ocak: ${systems.stoveOn ? 'SIZDIRIYOR' : 'KAPALI'} | Tahliye: ${power > 0 ? 'AKTİF' : 'YOK'}`;
    
    document.getElementById('danger-overlay').style.display = (gasLevel > 70) ? 'block' : 'none';

    prevTime = time;
    renderer.render(scene, camera);
}

// Global başlatma fonksiyonu
window.startGasSimulation = () => animate();