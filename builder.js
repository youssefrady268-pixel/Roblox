// 🔑 كود التهيأة والـ API Key المأخوذ من فيديو مشروعك:
const firebaseConfig = {
  apiKey: "AIzaSyCz7jfJ35GOfcC4_S2TJ6T7M",
  authDomain: "com-example-myapplication-5fe13.firebaseapp.com",
  databaseURL: "https://com-example-myapplication-5fe13-default-rtdb.firebaseio.com",
  projectId: "com-example-myapplication-5fe13",
  storageBucket: "com-example-myapplication-5fe13.appspot.com",
  messagingSenderId: "103643760434",
  appId: "1:103643760434:web:0fa41a5fe0c34e8726eaf0"
};

// رابط قاعدة البيانات للـ REST API
const FIREBASE_DB_URL = firebaseConfig.databaseURL;

const container = document.getElementById('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(3, 4, 6);
camera.lookAt(0, 1, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });

let isRendererAttached = false;
let currentCube = null;
let allObjects = [];
let scriptList = [];

const colorMap = {
  'احمر': 0xff2222, 'أحمر': 0xff2222,
  'ازرق': 0x2288ff, 'أزرق': 0x2288ff,
  'اخضر': 0x22ff55, 'أخضر': 0x22ff55,
  'اصفر': 0xffdd22, 'أصفر': 0xffdd22
};

function openStudio() {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('studio-screen').style.display = 'flex';
  
  if (!isRendererAttached) {
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    const gridHelper = new THREE.GridHelper(10, 10, 0x007acc, 0x444444);
    scene.add(gridHelper);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    isRendererAttached = true;
  }
  clearAllObjects();
}

function exitToMenu() {
  document.getElementById('studio-screen').style.display = 'none';
  document.getElementById('main-menu').style.display = 'flex';
  renderPublishedMaps();
}

function createShape(type = 'box', colorName = 'ازرق') {
  const hexColor = colorMap[colorName] || 0x2288ff;
  let geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: hexColor });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0.5, 0);

  mesh.userData = {
    name: `Part_${allObjects.length + 1}`,
    colorName: colorName
  };

  scene.add(mesh);
  currentCube = mesh;
  allObjects.push(mesh);
  updateExplorerUI();
  selectPart(mesh);
}

function addScriptToService() {
  scriptList.push(`Script_${scriptList.length + 1}`);
  updateExplorerUI();
}

function updateExplorerUI() {
  const wsList = document.getElementById('workspace-list');
  const ssList = document.getElementById('scriptservice-list');
  if (!wsList || !ssList) return;

  wsList.innerHTML = '';
  ssList.innerHTML = '';

  allObjects.forEach((obj) => {
    const div = document.createElement('div');
    div.className = 'tree-item';
    div.innerText = `🧱 ${obj.userData.name}`;
    if (currentCube === obj) div.classList.add('selected');
    div.onclick = () => selectPart(obj);
    wsList.appendChild(div);
  });

  scriptList.forEach((sName) => {
    const div = document.createElement('div');
    div.className = 'tree-item';
    div.innerText = `📜 ${sName}`;
    ssList.appendChild(div);
  });
}

function selectPart(obj) {
  currentCube = obj;
  updateExplorerUI();
  if (obj) {
    document.getElementById('prop-name').value = obj.userData.name;
    document.getElementById('prop-color').value = obj.userData.colorName || 'ازرق';
  }
}

function updateSelectedProp(prop, value) {
  if (!currentCube) return;
  if (prop === 'name') {
    currentCube.userData.name = value;
    updateExplorerUI();
  }
  if (prop === 'color') {
    currentCube.userData.colorName = value;
    currentCube.material.color.setHex(colorMap[value] || 0x2288ff);
  }
}

function moveSelected(x, y, z) {
  if (currentCube) {
    currentCube.position.x += x;
    currentCube.position.y += y;
    currentCube.position.z += z;
  }
}
function scaleSelected(factor) {
  if (currentCube) currentCube.scale.multiplyScalar(factor);
}
function rotateSelected(deg) {
  if (currentCube) currentCube.rotation.y += (deg * Math.PI) / 180;
}

function clearAllObjects() {
  allObjects.forEach(obj => scene.remove(obj));
  allObjects = [];
  scriptList = [];
  currentCube = null;
  updateExplorerUI();
}

// 🚀 نشر الماب باستخدام الـ API Key وقاعدة البيانات
async function publishMap() {
  if (allObjects.length === 0) {
    alert("الماب فاضية! أضف بعض البارتات الأول قبل النشر.");
    return;
  }

  const mapName = prompt("أدخل اسم الماب للنشر الأونلاين:", "ماب الأسطورة");
  if (!mapName) return;

  const mapId = Date.now();
  const mapData = {
    id: mapId,
    name: mapName,
    partsCount: allObjects.length,
    parts: allObjects.map(obj => ({
      name: obj.userData.name,
      color: obj.userData.colorName,
      posX: obj.position.x,
      posY: obj.position.y,
      posZ: obj.position.z,
      scaleX: obj.scale.x,
      scaleY: obj.scale.y,
      scaleZ: obj.scale.z
    }))
  };

  try {
    // استخدام الـ API Key في طلب الحفظ للأمان والتوثيق
    await fetch(`${FIREBASE_DB_URL}/maps/${mapId}.json?key=${firebaseConfig.apiKey}`, {
      method: 'PUT',
      body: JSON.stringify(mapData)
    });

    alert(`🎉 تم نشر ماب "${mapName}" بالـ API Key بتاعك أونلاين بنجاح!`);
    exitToMenu();
  } catch (error) {
    alert("حدث خطأ في الاتصال بالفايربيس، تأكد من الـ Rules.");
    console.error(error);
  }
}

// 🌐 جلب المابات مع الـ API Key
async function renderPublishedMaps() {
  const listContainer = document.getElementById('published-maps-list');
  listContainer.innerHTML = '<p style="text-align:center; color:#aaa;">جاري جلب المابات من السيرفر...</p>';

  try {
    const res = await fetch(`${FIREBASE_DB_URL}/maps.json?key=${firebaseConfig.apiKey}`);
    const data = await res.json();

    listContainer.innerHTML = '';

    if (!data) {
      listContainer.innerHTML = '<p style="text-align:center; color:#aaa;">لا توجد مابات منشورة بعد على السيرفر..</p>';
      return;
    }

    Object.values(data).forEach(map => {
      const card = document.createElement('div');
      card.className = 'map-card';
      card.innerHTML = `
        <div>
          <strong>🗺️ ${map.name}</strong> 
          <small style="color:#aaa;">(عدد العناصر: ${map.partsCount})</small>
        </div>
        <button class="play-btn" onclick="loadAndPlayMap('${map.id}')">🎮 دخول اللعبة</button>
      `;
      listContainer.appendChild(card);
    });
  } catch (err) {
    listContainer.innerHTML = '<p style="text-align:center; color:red;">تعذر جلب البيانات من السيرفر.</p>';
  }
}

// 🎮 تحميل الماب
async function loadAndPlayMap(mapId) {
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/maps/${mapId}.json?key=${firebaseConfig.apiKey}`);
    const map = await res.json();

    if (!map) return;

    openStudio();
    clearAllObjects();

    map.parts.forEach(pData => {
      const hexColor = colorMap[pData.color] || 0x2288ff;
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ color: hexColor });
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.set(pData.posX, pData.posY, pData.posZ);
      mesh.scale.set(pData.scaleX, pData.scaleY, pData.scaleZ);

      mesh.userData = {
        name: pData.name,
        colorName: pData.color
      };

      scene.add(mesh);
      allObjects.push(mesh);
    });

    updateExplorerUI();
    alert(`تم تحميل ماب "${map.name}" المرفوعة على السيرفر بنجاح!`);
  } catch (e) {
    alert("حدث خطأ أثناء تحميل الماب.");
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (isRendererAttached) {
    renderer.render(scene, camera);
  }
}
animate();
