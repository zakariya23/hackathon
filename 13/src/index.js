const canvasSketch = require("canvas-sketch");
const THREE = require("three");
global.THREE = THREE;
const { Text } = require("troika-three-text");
const Stats = require("stats-js");
const { GUI } = require("dat.gui");
const loadFont = require('load-bmfont');
// Import extra THREE plugins
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/geometries/RoundedBoxGeometry.js");
require("three/examples/js/loaders/GLTFLoader.js");
require("three/examples/js/loaders/RGBELoader.js");
require("three/examples/js/postprocessing/EffectComposer.js");
require("three/examples/js/postprocessing/RenderPass.js");
require("three/examples/js/postprocessing/UnrealBloomPass.js");
require("three/examples/js/shaders/LuminosityHighPassShader.js");
require("three/examples/js/shaders/CopyShader.js");
require("three/examples/js/postprocessing/ShaderPass.js");
require("three/examples/js/exporters/GLTFExporter.js")
const settings = {
  animate: true,
  context: "webgl",
  resizeCanvas: false,
};


// Parse the URL parameters to get the data
const urlParams = new URLSearchParams(window.location.search);
const psaId = urlParams.get('psa_id');

let frontTexture;  // Declare at a higher scope so it can be accessed later

// Global variable to hold card data
let cardData = {};

async function fetchCardDetails() {
  // Fetch card details and store them
  const response = await fetch(`http://localhost:5000/get_card_details`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: psaId })
  });
  if (response.ok) {
    cardData = await response.json();
    // Store cardData into Flask backend for retrieval later (Optional)
    await fetch(`http://localhost:5000/store_psa_data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ psa_id: psaId, psa_data: cardData })
    });
    console.log(cardData);
    const localImageUrl = cardData['local_image_url'];
    frontTexture = new THREE.TextureLoader().load(localImageUrl);
  } else {
    console.error("Failed to fetch card details from Flask backend");
  }
}

async function waitForCardData() {
  while (Object.keys(cardData).length === 0) {  // Checks if cardData is empty
    await new Promise(resolve => setTimeout(resolve, 100));  // Wait for 100ms
  }
  // Now, cardData is not empty. Continue with the rest of your code.
}



async function fetchDataAndStartSketch(psaId) {
  // Fetch card details
  await fetchCardDetails(psaId);
  // Wait for cardData to be populated
  await waitForCardData();
  // Continue with your Three.js code here






const sketch = ({ context, canvas, width, height }) => {
  const stats = new Stats();
  document.body.appendChild(stats.dom);
  const gui = new GUI();



  const options = {
    enableSwoopingCamera: false,
    enableRotation: false,
    transmission: 1,
    thickness: 0.3,
    roughness: 1,
    envMapIntensity: 1.8,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    normalScale: 0,
    clearcoatNormalScale: 0,
    normalRepeat: 1,
    bloomThreshold: 0.85,
    bloomStrength: 0.5,
    bloomRadius: 0.33,
  };

  // Setup
  // -----

  const renderer = new THREE.WebGLRenderer({
    context,
    antialias: false,
  });
  renderer.setClearColor(0x000000, 1);  // or another suitable color

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, 5);

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enabled = !options.enableSwoopingCamera;

  const scene = new THREE.Scene();

  console.log('------------------')
  console.log(cardData)

// Use data to populate your constants and text content
const certificationNumber = cardData['Certification Number'];
const labelType = cardData['Label Type'];
const reverseCertNumberBarcode = cardData['Reverse Cert Number/Barcode'];
const year = cardData['Year'];
const brand = cardData['Brand'];
const sport = cardData['Sport'];
const cardNumber = cardData['Card Number'];
const player = cardData['Player'];
const varietyPedigree = cardData['Variety/Pedigree'];
const grade = cardData['Grade'];


const textContent = `
  Certification Number: ${certificationNumber}
  Label Type: ${labelType}
  Reverse Cert Number/Barcode: ${reverseCertNumberBarcode}
  Year: ${year}
  Brand: ${brand}
  Sport: ${sport}
  Card Number: ${cardNumber}
  Player: ${player}
  Variety/Pedigree: ${varietyPedigree}
  Grade: ${grade}
`;




const textMesh = new Text();
textMesh.text = textContent;
textMesh.fontSize = 0.028;
textMesh.color = 0xffffff;
textMesh.position.set(-0.480, -0.51, 0.151); // Set the position directly
textMesh.sync();

// Add text mesh to scene
scene.add(textMesh);



  // Pink light
const pinkLight = new THREE.PointLight(0xff69b4, 1, 100);
pinkLight.position.set(0, 2, 4);
scene.add(pinkLight);

// Blue light
const blueLight = new THREE.PointLight(0x1e90ff, 1, 100);
blueLight.position.set(0, -2, -4);
scene.add(blueLight);

  const renderPass = new THREE.RenderPass(scene, camera);
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(width, height),
    options.bloomStrength,
    options.bloomRadius,
    options.bloomThreshold
  );

  const composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  // Content
  // -------

  const textureLoader = new THREE.TextureLoader();


// Creating the card's geometry. Adjust the dimensions so it fits inside the glass holder.
const cardGeometry = new THREE.PlaneGeometry(0.8, 1.2); // example dimensions, please adjust accordingly

// Create materials for the card
const frontMaterial = new THREE.MeshBasicMaterial({ map: frontTexture });


// Create the meshes
const frontCardMesh = new THREE.Mesh(cardGeometry, frontMaterial);


frontCardMesh.position.set(0, 0.22, 0.09); // small z-offset to place it inside the holder


const backMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black color

// Create the mesh for the backside using the same geometry but with the black material
const backCardMesh = new THREE.Mesh(cardGeometry, backMaterial);

// Position the back card mesh right behind the front card mesh
backCardMesh.position.set(0, 0.22, 0.088); // Slightly behind the front card

// Rotate the back card mesh by 180 degrees along the Y-axis so it faces the opposite direction
backCardMesh.rotation.y = Math.PI;

// Add the back card mesh to your scene
scene.add(backCardMesh);

// Add the card meshes to your scene
scene.add(frontCardMesh);


  const bgTexture = textureLoader.load("src/texture.png");
  const bgGeometry = new THREE.PlaneGeometry(5, 5);
  const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  bgMesh.position.set(0, 0, -1);
  scene.add(bgMesh);





  const positions = [
    [0, 0, 0] // Only position for the rounded box
  ];

  let geometries = [
    // new THREE.IcosahedronGeometry(0.75, 0), // Faceted
    // new THREE.IcosahedronGeometry(0.67, 24), // Sphere
    new THREE.RoundedBoxGeometry(1.12, 2.12, 0.2, 16, 0.2), // Only rounded box
  ];


  const solidMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      void main() {
        vPosition = position;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
    varying vec3 vPosition;
  varying vec3 vNormal;
  uniform vec3 lightPosition;

  void main() {
    if (vPosition.y > 0.3) {
      discard;
    }

    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(lightPosition - vPosition);

    // Diffuse term
    float diffuse = max(dot(normal, lightDir), 0.0);

    // Specular term with higher shininess value
    float shininess = 100.0; // Higher value for more glossiness
    float specular = pow(max(dot(reflect(-lightDir, normal), vec3(0.0, 1.0, 0.0)), 0.0), shininess);

    vec3 specColor = vec3(0.1, 0.1, 0.1) * specular; // light gray highlights

    // Combine black base color and specular color to make it glossy black
    gl_FragColor = vec4(vec3(0.12, 0.12, 0.2) + specColor, 1.0);
  }
    `,
    uniforms: {
      lightColor1: { value: new THREE.Vector3(1, 0, 1) }, // Pink light
      lightColor2: { value: new THREE.Vector3(0, 0, 1) }  // Blue light
    }
  });

  const solidMesh = new THREE.Mesh(
    new THREE.RoundedBoxGeometry(1.13, 0.807, 0.3, 16, 0.21),
    solidMaterial
  );

  solidMesh.position.set(0, -0.807, 0);
  scene.add(solidMesh);



  const light1 = new THREE.PointLight(0xFF00FF, 1, 1000); // Pink light
light1.position.set(50, 50, 50);
scene.add(light1);

const light2 = new THREE.PointLight(0x0000FF, 1, 1000); // Blue light
light2.position.set(-50, 50, 50);
scene.add(light2);







  const hdrEquirect = new THREE.RGBELoader().load(
    "src/empty_warehouse_01_2k.hdr",
    () => {
      hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    }
  );

  const normalMapTexture = textureLoader.load("src/normal.jpg");
  normalMapTexture.wrapS = THREE.RepeatWrapping;
  normalMapTexture.wrapT = THREE.RepeatWrapping;
  normalMapTexture.repeat.set(options.normalRepeat, options.normalRepeat);

  const material = new THREE.MeshPhysicalMaterial({
    transmission: options.transmission,
    thickness: options.thickness,
    roughness: options.roughness,
    envMap: hdrEquirect,
    envMapIntensity: options.envMapIntensity,
    clearcoat: options.clearcoat,
    clearcoatRoughness: options.clearcoatRoughness,
    normalScale: new THREE.Vector2(options.normalScale),
    normalMap: normalMapTexture,
    clearcoatNormalMap: normalMapTexture,
    clearcoatNormalScale: new THREE.Vector2(options.clearcoatNormalScale),
    transparent: true,


  });

  const meshes = geometries.map(
    (geometry) => new THREE.Mesh(geometry, material)
  );

  meshes.forEach((mesh, i) => {
    scene.add(mesh);
    mesh.position.set(...positions[i]);
  });






  // Update
  // ------

  const update = (time, deltaTime) => {
    const ROTATE_TIME = 10; // Time in seconds for a full rotation
    const xAxis = new THREE.Vector3(1, 0, 0);
    const yAxis = new THREE.Vector3(0, 1, 0);
    const rotateX = (deltaTime / ROTATE_TIME) * Math.PI * 2;
    const rotateY = (deltaTime / ROTATE_TIME) * Math.PI * 2;

    if (options.enableRotation) {
      meshes.forEach((mesh) => {
        mesh.rotateOnWorldAxis(xAxis, rotateX);
        mesh.rotateOnWorldAxis(yAxis, rotateY);
      });
    }

    if (options.enableSwoopingCamera) {
      camera.position.x = Math.sin((time / 10) * Math.PI * 2) * 2;
      camera.position.y = Math.cos((time / 10) * Math.PI * 2) * 2;
      camera.position.z = 4;
      camera.lookAt(scene.position);
    }






  };

  // Lifecycle
  // ---------

  return {
    resize({ canvas, pixelRatio, viewportWidth, viewportHeight }) {
      const dpr = Math.min(pixelRatio, 2); // Cap DPR scaling to 2x

      canvas.width = viewportWidth * dpr;
      canvas.height = viewportHeight * dpr;
      canvas.style.width = viewportWidth + "px";
      canvas.style.height = viewportHeight + "px";

      bloomPass.resolution.set(viewportWidth, viewportHeight);

      renderer.setPixelRatio(dpr);
      renderer.setSize(viewportWidth, viewportHeight);

      composer.setPixelRatio(dpr);
      composer.setSize(viewportWidth, viewportHeight);

      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    render({ time, deltaTime }) {
      stats.begin();
      controls.update();
      update(time, deltaTime);
      // renderer.render(scene, camera);
      composer.render();
      stats.end();
    },
    unload() {
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
      hdrEquirect.dispose();
      controls.dispose();
      renderer.dispose();
      bloomPass.dispose();
      gui.destroy();
      document.body.removeChild(stats.dom);
    },
  };




};

canvasSketch(sketch, settings);}

// Call this function to fetch data and then start the sketch
fetchDataAndStartSketch();
