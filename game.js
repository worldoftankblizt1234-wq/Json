// ============================================
// 🎮 GAME.JS - Login + Firebase + WebRTC P2P
// ============================================

// ==================== CẤU HÌNH ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Firebase từ firebase-config.js
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

let gameState = {
    cities: [],
    players: {},
    movingArmies: [],
    messages: [],
    gameTime: 0,
    isRunning: true,
};

let selectedCity = null;
let peerConnections = {};
let dataChannels = {};

// ==================== BUILDINGS, POLICIES, TECHNOLOGIES ====================
const BUILDINGS = {
    barracks: { name: 'Doanh trại', cost: 50, icon: '🏛️', effect: 'Tăng sản xuất quân 2x', color: '#e94560' },
    farm: { name: 'Trang trại', cost: 30, icon: '🌾', effect: 'Tăng vàng +5/giây', color: '#4ade80' },
    wall: { name: 'Tường thành', cost: 80, icon: '🧱', effect: 'Phòng thủ +50%', color: '#60a5fa' },
    market: { name: 'Chợ', cost: 40, icon: '🏪', effect: 'Thương mại +10/giây', color: '#fbbf24' },
    temple: { name: 'Đền thờ', cost: 60, icon: '⛪', effect: 'Tinh thần +20%', color: '#a78bfa' },
    port: { name: 'Cảng', cost: 70, icon: '⚓', effect: 'Xuất khẩu +15/giây', color: '#34d399' },
    mine: { name: 'Mỏ vàng', cost: 45, icon: '⛏️', effect: 'Vàng +8/giây', color: '#f472b6' },
};

const POLICIES = {
    democracy: { name: 'Dân chủ', cost: 100, icon: '🗳️', effect: 'Tăng vàng +20%, giảm quân 10%' },
    monarchy: { name: 'Quân chủ', cost: 80, icon: '👑', effect: 'Tăng quân +30%, giảm vàng 10%' },
    communism: { name: 'Cộng sản', cost: 120, icon: '⚒️', effect: 'Sản xuất +40%, thương mại -20%' },
    capitalism: { name: 'Tư bản', cost: 150, icon: '💰', effect: 'Thương mại +50%, quân -20%' },
    theocracy: { name: 'Thần quyền', cost: 90, icon: '⛪', effect: 'Tinh thần +50%, công nghệ -20%' },
    federation: { name: 'Liên bang', cost: 130, icon: '🤝', effect: 'Phòng thủ +30%, ngoại giao +20%' },
};

const TECHNOLOGIES = {
    agriculture: { name: 'Nông nghiệp', cost: 50, icon: '🌾', effect: 'Vàng +5/giây', level: 0, maxLevel: 5 },
    military: { name: 'Quân sự', cost: 60, icon: '⚔️', effect: 'Sức mạnh quân +10%', level: 0, maxLevel: 5 },
    trade: { name: 'Thương mại', cost: 70, icon: '📦', effect: 'Thương mại +15%', level: 0, maxLevel: 5 },
    defense: { name: 'Phòng thủ', cost: 80, icon: '🛡️', effect: 'Phòng thủ +20%', level: 0, maxLevel: 5 },
    science: { name: 'Khoa học', cost: 100, icon: '🔬', effect: 'Giảm chi phí xây dựng 10%', level: 0, maxLevel: 5 },
    diplomacy: { name: 'Ngoại giao', cost: 90, icon: '🤝', effect: 'Quan hệ +20%', level: 0, maxLevel: 5 },
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
            buildings: [],
            isCapital: burg.capital === 1,
            defense: 10,
            type: burg.type || 'Generic',
        }));
        
        render();
        updateUI();
    } catch (error) {
        console.error('❌ Lỗi tải map:', error);
    }
}

// ==================== LOGIN HANDLER ====================
function setupLogin() {
    const loginBtn = document.getElementById('login-btn');
    const modeSelect = document.getElementById('game-mode');
    const roomIdGroup = document.getElementById('room-id-group');
    
    modeSelect.addEventListener('change', () => {
        roomIdGroup.style.display = modeSelect.value === 'join' ? 'block' : 'none';
    });
    
    loginBtn.addEventListener('click', async () => {
        playerName = document.getElementById('player-name').value.trim() || 'Chiến Binh';
        playerColor = document.getElementById('player-color').value;
        const mode = document.getElementById('game-mode').value;
        
        if (mode === 'join') {
            roomId = document.getElementById('room-id').value.trim();
            if (!roomId) {
                alert('❌ Vui lòng nhập mã phòng!');
                return;
            }
        } else {
            roomId = generateRoomId();
        }
        
        loginBtn.disabled = true;
        loginBtn.textContent = '⏳ Đang kết nối...';
        
        await initFirebase();
        await joinGame();
        
        // Ẩn màn hình login
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('game-container').classList.add('active');
        
        loginBtn.disabled = false;
        loginBtn.textContent = '🚀 Vào game';
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

// ==================== FIREBASE INIT ====================
function initFirebase() {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
        script.onload = () => {
            const script2 = document.createElement('script');
            script2.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js';
            script2.onload = () => {
                firebase.initializeApp(firebaseConfig);
                db = firebase.database();
                gameRef = db.ref(`games/${roomId}`);
                console.log('🔥 Firebase đã kết nối!');
                resolve();
            };
            document.head.appendChild(script2);
        };
        document.head.appendChild(script);
    });
}

// ==================== JOIN GAME ====================
async function joinGame() {
    playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Kiểm tra phòng
    const snapshot = await gameRef.once('value');
    const roomData = snapshot.val();
    
    if (roomData) {
        // Phòng đã tồn tại - join
        isHost = false;
        gameState.players = roomData.players || {};
        gameState.cities = roomData.cities || gameState.cities;
    } else {
        // Tạo phòng mới
        isHost = true;
        gameState.players = {};
        
        // Khởi tạo dữ liệu phòng
        await gameRef.set({
            roomId: roomId,
            hostId: playerId,
            createdAt: Date.now(),
            players: {},
            cities: gameState.cities,
            movingArmies: [],
            messages: [],
        });
    }
    
    // Đăng ký người chơi
    const playerData = {
        id: playerId,
        name: playerName,
        color: playerColor,
        gold: 300,
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
        playerData.cities.push(unownedCity.id);
        updateCity(unownedCity);
    }
    
    await gameRef.child('players').child(playerId).set(playerData);
    
    // Lắng nghe thay đổi
    listenToGameChanges();
    
    // Khởi tạo WebRTC P2P
    initWebRTC();
    
    // Bắt đầu game loop
    startGameLoop();
    
    // Cập nhật UI
    document.getElementById('room-info').innerHTML = `
        🔗 Mã phòng: <span style="color:#4ade80;font-weight:bold;">${roomId}</span>
        ${isHost ? ' (👑 Chủ phòng)' : ''}
        <br>👥 Đang có ${Object.keys(gameState.players).length} người chơi
    `;
}

// ==================== LẮNG NGHE FIREBASE ====================
function listenToGameChanges() {
    // Players
    gameRef.child('players').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            gameState.players = data;
            updatePlayerList();
            updateUI();
            render();
            // Cập nhật kết nối P2P
            updatePeerConnections();
        }
    });
    
    // Cities
    gameRef.child('cities').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                const cityData = data[key];
                const localCity = gameState.cities.find(c => c.id == key);
                if (localCity) {
                    localCity.owner = cityData.owner;
                    localCity.army = cityData.army || 0;
                    localCity.gold = cityData.gold || 0;
                    localCity.buildings = cityData.buildings || [];
                    localCity.defense = cityData.defense || 10;
                }
            });
            render();
            updateUI();
        }
    });
    
    // Moving Armies
    gameRef.child('movingArmies').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            gameState.movingArmies = Object.values(data);
            render();
        }
    });
    
    // Messages
    gameRef.child('messages').limitToLast(50).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            gameState.messages = Object.values(data);
            updateChat();
        }
    });
}

// ==================== WEBSOCKET / WEBRTC P2P ====================
function initWebRTC() {
    const config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]
    };
    
    // Kết nối với tất cả người chơi khác
    Object.keys(gameState.players).forEach(pid => {
        if (pid !== playerId) {
            createPeerConnection(pid, config);
        }
    });
}

function createPeerConnection(targetId, config) {
    const pc = new RTCPeerConnection(config);
    peerConnections[targetId] = pc;
    
    // Data channel
    const channel = pc.createDataChannel(`game-channel-${playerId}-${targetId}`);
    channel.onopen = () => {
        console.log(`✅ P2P kết nối với ${targetId}`);
        dataChannels[targetId] = channel;
    };
    channel.onmessage = (e) => {
        const data = JSON.parse(e.data);
        handlePeerMessage(data, targetId);
    };
    
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            gameRef.child('signaling').child(targetId).child(playerId).set({
                candidate: event.candidate,
                from: playerId,
            });
        }
    };
    
    // Lắng nghe offer từ peer
    gameRef.child('signaling').child(playerId).child(targetId).on('value', async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        
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
            } catch (e) {}
        }
    });
    
    // Nếu là host, tạo offer
    if (isHost && playerId < targetId) {
        setTimeout(async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            gameRef.child('signaling').child(targetId).child(playerId).set({
                offer: offer,
                from: playerId,
            });
        }, 1000);
    }
}

function updatePeerConnections() {
    const currentPlayers = Object.keys(gameState.players);
    Object.keys(peerConnections).forEach(pid => {
        if (!currentPlayers.includes(pid)) {
            peerConnections[pid].close();
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
    console.log(`📨 P2P từ ${fromId}:`, data);
    
    switch (data.type) {
        case 'move_army':
            // Xử lý di chuyển quân từ peer
            const fromCity = gameState.cities.find(c => c.id === data.fromCityId);
            const toCity = gameState.cities.find(c => c.id === data.toCityId);
            if (fromCity && toCity) {
                fromCity.army -= data.units;
                updateCity(fromCity);
                // Thêm vào movingArmies
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

function sendPeerMessage(targetId, data) {
    const channel = dataChannels[targetId];
    if (channel && channel.readyState === 'open') {
        channel.send(JSON.stringify(data));
    }
}

function broadcastToPeers(data) {
    Object.keys(dataChannels).forEach(pid => {
        sendPeerMessage(pid, data);
    });
}

// ==================== UPDATE CITY ====================
function updateCity(city) {
    const cityRef = gameRef.child('cities').child(city.id);
    cityRef.set({
        id: city.id,
        name: city.name,
        x: city.x,
        y: city.y,
        owner: city.owner,
        army: Math.floor(city.army),
        gold: Math.floor(city.gold || 0),
        buildings: city.buildings || [],
        defense: Math.floor(city.defense || 10),
        isCapital: city.isCapital || false,
        population: Math.floor(city.population || 1000),
    });
}

// ==================== XÂM CHIẾM (P2P) ====================
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
    
    // Trừ quân
    fromCity.army -= units;
    updateCity(fromCity);
    
    // Gửi P2P cho tất cả
    broadcastToPeers({
        type: 'move_army',
        playerId: playerId,
        fromCityId: fromCityId,
        toCityId: toCityId,
        units: units,
    });
    
    // Tạo moving army
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
    
    // Xử lý sau 3s
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
    
    if (city.buildings) {
        city.buildings.forEach(b => {
            if (b.type === 'wall') defenseStrength *= 1.5;
        });
    }
    
    if (attackStrength > defenseStrength) {
        // THẮNG
        const oldOwner = city.owner;
        city.owner = attackerId;
        city.army = Math.floor(attackStrength - defenseStrength * 0.5);
        city.gold = Math.floor(city.gold * 0.6);
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
        
        const msg = {
            text: `🏰 ${attacker?.name || 'Ai đó'} đã chiếm ${city.name}!`,
            time: Date.now(),
            type: 'system',
        };
        gameRef.child('messages').push(msg);
        
        // P2P broadcast
        broadcastToPeers({
            type: 'city_captured',
            cityId: city.id,
            newOwner: attackerId,
            army: city.army,
        });
        
    } else {
        // THUA
        city.army = Math.floor(defenseStrength - attackStrength * 0.3);
        updateCity(city);
        
        if (attacker) {
            attacker.gold -= 20;
            gameRef.child('players').child(attackerId).update({ gold: attacker.gold });
        }
        
        const msg = {
            text: `💀 ${attacker?.name || 'Ai đó'} thất bại khi tấn công ${city.name}!`,
            time: Date.now(),
            type: 'system',
        };
        gameRef.child('messages').push(msg);
    }
}

// ==================== GAME LOOP ====================
function startGameLoop() {
    setInterval(() => {
        if (!playerId || !gameState.players[playerId]) return;
        
        gameState.gameTime += 0.1;
        const player = gameState.players[playerId];
        if (!player || !player.isAlive) return;
        
        // Tính thu nhập
        let income = player.cities.length * 5;
        player.cities.forEach(cityId => {
            const city = gameState.cities.find(c => c.id === cityId);
            if (city && city.buildings) {
                city.buildings.forEach(building => {
                    if (building.type === 'farm') income += 3;
                    if (building.type === 'market') income += 5;
                    if (building.type === 'port') income += 7;
                    if (building.type === 'mine') income += 8;
                });
            }
        });
        
        if (player.policy) {
            if (player.policy === 'democracy') income *= 1.2;
            if (player.policy === 'capitalism') income *= 1.5;
            if (player.policy === 'communism') income *= 1.4;
        }
        
        if (player.technology) {
            const agriLevel = player.technology.agriculture || 0;
            income += agriLevel * 2;
        }
        
        const incomePerTick = income / 10;
        player.gold = (player.gold || 0) + incomePerTick;
        gameRef.child('players').child(playerId).update({ gold: player.gold });
        
        // Tự động tăng quân
        player.cities.forEach(cityId => {
            const city = gameState.cities.find(c => c.id === cityId);
            if (city) {
                let bonus = 0.02;
                if (city.buildings) {
                    city.buildings.forEach(b => {
                        if (b.type === 'barracks') bonus += 0.05;
                    });
                }
                city.army += bonus;
                updateCity(city);
            }
        });
        
        updateUI();
        render();
    }, 100);
}

// ==================== VẼ BẢN ĐỒ ====================
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const img = new Image();
    img.src = 'map.svg';
    img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); drawGameElements(); };
    img.onerror = () => drawGameElements();
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
    });
    
    // Cities
    gameState.cities.forEach(city => {
        const owner = city.owner ? gameState.players[city.owner] : null;
        const color = owner ? owner.color : '#666';
        const isMine = city.owner === playerId;
        
        const radius = isMine ? 18 : 13;
        ctx.shadowColor = color;
        ctx.shadowBlur = isMine ? 20 : 10;
        ctx.beginPath();
        ctx.arc(city.x, city.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isMine ? '#ffd700' : '#fff';
        ctx.lineWidth = isMine ? 3 : 1.5;
        ctx.stroke();
        
        if (city.isCapital) {
            ctx.beginPath();
            ctx.arc(city.x, city.y, radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Buildings
        if (city.buildings && city.buildings.length > 0) {
            let yOffset = -radius - 28;
            city.buildings.slice(0, 3).forEach(building => {
                const bData = BUILDINGS[building.type];
                if (bData) {
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(bData.icon, city.x, city.y + yOffset);
                    yOffset -= 18;
                }
            });
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
        
        if (owner) {
            ctx.fillStyle = '#aaa';
            ctx.font = '9px Arial';
            ctx.fillText(owner.name, city.x, city.y + radius + 56);
        }
        
        if (selectedCity && selectedCity.id === city.id) {
            ctx.beginPath();
            ctx.arc(city.x, city.y, radius + 10, 0, Math.PI * 2);
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });
    
    // UI
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(10, 10, 220, 90);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`⏱️ ${Math.floor(gameState.gameTime)}s`, 20, 30);
    ctx.fillText(`👥 ${Object.keys(gameState.players).length} người chơi`, 20, 48);
    const myCities = gameState.cities.filter(c => c.owner === playerId);
    ctx.fillText(`🏙️ ${myCities.length} thành phố`, 20, 66);
    ctx.fillText(`⚔️ Tổng: ${Math.floor(myCities.reduce((sum, c) => sum + c.army, 0))}`, 20, 84);
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, canvas.height - 35, 400, 28);
    ctx.fillStyle = '#aaa';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🖱️ Click: Chọn | Click phải: Xây dựng | Click thành phố khác: Tấn công', 20, canvas.height - 14);
}

// ==================== UI ====================
function updateUI() {
    if (!playerId || !gameState.players[playerId]) return;
    const player = gameState.players[playerId];
    
    document.getElementById('player-name-display').textContent = `👑 ${player.name}`;
    document.getElementById('gold-display').textContent = Math.floor(player.gold || 0);
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
    
    list.innerHTML = '<div style="color:#888;font-size:12px;text-align:center;margin-bottom:8px;">👥 Người chơi (P2P)</div>';
    
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

function updateChat() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    container.innerHTML = '';
    if (gameState.messages) {
        gameState.messages.slice(-30).forEach(msg => {
            const div = document.createElement('div');
            div.className = 'chat-message';
            if (msg.type === 'system') {
                div.style.color = '#ffd700';
                div.style.fontStyle = 'italic';
                div.textContent = `📢 ${msg.text}`;
            } else {
                const player = gameState.players[msg.playerId];
                const color = player ? player.color : '#fff';
                div.innerHTML = `<span style="color: ${color};">${msg.playerName}:</span> ${msg.text}`;
            }
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !playerId) return;
    
    const msg = {
        playerId: playerId,
        playerName: playerName,
        text: text,
        time: Date.now(),
        type: 'chat',
    };
    gameRef.child('messages').push(msg);
    input.value = '';
}

// ==================== XÂY DỰNG, CHÍNH TRỊ, CÔNG NGHỆ ====================
function buildBuilding(cityId, buildingType) {
    if (!playerId) return;
    const player = gameState.players[playerId];
    if (!player) return;
    const city = gameState.cities.find(c => c.id === cityId);
    if (!city || city.owner !== playerId) return;
    
    const building = BUILDINGS[buildingType];
    let cost = building.cost;
    if (player.technology && player.technology.science) {
        cost *= (1 - player.technology.science * 0.05);
    }
    cost = Math.floor(cost);
    
    if (player.gold < cost) {
        alert(`❌ Không đủ vàng! Cần ${cost}`);
        return;
    }
    
    player.gold -= cost;
    gameRef.child('players').child(playerId).update({ gold: player.gold });
    
    const newBuilding = {
        id: `build_${Date.now()}`,
        type: buildingType,
        name: building.name,
        icon: building.icon,
        builtAt: Date.now(),
        level: 1,
    };
    if (!city.buildings) city.buildings = [];
    city.buildings.push(newBuilding);
    updateCity(city);
    
    const msg = {
        text: `🏗️ ${playerName} đã xây ${building.name} tại ${city.name}!`,
        time: Date.now(),
        type: 'system',
    };
    gameRef.child('messages').push(msg);
    alert(`✅ Đã xây ${building.name} thành công!`);
    render();
    updateUI();
}

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
    
    const msg = {
        text: `📜 ${playerName} đã áp dụng chính sách ${policy.name}!`,
        time: Date.now(),
        type: 'system',
    };
    gameRef.child('messages').push(msg);
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
    
    const msg = {
        text: `🔬 ${playerName} đã nâng cấp ${tech.name} lên cấp ${tech.level}!`,
        time: Date.now(),
        type: 'system',
    };
    gameRef.child('messages').push(msg);
    alert(`✅ Đã nâng cấp ${tech.name} lên cấp ${tech.level}!`);
    updateUI();
}

// ==================== MENU HIỂN THỊ ====================
function showCityMenu(city) {
    const owner = city.owner ? gameState.players[city.owner] : null;
    const isMine = city.owner === playerId;
    const player = gameState.players[playerId];
    
    let html = `
        <h4 style="color:#ffd700;">🏙️ ${city.name}</h4>
        <p><strong>Quốc gia:</strong> ${owner ? owner.name : '🌿 Trống'}</p>
        <p><strong>Quân đội:</strong> ⚔️ ${Math.floor(city.army)}</p>
        <p><strong>Vàng:</strong> 💰 ${Math.floor(city.gold || 0)}</p>
        <p><strong>Phòng thủ:</strong> 🛡️ ${Math.floor(city.defense || 10)}</p>
        ${city.isCapital ? '<p style="color:#ffd700;">⭐ Thủ đô</p>' : ''}
    `;
    
    if (city.buildings && city.buildings.length > 0) {
        html += '<hr><p style="color:#4ade80;">🏗️ Công trình:</p><div style="display:flex;flex-wrap:wrap;gap:3px;">';
        city.buildings.forEach(b => {
            const bData = BUILDINGS[b.type];
            if (bData) {
                html += `<span style="font-size:12px;background:#1a1a2e;padding:2px 6px;border-radius:4px;">${bData.icon} ${bData.name}</span> `;
            }
        });
        html += '</div>';
    }
    
    if (isMine) {
        html += `
            <hr>
            <div style="display:flex;flex-direction:column;gap:5px;margin-top:10px;">
                <button onclick="showBuildMenu(selectedCity)" style="background:#4ade80;color:#1a1a2e;border:none;padding:8px;border-radius:4px;cursor:pointer;font-weight:bold;">🏗️ Xây dựng (Click phải)</button>
                <button onclick="recruitArmy(${city.id})" style="background:#60a5fa;color:#fff;border:none;padding:8px;border-radius:4px;cursor:pointer;">⚔️ Tuyển quân</button>
                <button onclick="showPolicyMenu()" style="background:#a78bfa;color:#fff;border:none;padding:8px;border-radius:4px;cursor:pointer;">📜 Chính trị</button>
                <button onclick="showTechMenu()" style="background:#fbbf24;color:#1a1a2e;border:none;padding:8px;border-radius:4px;cursor:pointer;">🔬 Công nghệ</button>
            </div>
        `;
    } else if (city.owner && owner && city.owner !== playerId) {
        if (player && player.isAlive) {
            html += `
                <hr>
                <button onclick="prepareInvasion()" style="background:#e94560;color:#fff;border:none;padding:10px;border-radius:4px;cursor:pointer;width:100%;font-weight:bold;">⚔️ Xâm chiếm</button>
            `;
        }
    }
    document.getElementById('info-content').innerHTML = html;
}

function showBuildMenu(city) {
    if (!city || city.owner !== playerId) return;
    const player = gameState.players[playerId];
    let html = `
        <h4 style="color:#4ade80;">🏗️ Xây dựng tại ${city.name}</h4>
        <p>💰 Vàng: ${Math.floor(player.gold)}</p>
        <hr>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
    `;
    Object.keys(BUILDINGS).forEach(key => {
        const b = BUILDINGS[key];
        let cost = b.cost;
        if (player.technology && player.technology.science) {
            cost *= (1 - player.technology.science * 0.05);
        }
        cost = Math.floor(cost);
        const canAfford = player.gold >= cost;
        html += `
            <button onclick="buildBuilding(${city.id}, '${key}')" style="
                background:${canAfford ? '#2d2d4e' : '#1a1a2e'};
                color:${canAfford ? '#fff' : '#555'};
                border:1px solid ${canAfford ? '#4ade80' : '#333'};
                padding:8px;border-radius:4px;cursor:${canAfford ? 'pointer' : 'not-allowed'};
                font-size:11px;
            ">
                ${b.icon} ${b.name}
                <br><span style="font-size:9px;">💰${cost}</span>
            </button>
        `;
    });
    html += '</div>';
    document.getElementById('info-content').innerHTML = html;
}

function showPolicyMenu() {
    const player = gameState.players[playerId];
    if (!player) return;
    let html = `
        <h4 style="color:#a78bfa;">📜 Chính sách</h4>
        <p>💰 Vàng: ${Math.floor(player.gold)}</p>
        <p>Hiện tại: ${player.policy ? POLICIES[player.policy].name : 'Chưa có'}</p>
        <hr>
        <div style="display:flex;flex-direction:column;gap:5px;max-height:300px;overflow-y:auto;">
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
                padding:8px;border-radius:4px;cursor:${canAfford ? 'pointer' : 'not-allowed'};
                text-align:left;
            ">
                ${p.icon} ${p.name} ${isActive ? '✅' : ''}
                <br><span style="font-size:10px;color:#888;">${p.effect}</span>
                <br><span style="font-size:9px;">💰${p.cost}</span>
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
        <h4 style="color:#fbbf24;">🔬 Công nghệ</h4>
        <p>💰 Vàng: ${Math.floor(player.gold)}</p>
        <hr>
        <div style="display:flex;flex-direction:column;gap:5px;max-height:300px;overflow-y:auto;">
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
                padding:8px;border-radius:4px;cursor:${canAfford && !isMax ? 'pointer' : 'not-allowed'};
                text-align:left;
            ">
                ${t.icon} ${t.name} - Cấp ${t.level}/${t.maxLevel}
                <br><span style="font-size:10px;color:#888;">${t.effect}</span>
                <br><span style="font-size:9px;">💰${cost}</span>
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
        <h4 style="color:#e94560;">⚔️ Xâm chiếm ${city.name}</h4>
        <p>Chọn thành phố gửi quân:</p>
        <div style="display:flex;flex-direction:column;gap:5px;max-height:200px;overflow-y:auto;">
    `;
    myCities.forEach(c => {
        html += `
            <button onclick="showInvasionAmount(${c.id}, ${city.id})" style="
                background:#2d2d4e;color:#fff;border:1px solid #e94560;
                padding:8px;border-radius:4px;cursor:pointer;text-align:left;
            ">
                🏙️ ${c.name} - ⚔️${Math.floor(c.army)}
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
        <h4 style="color:#e94560;">⚔️ Xâm chiếm</h4>
        <p>Từ: ${fromCity.name} (⚔️${Math.floor(fromCity.army)})</p>
        <p>Đến: ${gameState.cities.find(c => c.id === toCityId)?.name}</p>
        <hr>
        <p>Nhập số quân tấn công:</p>
        <input id="invasion-units" type="number" value="${Math.floor(fromCity.army / 2)}" 
               min="1" max="${Math.floor(fromCity.army)}" 
               style="width:100%;padding:8px;margin:10px 0;background:#1a1a2e;color:#fff;border:1px solid #e94560;border-radius:4px;">
        <button onclick="executeInvasion(${fromCityId}, ${toCityId})" style="
            background:#e94560;color:#fff;border:none;padding:10px;border-radius:4px;
            cursor:pointer;width:100%;font-weight:bold;
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

// ==================== SỰ KIỆN CHUỘT ====================
function setupEvents() {
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        let clickedCity = null;
        for (let city of gameState.cities) {
            const dx = x - city.x;
            const dy = y - city.y;
            if (Math.sqrt(dx*dx + dy*dy) < 25) {
                clickedCity = city;
                break;
            }
        }
        
        if (!clickedCity) {
            selectedCity = null;
            document.getElementById('info-content').innerHTML = `
                <p style="color:#888;">Click vào thành phố để quản lý</p>
                <p style="font-size:11px;color:#555;">📌 Click phải để mở menu xây dựng</p>
            `;
            render();
            return;
        }
        
        if (selectedCity && selectedCity.id === clickedCity.id) {
            showCityMenu(clickedCity);
            render();
            return;
        }
        
        if (selectedCity && selectedCity.owner === playerId && clickedCity.owner !== playerId) {
            const units = prompt(`⚔️ Nhập số quân tấn công ${clickedCity.name}:`, Math.floor(selectedCity.army / 2));
            if (units && !isNaN(units) && parseInt(units) > 0) {
                invadeCity(selectedCity.id, clickedCity.id, parseInt(units));
            }
            selectedCity = clickedCity;
            showCityMenu(clickedCity);
            render();
            return;
        }
        
        selectedCity = clickedCity;
        showCityMenu(clickedCity);
        render();
    });
    
    canvas.addEventListener('contextmenu', (e) => {
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

// ==================== GLOBAL FUNCTIONS ====================
window.buildBuilding = buildBuilding;
window.changePolicy = changePolicy;
window.researchTech = researchTech;
window.recruitArmy = recruitArmy;
window.showBuildMenu = showBuildMenu;
window.showPolicyMenu = showPolicyMenu;
window.showTechMenu = showTechMenu;
window.prepareInvasion = prepareInvasion;
window.showInvasionAmount = showInvasionAmount;
window.executeInvasion = executeInvasion;
window.sendChatMessage = sendChatMessage;
window.selectedCity = () => selectedCity;

// ==================== KHỞI TẠO ====================
window.onload = function() {
    console.log('🎮 RTS Full - Đang khởi tạo...');
    setupLogin();
    setupEvents();
    loadMap();
    
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
};
