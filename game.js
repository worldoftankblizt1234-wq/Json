// ============================================
// 🎮 GAME.JS - AoH Style RTS (Fix Login)
// ============================================

// ==================== CẤU HÌNH ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const firebaseConfig = window.firebaseConfig;

// ==================== GAME STATE ====================
let playerId = null;
let playerName = 'Chiến Binh';
let playerColor = '#e94560';
let roomId = null;
let isHost = false;
let mapData = null;
let db = null;
let gameRef = null;
let isFirebaseReady = false;

let gameState = {
    cities: [],
    players: {},
    movingArmies: [],
    gameTime: 0,
    isRunning: true,
};

let selectedCity = null;
let selectedUnit = null;
let isSelectingUnit = false;
let peerConnections = {};
let dataChannels = {};

// ==================== CÔNG TRÌNH ====================
const BUILDINGS = {
    barracks: { name: 'Doanh trại', cost: 60, icon: '🏛️', effect: 'Tăng sản xuất quân +50%', category: 'military', level: 1, maxLevel: 3, upgradeCost: 40 },
    stable: { name: 'Chuồng ngựa', cost: 70, icon: '🐴', effect: 'Tạo kỵ binh', category: 'military', level: 1, maxLevel: 3, upgradeCost: 50 },
    workshop: { name: 'Xưởng vũ khí', cost: 80, icon: '⚔️', effect: 'Sức mạnh quân +20%', category: 'military', level: 1, maxLevel: 3, upgradeCost: 60 },
    fortress: { name: 'Pháo đài', cost: 120, icon: '🏰', effect: 'Phòng thủ +50%', category: 'military', level: 1, maxLevel: 3, upgradeCost: 80 },
    wall: { name: 'Tường thành', cost: 90, icon: '🧱', effect: 'Phòng thủ +30%', category: 'military', level: 1, maxLevel: 5, upgradeCost: 50 },
    farm: { name: 'Nông trại', cost: 40, icon: '🌾', effect: 'Vàng +8/giây', category: 'economy', level: 1, maxLevel: 5, upgradeCost: 30 },
    market: { name: 'Chợ', cost: 50, icon: '🏪', effect: 'Thương mại +15/giây', category: 'economy', level: 1, maxLevel: 4, upgradeCost: 40 },
    mine: { name: 'Mỏ vàng', cost: 60, icon: '⛏️', effect: 'Vàng +12/giây', category: 'economy', level: 1, maxLevel: 5, upgradeCost: 45 },
    port: { name: 'Cảng', cost: 80, icon: '⚓', effect: 'Thương mại +20/giây', category: 'economy', level: 1, maxLevel: 3, upgradeCost: 60 },
    sawmill: { name: 'Xưởng gỗ', cost: 45, icon: '🪵', effect: 'Gỗ +10/giây', category: 'economy', level: 1, maxLevel: 5, upgradeCost: 35 },
    quarry: { name: 'Mỏ đá', cost: 55, icon: '🪨', effect: 'Đá +8/giây', category: 'economy', level: 1, maxLevel: 5, upgradeCost: 40 },
    hospital: { name: 'Bệnh xá', cost: 70, icon: '🏥', effect: 'Phục hồi quân +30%', category: 'civil', level: 1, maxLevel: 4, upgradeCost: 50 },
    temple: { name: 'Đền thờ', cost: 80, icon: '⛪', effect: 'Tinh thần +25%', category: 'civil', level: 1, maxLevel: 4, upgradeCost: 55 },
    school: { name: 'Trường học', cost: 90, icon: '📚', effect: 'Công nghệ +30%', category: 'civil', level: 1, maxLevel: 5, upgradeCost: 60 },
    library: { name: 'Thư viện', cost: 100, icon: '📖', effect: 'Khoa học +40%', category: 'civil', level: 1, maxLevel: 4, upgradeCost: 70 },
    workshop_civil: { name: 'Xưởng thủ công', cost: 50, icon: '🔧', effect: 'Sản xuất +20%', category: 'civil', level: 1, maxLevel: 5, upgradeCost: 35 },
    palace: { name: 'Cung điện', cost: 200, icon: '👑', effect: 'Mọi chỉ số +20%', category: 'special', level: 1, maxLevel: 3, upgradeCost: 150 },
    monument: { name: 'Tượng đài', cost: 150, icon: '🗽', effect: 'Tinh thần +50%', category: 'special', level: 1, maxLevel: 3, upgradeCost: 100 },
    university: { name: 'Đại học', cost: 130, icon: '🎓', effect: 'Công nghệ +50%', category: 'special', level: 1, maxLevel: 4, upgradeCost: 90 },
    bank: { name: 'Ngân hàng', cost: 160, icon: '🏦', effect: 'Vàng +30/giây', category: 'special', level: 1, maxLevel: 3, upgradeCost: 120 },
};

const POLICIES = {
    democracy: { name: 'Dân chủ', cost: 100, icon: '🗳️', effect: 'Vàng +20%, Quân -10%' },
    monarchy: { name: 'Quân chủ', cost: 80, icon: '👑', effect: 'Quân +30%, Vàng -10%' },
    communism: { name: 'Cộng sản', cost: 120, icon: '⚒️', effect: 'Sản xuất +40%, TM -20%' },
    capitalism: { name: 'Tư bản', cost: 150, icon: '💰', effect: 'Thương mại +50%, Quân -20%' },
    theocracy: { name: 'Thần quyền', cost: 90, icon: '⛪', effect: 'Tinh thần +50%, CN -20%' },
    federation: { name: 'Liên bang', cost: 130, icon: '🤝', effect: 'Phòng thủ +30%' },
    militarism: { name: 'Quân phiệt', cost: 110, icon: '⚔️', effect: 'Quân +50%, Kinh tế -30%' },
    trade_union: { name: 'Liên minh TM', cost: 140, icon: '📦', effect: 'Thương mại +60%, Quân -30%' },
};

const TECHNOLOGIES = {
    agriculture: { name: 'Nông nghiệp', cost: 50, icon: '🌾', effect: 'Vàng +5/giây', level: 0, maxLevel: 5 },
    military: { name: 'Quân sự', cost: 60, icon: '⚔️', effect: 'Sức mạnh quân +10%', level: 0, maxLevel: 5 },
    trade: { name: 'Thương mại', cost: 70, icon: '📦', effect: 'Thương mại +15%', level: 0, maxLevel: 5 },
    defense: { name: 'Phòng thủ', cost: 80, icon: '🛡️', effect: 'Phòng thủ +20%', level: 0, maxLevel: 5 },
    science: { name: 'Khoa học', cost: 100, icon: '🔬', effect: 'Giảm chi phí XD 10%', level: 0, maxLevel: 5 },
    diplomacy: { name: 'Ngoại giao', cost: 90, icon: '🤝', effect: 'Quan hệ +20%', level: 0, maxLevel: 5 },
    engineering: { name: 'Kỹ thuật', cost: 110, icon: '⚙️', effect: 'Xây dựng nhanh +30%', level: 0, maxLevel: 4 },
    navigation: { name: 'Hàng hải', cost: 120, icon: '⛵', effect: 'Thương mại biển +40%', level: 0, maxLevel: 4 },
};

// ==================== LOAD MAP ====================
async function loadMap() {
    try {
        const response = await fetch('map.json');
        mapData = await response.json();
        canvas.width = mapData.info?.width || 1280;
        canvas.height = mapData.info?.height || 881;
        
        const burgs = mapData.burgs || [];
        gameState.cities = burgs.map(burg => ({
            id: burg.i,
            name: burg.name || `City ${burg.i}`,
            x: burg.x,
            y: burg.y,
            owner: null,
            population: burg.population || 1000,
            army: Math.floor(Math.random() * 8) + 5,
            gold: 100,
            wood: 50,
            stone: 30,
            buildings: [],
            isCapital: burg.capital === 1,
            defense: 10,
            type: burg.type || 'Generic',
            morale: 70,
            isUnderAttack: false,
        }));
        
        render();
        updateUI();
        console.log('✅ Đã tải bản đồ!');
    } catch (error) {
        console.error('❌ Lỗi tải map:', error);
    }
}

// ==================== LOGIN ====================
function setupLogin() {
    const loginBtn = document.getElementById('login-btn');
    const modeSelect = document.getElementById('game-mode');
    const roomIdGroup = document.getElementById('room-id-group');
    const roomInput = document.getElementById('room-id');
    
    // Show/hide room input
    modeSelect.addEventListener('change', function() {
        roomIdGroup.style.display = this.value === 'join' ? 'block' : 'none';
    });
    
    // Login button click
    loginBtn.addEventListener('click', async function() {
        // Lấy thông tin
        playerName = document.getElementById('player-name').value.trim() || 'Chiến Binh';
        playerColor = document.getElementById('player-color').value;
        const mode = document.getElementById('game-mode').value;
        
        // Validate
        if (mode === 'join') {
            roomId = document.getElementById('room-id').value.trim();
            if (!roomId) {
                alert('❌ Vui lòng nhập mã phòng!');
                return;
            }
        } else {
            roomId = generateRoomId();
        }
        
        // Disable button
        this.disabled = true;
        this.textContent = '⏳ Đang kết nối...';
        
        try {
            // Khởi tạo Firebase
            await initFirebase();
            
            // Tham gia game
            await joinGame();
            
            // Ẩn login, hiện game
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('game-container').classList.add('active');
            
        } catch (error) {
            console.error('❌ Lỗi:', error);
            alert('❌ Không thể kết nối! Vui lòng thử lại.\n' + error.message);
        } finally {
            this.disabled = false;
            this.textContent = '🚀 Vào game';
        }
    });
}

function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ==================== FIREBASE ====================
function initFirebase() {
    return new Promise((resolve, reject) => {
        // Kiểm tra firebase đã load chưa
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            db = firebase.database();
            gameRef = db.ref(`games/${roomId}`);
            isFirebaseReady = true;
            resolve();
            return;
        }
        
        // Load Firebase SDK
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
        script.onload = function() {
            const script2 = document.createElement('script');
            script2.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js';
            script2.onload = function() {
                try {
                    firebase.initializeApp(firebaseConfig);
                    db = firebase.database();
                    gameRef = db.ref(`games/${roomId}`);
                    isFirebaseReady = true;
                    console.log('🔥 Firebase đã kết nối!');
                    resolve();
                } catch (e) {
                    reject(new Error('Không thể khởi tạo Firebase: ' + e.message));
                }
            };
            script2.onerror = function() {
                reject(new Error('Không thể load Firebase Database SDK'));
            };
            document.head.appendChild(script2);
        };
        script.onerror = function() {
            reject(new Error('Không thể load Firebase App SDK'));
        };
        document.head.appendChild(script);
    });
}

async function joinGame() {
    playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Kiểm tra phòng
    const snapshot = await gameRef.once('value');
    const roomData = snapshot.val();
    
    if (roomData) {
        // Phòng đã tồn tại
        isHost = false;
        gameState.players = roomData.players || {};
        if (roomData.cities) {
            // Đồng bộ cities từ Firebase
            Object.keys(roomData.cities).forEach(key => {
                const cityData = roomData.cities[key];
                const localCity = gameState.cities.find(c => c.id == key);
                if (localCity) {
                    localCity.owner = cityData.owner;
                    localCity.army = cityData.army || 0;
                    localCity.gold = cityData.gold || 0;
                    localCity.wood = cityData.wood || 0;
                    localCity.stone = cityData.stone || 0;
                    localCity.buildings = cityData.buildings || [];
                    localCity.defense = cityData.defense || 10;
                    localCity.morale = cityData.morale || 70;
                }
            });
        }
    } else {
        // Tạo phòng mới
        isHost = true;
        gameState.players = {};
        await gameRef.set({
            roomId: roomId,
            hostId: playerId,
            createdAt: Date.now(),
            players: {},
            cities: {},
            movingArmies: {},
        });
    }
    
    // Đăng ký người chơi
    const playerData = {
        id: playerId,
        name: playerName,
        color: playerColor,
        gold: 300,
        wood: 150,
        stone: 100,
        army: 25,
        cities: [],
        buildings: [],
        technology: {},
        policy: null,
        score: 0,
        isAlive: true,
        joinedAt: Date.now(),
        isHost: isHost,
    };
    
    // Tìm thành phố trống
    const unownedCity = gameState.cities.find(c => c.owner === null);
    if (unownedCity) {
        unownedCity.owner = playerId;
        unownedCity.army = 15;
        unownedCity.gold = 100;
        unownedCity.wood = 50;
        unownedCity.stone = 30;
        playerData.cities.push(unownedCity.id);
        await updateCity(unownedCity);
    }
    
    await gameRef.child('players').child(playerId).set(playerData);
    
    // Lắng nghe thay đổi
    listenToGameChanges();
    
    // Khởi tạo WebRTC
    initWebRTC();
    
    // Bắt đầu game loop
    startGameLoop();
    
    // Cập nhật UI
    document.getElementById('room-info').innerHTML = `
        🔗 Mã phòng: <span style="color:#4ade80;font-weight:bold;">${roomId}</span>
        ${isHost ? ' (👑 Chủ phòng)' : ''}
        <br>👥 Đang có ${Object.keys(gameState.players).length} người chơi
    `;
    document.getElementById('connection-status').textContent = '🟢 Đã kết nối';
    document.getElementById('connection-status').style.color = '#4ade80';
    
    console.log(`✅ Đã đăng nhập: ${playerName} (${playerId})`);
}

// ==================== LẮNG NGHE FIREBASE ====================
function listenToGameChanges() {
    // Players
    gameRef.child('players').on('value', function(snapshot) {
        const data = snapshot.val();
        if (data) {
            gameState.players = data;
            updatePlayerList();
            updateUI();
            render();
            updatePeerConnections();
        }
    });
    
    // Cities
    gameRef.child('cities').on('value', function(snapshot) {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                const cityData = data[key];
                const localCity = gameState.cities.find(c => c.id == key);
                if (localCity) {
                    localCity.owner = cityData.owner;
                    localCity.army = cityData.army || 0;
                    localCity.gold = cityData.gold || 0;
                    localCity.wood = cityData.wood || 0;
                    localCity.stone = cityData.stone || 0;
                    localCity.buildings = cityData.buildings || [];
                    localCity.defense = cityData.defense || 10;
                    localCity.morale = cityData.morale || 70;
                }
            });
            render();
            updateUI();
        }
    });
    
    // Moving Armies
    gameRef.child('movingArmies').on('value', function(snapshot) {
        const data = snapshot.val();
        if (data) {
            gameState.movingArmies = Object.values(data);
            render();
        }
    });
}

// ==================== UPDATE CITY ====================
function updateCity(city) {
    return new Promise((resolve) => {
        if (!gameRef) { resolve(); return; }
        const cityRef = gameRef.child('cities').child(city.id);
        cityRef.set({
            id: city.id,
            name: city.name,
            x: city.x,
            y: city.y,
            owner: city.owner,
            army: Math.floor(city.army),
            gold: Math.floor(city.gold || 0),
            wood: Math.floor(city.wood || 0),
            stone: Math.floor(city.stone || 0),
            buildings: city.buildings || [],
            defense: Math.floor(city.defense || 10),
            isCapital: city.isCapital || false,
            population: Math.floor(city.population || 1000),
            morale: Math.floor(city.morale || 70),
        }, resolve);
    });
}

// ==================== WEBRTC P2P ====================
function initWebRTC() {
    const config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]
    };
    
    Object.keys(gameState.players).forEach(pid => {
        if (pid !== playerId) {
            createPeerConnection(pid, config);
        }
    });
}

function createPeerConnection(targetId, config) {
    const pc = new RTCPeerConnection(config);
    peerConnections[targetId] = pc;
    
    const channel = pc.createDataChannel(`game-channel-${playerId}-${targetId}`);
    channel.onopen = function() {
        console.log(`✅ P2P kết nối với ${targetId}`);
        dataChannels[targetId] = channel;
    };
    channel.onmessage = function(e) {
        try {
            const data = JSON.parse(e.data);
            handlePeerMessage(data, targetId);
        } catch(e) {}
    };
    
    pc.onicecandidate = function(event) {
        if (event.candidate) {
            gameRef.child('signaling').child(targetId).child(playerId).set({
                candidate: event.candidate,
                from: playerId,
            });
        }
    };
    
    gameRef.child('signaling').child(playerId).child(targetId).on('value', async function(snapshot) {
        const data = snapshot.val();
        if (!data) return;
        
        try {
            if (data.offer && !pc.currentRemoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                gameRef.child('signaling').child(targetId).child(playerId).set({
                    answer: answer,
                    from: playerId,
                });
            }
            if (data.answer && !pc.currentRemoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
            if (data.candidate) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch(e) {}
            }
        } catch(e) { console.error('P2P error:', e); }
    });
    
    if (isHost && playerId < targetId) {
        setTimeout(async function() {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                gameRef.child('signaling').child(targetId).child(playerId).set({
                    offer: offer,
                    from: playerId,
                });
            } catch(e) {}
        }, 1000);
    }
}

function updatePeerConnections() {
    const currentPlayers = Object.keys(gameState.players);
    Object.keys(peerConnections).forEach(pid => {
        if (!currentPlayers.includes(pid)) {
            try { peerConnections[pid].close(); } catch(e) {}
            delete peerConnections[pid];
            delete dataChannels[pid];
        }
    });
    currentPlayers.forEach(pid => {
        if (pid !== playerId && !peerConnections[pid]) {
            createPeerConnection(pid, {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
        }
    });
}

function handlePeerMessage(data, fromId) {
    switch (data.type) {
        case 'move_army':
            const fromCity = gameState.cities.find(c => c.id === data.fromCityId);
            const toCity = gameState.cities.find(c => c.id === data.toCityId);
            if (fromCity && toCity) {
                fromCity.army -= data.units;
                updateCity(fromCity);
                const army = {
                    id: `p2p_${Date.now()}`,
                    playerId: data.playerId,
                    fromCityId: data.fromCityId,
                    toCityId: data.toCityId,
                    units: data.units,
                    startX: fromCity.x,
                    startY: fromCity.y,
                    targetX: toCity.x,
                    targetY: toCity.y,
                    progress: 0,
                    startTime: Date.now(),
                };
                gameState.movingArmies.push(army);
                gameRef.child('movingArmies').child(army.id).set(army);
            }
            break;
        case 'attack':
            resolveBattle(data.cityId, data.attackerId, data.units);
            break;
    }
}

function broadcastToPeers(data) {
    Object.keys(dataChannels).forEach(pid => {
        try {
            const channel = dataChannels[pid];
            if (channel && channel.readyState === 'open') {
                channel.send(JSON.stringify(data));
            }
        } catch(e) {}
    });
}

// ==================== XÂY DỰNG ====================
function buildBuilding(cityId, buildingType) {
    if (!playerId) return;
    const player = gameState.players[playerId];
    if (!player) return;
    const city = gameState.cities.find(c => c.id === cityId);
    if (!city || city.owner !== playerId) return;
    
    const building = BUILDINGS[buildingType];
    if (!building) return;
    
    let goldCost = building.cost;
    let woodCost = Math.floor(building.cost * 0.3);
    let stoneCost = Math.floor(building.cost * 0.2);
    
    if (player.technology && player.technology.science) {
        const discount = player.technology.science * 0.05;
        goldCost *= (1 - discount);
        woodCost *= (1 - discount);
        stoneCost *= (1 - discount);
    }
    goldCost = Math.floor(goldCost);
    woodCost = Math.floor(woodCost);
    stoneCost = Math.floor(stoneCost);
    
    if (player.gold < goldCost || player.wood < woodCost || player.stone < stoneCost) {
        alert(`❌ Không đủ tài nguyên!\n💰 Cần ${goldCost} vàng\n🪵 Cần ${woodCost} gỗ\n🪨 Cần ${stoneCost} đá`);
        return;
    }
    
    player.gold -= goldCost;
    player.wood -= woodCost;
    player.stone -= stoneCost;
    gameRef.child('players').child(playerId).update({
        gold: player.gold,
        wood: player.wood,
        stone: player.stone,
    });
    
    const newBuilding = {
        id: `build_${Date.now()}`,
        type: buildingType,
        name: building.name,
        icon: building.icon,
        builtAt: Date.now(),
        level: 1,
        category: building.category,
    };
    if (!city.buildings) city.buildings = [];
    city.buildings.push(newBuilding);
    updateCity(city);
    
    // Apply effect
    applyBuildingEffect(city, buildingType);
    
    alert(`✅ Đã xây ${building.name} thành công!`);
    render();
    updateUI();
}

function applyBuildingEffect(city, buildingType) {
    switch(buildingType) {
        case 'barracks': city.army += 10; break;
        case 'hospital': city.morale = Math.min(100, city.morale + 10); break;
        case 'fortress': city.defense *= 1.5; break;
        case 'wall': city.defense *= 1.3; break;
        case 'palace': city.defense *= 1.2; city.morale = Math.min(100, city.morale + 15); break;
        case 'temple': city.morale = Math.min(100, city.morale + 20); break;
        default: break;
    }
    updateCity(city);
}

function upgradeBuilding(cityId, buildingIndex) {
    if (!playerId) return;
    const player = gameState.players[playerId];
    if (!player) return;
    const city = gameState.cities.find(c => c.id === cityId);
    if (!city || city.owner !== playerId) return;
    
    const building = city.buildings[buildingIndex];
    if (!building) return;
    const buildingData = BUILDINGS[building.type];
    if (!buildingData) return;
    
    if (building.level >= buildingData.maxLevel) {
        alert('❌ Công trình đã đạt cấp tối đa!');
        return;
    }
    
    const cost = buildingData.upgradeCost * building.level;
    if (player.gold < cost) {
        alert(`❌ Không đủ vàng! Cần ${cost}`);
        return;
    }
    
    player.gold -= cost;
    building.level += 1;
    gameRef.child('players').child(playerId).update({ gold: player.gold });
    updateCity(city);
    
    alert(`✅ Đã nâng cấp ${buildingData.name} lên cấp ${building.level}!`);
    render();
    updateUI();
}

// ==================== TUYỂN QUÂN ====================
function recruitArmy(cityId) {
    if (!playerId) return;
    const player = gameState.players[playerId];
    if (!player) return;
    const city = gameState.cities.find(c => c.id === cityId);
    if (!city || city.owner !== playerId) return;
    
    let cost = 20;
    if (player.technology && player.technology.military) {
        cost -= player.technology.military * 1;
    }
    cost = Math.max(10, Math.floor(cost));
    
    if (player.gold < cost) {
        alert(`❌ Không đủ vàng! Cần ${cost}`);
        return;
    }
    
    player.gold -= cost;
    city.army += 5;
    gameRef.child('players').child(playerId).update({ gold: player.gold });
    updateCity(city);
    alert(`✅ Tuyển được 5 quân tại ${city.name}!`);
    updateUI();
    render();
}

// ==================== XÂM CHIẾM ====================
function invadeCity(fromCityId, toCityId, units) {
    if (!playerId) return;
    const player = gameState.players[playerId];
    if (!player) return;
    
    const fromCity = gameState.cities.find(c => c.id === fromCityId);
    const toCity = gameState.cities.find(c => c.id === toCityId);
    
    if (!fromCity || !toCity) return;
    if (fromCity.owner !== playerId) {
        alert('❌ Không phải thành phố của bạn!');
        return;
    }
    if (fromCity.army < units) {
        alert(`❌ Không đủ quân! (Có ${Math.floor(fromCity.army)})`);
        return;
    }
    
    fromCity.army -= units;
    updateCity(fromCity);
    
    broadcastToPeers({
        type: 'move_army',
        playerId: playerId,
        fromCityId: fromCityId,
        toCityId: toCityId,
        units: units,
    });
    
    const armyId = `army_${Date.now()}`;
    const army = {
        id: armyId,
        playerId: playerId,
        playerName: player.name,
        fromCityId: fromCityId,
        toCityId: toCityId,
        units: units,
        startX: fromCity.x,
        startY: fromCity.y,
        targetX: toCity.x,
        targetY: toCity.y,
        progress: 0,
        startTime: Date.now(),
    };
    gameRef.child('movingArmies').child(armyId).set(army);
    
    setTimeout(() => {
        resolveBattle(toCityId, playerId, units);
        gameRef.child('movingArmies').child(armyId).remove();
    }, 3000);
}

function resolveBattle(cityId, attackerId, attackPower) {
    const city = gameState.cities.find(c => c.id === cityId);
    if (!city) return;
    
    const defenderId = city.owner;
    const attacker = gameState.players[attackerId];
    const defender = defenderId ? gameState.players[defenderId] : null;
    
    let attackStrength = attackPower;
    if (attacker && attacker.technology) {
        const militaryLevel = attacker.technology.military || 0;
        attackStrength *= (1 + militaryLevel * 0.1);
    }
    
    let defenseStrength = city.army + (city.defense || 10) * 0.5;
    if (defender && defender.technology) {
        const defenseLevel = defender.technology.defense || 0;
        defenseStrength *= (1 + defenseLevel * 0.1);
    }
    
    if (city.morale < 50) defenseStrength *= 0.7;
    else if (city.morale > 80) defenseStrength *= 1.2;
    
    if (city.buildings) {
        city.buildings.forEach(b => {
            if (b.type === 'wall') defenseStrength *= 1.3;
            if (b.type === 'fortress') defenseStrength *= 1.5;
        });
    }
    
    if (attackStrength > defenseStrength) {
        const oldOwner = city.owner;
        city.owner = attackerId;
        city.army = Math.floor(attackStrength - defenseStrength * 0.5);
        city.gold = Math.floor(city.gold * 0.6);
        city.morale = Math.max(30, city.morale - 20);
        updateCity(city);
        
        if (attacker) {
            if (!attacker.cities.includes(city.id)) {
                attacker.cities.push(city.id);
            }
            attacker.score = (attacker.score || 0) + 20;
            gameRef.child('players').child(attackerId).update({
                cities: attacker.cities,
                score: attacker.score,
            });
        }
        
        if (defender) {
            defender.cities = defender.cities.filter(id => id !== city.id);
            if (defender.cities.length === 0) {
                defender.isAlive = false;
            }
            gameRef.child('players').child(defenderId).update({
                cities: defender.cities,
                isAlive: defender.isAlive,
            });
        }
        
        broadcastToPeers({
            type: 'city_captured',
            cityId: city.id,
            newOwner: attackerId,
            army: city.army,
        });
        
    } else {
        city.army = Math.floor(defenseStrength - attackStrength * 0.3);
        city.morale = Math.max(30, city.morale - 10);
        updateCity(city);
        
        if (attacker) {
            attacker.gold -= 20;
            gameRef.child('players').child(attackerId).update({ gold: attacker.gold });
        }
    }
}

// ==================== CHÍNH TRỊ & CÔNG NGHỆ ====================
function changePolicy(policyType) {
    if (!playerId) return;
    const player = gameState.players[playerId];
    if (!player) return;
    const policy = POLICIES[policyType];
    if (!policy) return;
    if (player.gold < policy.cost) {
        alert(`❌ Không đủ vàng! Cần ${policy.cost}`);
        return;
    }
    
    player.gold -= policy.cost;
    player.policy = policyType;
    gameRef.child('players').child(playerId).update({
        gold: player.gold,
        policy: policyType,
    });
    
    alert(`✅ Đã áp dụng chính sách ${policy.name}!`);
    updateUI();
}

function researchTech(techType) {
    if (!playerId) return;
    const player = gameState.players[playerId];
    if (!player) return;
    const tech = TECHNOLOGIES[techType];
    if (!tech) return;
    if (tech.level >= tech.maxLevel) {
        alert('❌ Công nghệ đã đạt cấp tối đa!');
        return;
    }
    
    const cost = tech.cost * (tech.level + 1);
    if (player.gold < cost) {
        alert(`❌ Không đủ vàng! Cần ${cost}`);
        return;
    }
    
    player.gold -= cost;
    tech.level += 1;
    if (!player.technology) player.technology = {};
    player.technology[techType] = tech.level;
    gameRef.child('players').child(playerId).update({
        gold: player.gold,
        technology: player.technology,
    });
    
    alert(`✅ Đã nâng cấp ${tech.name} lên cấp ${tech.level}!`);
    updateUI();
}

// ==================== GAME LOOP ====================
function startGameLoop() {
    setInterval(function() {
        if (!playerId || !gameState.players[playerId]) return;
        
        gameState.gameTime += 0.1;
        const player = gameState.players[playerId];
        if (!player || !player.isAlive) return;
        
        let income = player.cities.length * 5;
        let woodIncome = player.cities.length * 2;
        let stoneIncome = player.cities.length * 1;
        
        player.cities.forEach(cityId => {
            const city = gameState.cities.find(c => c.id === cityId);
            if (city && city.buildings) {
                city.buildings.forEach(building => {
                    if (building.type === 'farm') { income += 8; woodIncome += 2; }
                    if (building.type === 'market') income += 15;
                    if (building.type === 'port') income += 20;
                    if (building.type === 'mine') income += 12;
                    if (building.type === 'sawmill') woodIncome += 10;
                    if (building.type === 'quarry') stoneIncome += 8;
                    if (building.type === 'bank') income += 30;
                });
            }
        });
        
        if (player.policy) {
            if (player.policy === 'democracy') income *= 1.2;
            if (player.policy === 'capitalism') income *= 1.5;
            if (player.policy === 'communism') { income *= 1.4; woodIncome *= 1.3; stoneIncome *= 1.3; }
            if (player.policy === 'militarism') income *= 0.7;
            if (player.policy === 'trade_union') income *= 1.6;
        }
        
        if (player.technology) {
            const agriLevel = player.technology.agriculture || 0;
            income += agriLevel * 3;
            const tradeLevel = player.technology.trade || 0;
            income *= (1 + tradeLevel * 0.05);
        }
        
        const incomePerTick = income / 10;
        const woodPerTick = woodIncome / 10;
        const stonePerTick = stoneIncome / 10;
        
        player.gold = (player.gold || 0) + incomePerTick;
        player.wood = (player.wood || 0) + woodPerTick;
        player.stone = (player.stone || 0) + stonePerTick;
        
        gameRef.child('players').child(playerId).update({
            gold: player.gold,
            wood: player.wood,
            stone: player.stone,
        });
        
        player.cities.forEach(cityId => {
            const city = gameState.cities.find(c => c.id === cityId);
            if (city) {
                let bonus = 0.02;
                if (city.buildings) {
                    city.buildings.forEach(b => {
                        if (b.type === 'barracks') bonus += 0.05;
                        if (b.type === 'stable') bonus += 0.04;
                        if (b.type === 'workshop') bonus += 0.03;
                    });
                }
                if (city.morale < 50) bonus *= 0.5;
                if (city.morale > 80) bonus *= 1.3;
                
                city.army += bonus;
                if (city.morale < 70) city.morale += 0.02;
                updateCity(city);
            }
        });
        
        updateUI();
        render();
    }, 100);
}

// ==================== VẼ ====================
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const img = new Image();
    img.src = 'map.svg';
    img.onload = function() { 
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
        drawGameElements(); 
    };
    img.onerror = function() { drawGameElements(); };
}

function drawGameElements() {
    // Moving armies
    gameState.movingArmies.forEach(army => {
        const progress = Math.min((Date.now() - army.startTime) / 3000, 1);
        const x = army.startX + (army.targetX - army.startX) * progress;
        const y = army.startY + (army.targetY - army.startY) * progress;
        const color = gameState.players[army.playerId]?.color || '#fff';
        
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`⚔️${Math.floor(army.units)}`, x, y + 28);
        ctx.fillStyle = '#ddd';
        ctx.font = '9px Arial';
        ctx.fillText(army.playerName || '', x, y - 22);
    });
    
    // Cities
    gameState.cities.forEach(city => {
        const owner = city.owner ? gameState.players[city.owner] : null;
        const color = owner ? owner.color : '#666';
        const isMine = city.owner === playerId;
        const isSelected = selectedCity && selectedCity.id === city.id;
        
        const radius = isMine ? 20 : 14;
        
        ctx.shadowColor = color;
        ctx.shadowBlur = isMine ? 25 : 10;
        ctx.beginPath();
        ctx.arc(city.x, city.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = isMine ? '#ffd700' : isSelected ? '#4ade80' : '#fff';
        ctx.lineWidth = isMine ? 3 : (isSelected ? 4 : 1.5);
        ctx.stroke();
        
        if (city.isCapital) {
            ctx.beginPath();
            ctx.arc(city.x, city.y, radius + 6, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        if (city.buildings && city.buildings.length > 0) {
            let yOffset = -radius - 30;
            city.buildings.slice(0, 4).forEach(building => {
                const bData = BUILDINGS[building.type];
                if (bData) {
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(bData.icon, city.x, city.y + yOffset);
                    yOffset -= 18;
                }
            });
            if (city.buildings.length > 4) {
                ctx.fillStyle = '#4ade80';
                ctx.font = '10px Arial';
                ctx.fillText(`+${city.buildings.length - 4}`, city.x, city.y + yOffset + 5);
            }
        }
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(city.name, city.x, city.y - radius - 12);
        
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`⚔️${Math.floor(city.army)}`, city.x, city.y + radius + 24);
        
        ctx.fillStyle = '#ffd700';
        ctx.font = '11px Arial';
        ctx.fillText(`💰${Math.floor(city.gold || 0)}`, city.x, city.y + radius + 40);
        
        // Morale bar
        const moraleWidth = 30;
        const moraleX = city.x - moraleWidth/2;
        const moraleY = city.y + radius + 52;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(moraleX, moraleY, moraleWidth, 4);
        const moraleColor = city.morale > 60 ? '#4ade80' : city.morale > 30 ? '#fbbf24' : '#e94560';
        ctx.fillStyle = moraleColor;
        ctx.fillRect(moraleX, moraleY, moraleWidth * (city.morale / 100), 4);
        
        if (owner) {
            ctx.fillStyle = '#aaa';
            ctx.font = '8px Arial';
            ctx.fillText(owner.name, city.x, city.y + radius + 62);
        }
        
        if (isSelected && isSelectingUnit) {
            ctx.beginPath();
            ctx.arc(city.x, city.y, radius + 12, 0, Math.PI * 2);
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });
    
    // UI overlay
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(10, 10, 280, 105);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    const myCities = gameState.cities.filter(c => c.owner === playerId);
    const player = gameState.players[playerId];
    ctx.fillText(`⏱️ ${Math.floor(gameState.gameTime)}s  |  👥 ${Object.keys(gameState.players).length} người`, 20, 30);
    ctx.fillText(`🏙️ ${myCities.length} thành phố  |  ⚔️ ${Math.floor(myCities.reduce((sum, c) => sum + c.army, 0))} quân`, 20, 50);
    ctx.fillText(`💰 ${Math.floor(player?.gold || 0)} vàng  |  🪵 ${Math.floor(player?.wood || 0)} gỗ  |  🪨 ${Math.floor(player?.stone || 0)} đá`, 20, 70);
    ctx.fillStyle = '#aaa';
    ctx.font = '10px Arial';
    ctx.fillText(`📜 ${player?.policy ? POLICIES[player.policy]?.name : 'Chưa có'}  |  🔬 ${player?.technology ? Object.keys(player.technology).length : 0} công nghệ`, 20, 90);
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, canvas.height - 35, 520, 28);
    ctx.fillStyle = '#aaa';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🖱️ Click: Chọn | Click phải: Xây dựng | Click thành phố khác: Tấn công | Click đất trống: Bỏ chọn', 20, canvas.height - 14);
}

// ==================== UI ====================
function updateUI() {
    if (!playerId || !gameState.players[playerId]) return;
    const player = gameState.players[playerId];
    
    document.getElementById('player-name-display').textContent = `👑 ${player.name}`;
    document.getElementById('gold-display').textContent = Math.floor(player.gold || 0);
    document.getElementById('wood-display').textContent = Math.floor(player.wood || 0);
    document.getElementById('stone-display').textContent = Math.floor(player.stone || 0);
    document.getElementById('city-count').textContent = player.cities?.length || 0;
    
    let totalArmy = 0;
    if (player.cities) {
        player.cities.forEach(cityId => {
            const city = gameState.cities.find(c => c.id === cityId);
            if (city) totalArmy += city.army;
        });
    }
    document.getElementById('army-display').textContent = Math.floor(totalArmy);
    
    const policyDisplay = document.getElementById('current-policy');
    if (player.policy) {
        const policy = POLICIES[player.policy];
        policyDisplay.textContent = `${policy.icon} ${policy.name}`;
    } else {
        policyDisplay.textContent = '📜 Chưa có';
    }
}

function updatePlayerList() {
    const list = document.getElementById('player-list');
    if (!list) return;
    
    list.innerHTML = '<div style="color:#888;font-size:11px;text-align:center;margin-bottom:4px;">👥 Người chơi</div>';
    
    const sorted = Object.values(gameState.players).sort((a, b) => (b.score || 0) - (a.score || 0));
    sorted.forEach(player => {
        const cityCount = gameState.cities.filter(c => c.owner === player.id).length;
        const isMe = player.id === playerId;
        const isConnected = !!dataChannels[player.id];
        const div = document.createElement('div');
        div.className = 'player-item';
        div.style.borderLeftColor = player.color;
        div.style.background = isMe ? 'rgba(255,215,0,0.1)' : 'transparent';
        div.innerHTML = `
            <span style="color: ${player.color};">●</span>
            ${isConnected ? '🟢' : '🟡'} 
            <strong>${player.name}</strong> ${isMe ? '⭐' : ''}
            ${player.isHost ? '👑' : ''}
            <span style="font-size:10px;color:#888;">
                🏙️${cityCount} 💰${Math.floor(player.gold || 0)}
                ${player.score ? `⭐${player.score}` : ''}
            </span>
        `;
        list.appendChild(div);
    });
}

// ==================== SỰ KIỆN CHUỘT ====================
function setupEvents() {
    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        let clickedCity = null;
        for (let city of gameState.cities) {
            const dx = x - city.x;
            const dy = y - city.y;
            if (Math.sqrt(dx*dx + dy*dy) < 30) {
                clickedCity = city;
                break;
            }
        }
        
        if (isSelectingUnit) {
            if (clickedCity) {
                if (clickedCity.owner === playerId) {
                    if (clickedCity.id !== selectedCity?.id) {
                        const units = prompt(`⚔️ Nhập số quân từ ${selectedCity?.name} đến ${clickedCity.name}:`, 
                            Math.floor(selectedCity?.army / 2 || 5));
                        if (units && !isNaN(units) && parseInt(units) > 0) {
                            const fromCity = selectedCity;
                            const toCity = clickedCity;
                            if (fromCity && fromCity.army >= parseInt(units)) {
                                fromCity.army -= parseInt(units);
                                toCity.army += parseInt(units);
                                updateCity(fromCity);
                                updateCity(toCity);
                                alert(`✅ Đã chuyển ${units} quân từ ${fromCity.name} đến ${toCity.name}`);
                            } else {
                                alert('❌ Không đủ quân!');
                            }
                        }
                    }
                } else {
                    const units = prompt(`⚔️ Nhập số quân tấn công ${clickedCity.name}:`, 
                        Math.floor(selectedCity?.army / 2 || 5));
                    if (units && !isNaN(units) && parseInt(units) > 0) {
                        invadeCity(selectedCity.id, clickedCity.id, parseInt(units));
                    }
                }
                isSelectingUnit = false;
                selectedCity = null;
                render();
                return;
            } else {
                isSelectingUnit = false;
                selectedCity = null;
                document.getElementById('info-content').innerHTML = `
                    <p style="color:#888;">Đã hủy chọn quân</p>
                `;
                render();
                return;
            }
        }
        
        if (!clickedCity) {
            selectedCity = null;
            document.getElementById('info-content').innerHTML = `
                <p style="color:#888;font-size:12px;">Click vào thành phố để quản lý</p>
                <p style="color:#555;font-size:10px;margin-top:5px;">📌 Click phải để xây dựng</p>
                <p style="color:#555;font-size:10px;">🎯 Click thành phố của bạn → "Điều quân"</p>
            `;
            render();
            return;
        }
        
        selectedCity = clickedCity;
        showCityMenu(clickedCity);
        render();
    });
    
    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (!selectedCity) {
            alert('🏗️ Vui lòng chọn một thành phố trước!');
            return;
        }
        if (selectedCity.owner !== playerId) {
            alert('❌ Đây không phải thành phố của bạn!');
            return;
        }
        showBuildMenu(selectedCity);
    });
}

// ==================== MENU ====================
function showCityMenu(city) {
    const owner = city.owner ? gameState.players[city.owner] : null;
    const isMine = city.owner === playerId;
    const player = gameState.players[playerId];
    
    let html = `
        <h4 style="color:#ffd700;font-size:14px;margin-bottom:6px;">🏙️ ${city.name}</h4>
        <p style="font-size:12px;"><strong>Quốc gia:</strong> ${owner ? owner.name : '🌿 Trống'}</p>
        <p style="font-size:12px;"><strong>Quân đội:</strong> ⚔️ ${Math.floor(city.army)}</p>
        <p style="font-size:12px;"><strong>Vàng:</strong> 💰 ${Math.floor(city.gold || 0)}</p>
        <p style="font-size:12px;"><strong>Gỗ:</strong> 🪵 ${Math.floor(city.wood || 0)}</p>
        <p style="font-size:12px;"><strong>Đá:</strong> 🪨 ${Math.floor(city.stone || 0)}</p>
        <p style="font-size:12px;"><strong>Phòng thủ:</strong> 🛡️ ${Math.floor(city.defense || 10)}</p>
        <p style="font-size:12px;"><strong>Tinh thần:</strong> ${city.morale > 60 ? '😊' : city.morale > 30 ? '😐' : '😰'} ${Math.floor(city.morale)}%</p>
        ${city.isCapital ? '<p style="color:#ffd700;font-size:12px;">⭐ Thủ đô</p>' : ''}
    `;
    
    if (city.buildings && city.buildings.length > 0) {
        html += '<hr style="border-color:#333;"><p style="color:#4ade80;font-size:12px;">🏗️ Công trình:</p><div style="display:flex;flex-wrap:wrap;gap:3px;max-height:80px;overflow-y:auto;">';
        city.buildings.forEach((b, index) => {
            const bData = BUILDINGS[b.type];
            if (bData) {
                const isMaxLevel = b.level >= bData.maxLevel;
                html += `
                    <div style="font-size:10px;background:#1a1a2e;padding:2px 6px;border-radius:4px;border:1px solid ${isMaxLevel ? '#ffd700' : '#4ade80'};display:inline-block;margin:2px;">
                        ${bData.icon} ${bData.name} 
                        <span style="color:#888;">Lv.${b.level}</span>
                        ${isMine && !isMaxLevel ? `
                            <button onclick="upgradeBuilding(${city.id}, ${index})" style="
                                background:#fbbf24;color:#1a1a2e;border:none;border-radius:2px;
                                cursor:pointer;font-size:8px;padding:1px 4px;margin-left:3px;
                            ">↑</button>
                        ` : ''}
                    </div>
                `;
            }
        });
        html += '</div>';
    }
    
    if (isMine) {
        html += `
            <hr style="border-color:#333;">
            <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px;">
                <button onclick="selectUnit(selectedCity)" style="
                    background:#4ade80;color:#1a1a2e;border:none;padding:6px;border-radius:4px;
                    cursor:pointer;font-weight:bold;font-size:12px;
                ">
                    🎯 Điều quân (Click vào đất)
                </button>
                <button onclick="showBuildMenu(selectedCity)" style="
                    background:#60a5fa;color:#fff;border:none;padding:6px;border-radius:4px;
                    cursor:pointer;font-size:12px;
                ">
                    🏗️ Xây dựng (Click phải)
                </button>
                <button onclick="recruitArmy(${city.id})" style="
                    background:#fbbf24;color:#1a1a2e;border:none;padding:6px;border-radius:4px;
                    cursor:pointer;font-size:12px;
                ">
                    ⚔️ Tuyển quân (~20 vàng)
                </button>
                <button onclick="showPolicyMenu()" style="
                    background:#a78bfa;color:#fff;border:none;padding:6px;border-radius:4px;
                    cursor:pointer;font-size:12px;
                ">
                    📜 Chính trị
                </button>
                <button onclick="showTechMenu()" style="
                    background:#f472b6;color:#fff;border:none;padding:6px;border-radius:4px;
                    cursor:pointer;font-size:12px;
                ">
                    🔬 Công nghệ
                </button>
            </div>
        `;
    } else if (city.owner && owner && city.owner !== playerId) {
        if (player && player.isAlive) {
            html += `
                <hr style="border-color:#333;">
                <button onclick="prepareInvasion()" style="
                    background:#e94560;color:#fff;border:none;padding:8px;border-radius:4px;
                    cursor:pointer;width:100%;font-weight:bold;font-size:12px;
                ">
                    ⚔️ Xâm chiếm
                </button>
            `;
        }
    }
    document.getElementById('info-content').innerHTML = html;
}

function showBuildMenu(city) {
    if (!city || city.owner !== playerId) return;
    const player = gameState.players[playerId];
    
    const categories = {
        military: '🏛️ Quân sự',
        economy: '💰 Kinh tế',
        civil: '🏥 Dân sự',
        special: '👑 Đặc biệt'
    };
    
    let html = `
        <h4 style="color:#4ade80;font-size:14px;">🏗️ Xây dựng tại ${city.name}</h4>
        <p style="font-size:11px;">💰 Vàng: ${Math.floor(player.gold)} | 🪵 Gỗ: ${Math.floor(player.wood)} | 🪨 Đá: ${Math.floor(player.stone)}</p>
        <hr style="border-color:#333;">
    `;
    
    Object.keys(categories).forEach(cat => {
        html += `<p style="color:#888;font-size:11px;margin-top:6px;">${categories[cat]}</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">`;
        Object.keys(BUILDINGS).forEach(key => {
            const b = BUILDINGS[key];
            if (b.category !== cat) return;
            
            let goldCost = b.cost;
            let woodCost = Math.floor(b.cost * 0.3);
            let stoneCost = Math.floor(b.cost * 0.2);
            if (player.technology && player.technology.science) {
                const discount = player.technology.science * 0.05;
                goldCost *= (1 - discount);
                woodCost *= (1 - discount);
                stoneCost *= (1 - discount);
            }
            goldCost = Math.floor(goldCost);
            woodCost = Math.floor(woodCost);
            stoneCost = Math.floor(stoneCost);
            
            const canAfford = player.gold >= goldCost && player.wood >= woodCost && player.stone >= stoneCost;
            html += `
                <button onclick="buildBuilding(${city.id}, '${key}')" style="
                    background:${canAfford ? '#2d2d4e' : '#1a1a2e'};
                    color:${canAfford ? '#fff' : '#555'};
                    border:1px solid ${canAfford ? '#4ade80' : '#333'};
                    padding:6px;border-radius:4px;cursor:${canAfford ? 'pointer' : 'not-allowed'};
                    font-size:9px;
                ">
                    ${b.icon} ${b.name}
                    <br><span style="font-size:7px;">💰${goldCost} 🪵${woodCost} 🪨${stoneCost}</span>
                </button>
            `;
        });
        html += '</div>';
    });
    
    document.getElementById('info-content').innerHTML = html;
}

function showPolicyMenu() {
    const player = gameState.players[playerId];
    if (!player) return;
    let html = `
        <h4 style="color:#a78bfa;font-size:14px;">📜 Chính sách</h4>
        <p style="font-size:12px;">💰 Vàng: ${Math.floor(player.gold)}</p>
        <p style="font-size:12px;">Hiện tại: ${player.policy ? POLICIES[player.policy].name : 'Chưa có'}</p>
        <hr style="border-color:#333;">
        <div style="display:flex;flex-direction:column;gap:4px;max-height:250px;overflow-y:auto;">
    `;
    Object.keys(POLICIES).forEach(key => {
        const p = POLICIES[key];
        const canAfford = player.gold >= p.cost;
        const isActive = player.policy === key;
        html += `
            <button onclick="changePolicy('${key}')" style="
                background:${isActive ? '#4ade80' : (canAfford ? '#2d2d4e' : '#1a1a2e')};
                color:${isActive ? '#1a1a2e' : (canAfford ? '#fff' : '#555')};
                border:2px solid ${isActive ? '#4ade80' : (canAfford ? '#a78bfa' : '#333')};
                padding:6px;border-radius:4px;cursor:${canAfford ? 'pointer' : 'not-allowed'};
                text-align:left;font-size:11px;
            ">
                ${p.icon} ${p.name} ${isActive ? '✅' : ''}
                <br><span style="font-size:9px;color:#888;">${p.effect}</span>
                <br><span style="font-size:8px;">💰${p.cost}</span>
            </button>
        `;
    });
    html += '</div>';
    document.getElementById('info-content').innerHTML = html;
}

function showTechMenu() {
    const player = gameState.players[playerId];
    if (!player) return;
    let html = `
        <h4 style="color:#fbbf24;font-size:14px;">🔬 Công nghệ</h4>
        <p style="font-size:12px;">💰 Vàng: ${Math.floor(player.gold)}</p>
        <hr style="border-color:#333;">
        <div style="display:flex;flex-direction:column;gap:4px;max-height:250px;overflow-y:auto;">
    `;
    Object.keys(TECHNOLOGIES).forEach(key => {
        const t = TECHNOLOGIES[key];
        const cost = t.cost * (t.level + 1);
        const canAfford = player.gold >= cost;
        const isMax = t.level >= t.maxLevel;
        html += `
            <button onclick="researchTech('${key}')" style="
                background:${canAfford && !isMax ? '#2d2d4e' : '#1a1a2e'};
                color:${canAfford && !isMax ? '#fff' : '#555'};
                border:1px solid ${canAfford && !isMax ? '#fbbf24' : '#333'};
                padding:6px;border-radius:4px;cursor:${canAfford && !isMax ? 'pointer' : 'not-allowed'};
                text-align:left;font-size:11px;
            ">
                ${t.icon} ${t.name} - Cấp ${t.level}/${t.maxLevel}
                <br><span style="font-size:9px;color:#888;">${t.effect}</span>
                <br><span style="font-size:8px;">💰${cost}</span>
                ${isMax ? ' ✅ MAX' : ''}
            </button>
        `;
    });
    html += '</div>';
    document.getElementById('info-content').innerHTML = html;
}

function prepareInvasion() {
    if (!selectedCity) return;
    const city = selectedCity;
    const player = gameState.players[playerId];
    if (!player) return;
    
    let myCities = gameState.cities.filter(c => c.owner === playerId && c.id !== city.id);
    if (myCities.length === 0) {
        alert('❌ Bạn không có thành phố nào để gửi quân!');
        return;
    }
    
    let html = `
        <h4 style="color:#e94560;font-size:14px;">⚔️ Xâm chiếm ${city.name}</h4>
        <p style="font-size:12px;">Chọn thành phố gửi quân:</p>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto;">
    `;
    myCities.forEach(c => {
        html += `
            <button onclick="showInvasionAmount(${c.id}, ${city.id})" style="
                background:#2d2d4e;color:#fff;border:1px solid #e94560;
                padding:6px;border-radius:4px;cursor:pointer;text-align:left;font-size:11px;
            ">
                🏙️ ${c.name} - ⚔️${Math.floor(c.army)} 💰${Math.floor(c.gold || 0)}
            </button>
        `;
    });
    html += '</div>';
    document.getElementById('info-content').innerHTML = html;
}

function showInvasionAmount(fromCityId, toCityId) {
    const fromCity = gameState.cities.find(c => c.id === fromCityId);
    if (!fromCity) return;
    let html = `
        <h4 style="color:#e94560;font-size:14px;">⚔️ Xâm chiếm</h4>
        <p style="font-size:12px;">Từ: ${fromCity.name} (⚔️${Math.floor(fromCity.army)})</p>
        <p style="font-size:12px;">Đến: ${gameState.cities.find(c => c.id === toCityId)?.name}</p>
        <hr style="border-color:#333;">
        <p style="font-size:12px;">Nhập số quân tấn công:</p>
        <input id="invasion-units" type="number" value="${Math.floor(fromCity.army / 2)}" 
               min="1" max="${Math.floor(fromCity.army)}" 
               style="width:100%;padding:6px;margin:6px 0;background:#1a1a2e;color:#fff;border:1px solid #e94560;border-radius:4px;font-size:12px;">
        <button onclick="executeInvasion(${fromCityId}, ${toCityId})" style="
            background:#e94560;color:#fff;border:none;padding:8px;border-radius:4px;
            cursor:pointer;width:100%;font-weight:bold;font-size:12px;
        ">
            ⚔️ Tấn công!
        </button>
    `;
    document.getElementById('info-content').innerHTML = html;
}

function executeInvasion(fromCityId, toCityId) {
    const input = document.getElementById('invasion-units');
    const units = parseInt(input.value);
    if (!units || units <= 0) {
        alert('❌ Số quân không hợp lệ!');
        return;
    }
    invadeCity(fromCityId, toCityId, units);
}

function selectUnit(city) {
    if (!city || city.owner !== playerId) {
        alert('❌ Đây không phải thành phố của bạn!');
        return;
    }
    if (city.army < 1) {
        alert('❌ Không có quân để điều!');
        return;
    }
    
    selectedCity = city;
    isSelectingUnit = true;
    document.getElementById('info-content').innerHTML = `
        <h4 style="color:#4ade80;font-size:14px;">🎯 Đang chọn quân</h4>
        <p style="font-size:12px;">Từ: ${city.name} (⚔️${Math.floor(city.army)})</p>
        <p style="font-size:12px;color:#fbbf24;">Click vào một thành phố khác để di chuyển</p>
        <p style="font-size:11px;color:#888;">Click vào đất trống để bỏ chọn</p>
    `;
    render();
}

// ==================== GLOBAL ====================
window.buildBuilding = buildBuilding;
window.upgradeBuilding = upgradeBuilding;
window.changePolicy = changePolicy;
window.researchTech = researchTech;
window.recruitArmy = recruitArmy;
window.selectUnit = selectUnit;
window.showBuildMenu = showBuildMenu;
window.showPolicyMenu = showPolicyMenu;
window.showTechMenu = showTechMenu;
window.prepareInvasion = prepareInvasion;
window.showInvasionAmount = showInvasionAmount;
window.executeInvasion = executeInvasion;
window.selectedCity = () => selectedCity;

// ==================== KHỞI TẠO ====================
window.onload = function() {
    console.log('🎮 AoH RTS - Đang khởi tạo...');
    setupLogin();
    setupEvents();
    loadMap();
};
