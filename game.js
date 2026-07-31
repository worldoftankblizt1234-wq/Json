// ============================================
// 🎮 GAME.JS - RTS FULL với Firebase
// ============================================

// ==================== CẤU HÌNH ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCGXq3xpUv_qaH5R7RB9LlJwsnVhrlewoA",
    authDomain: "country-61ecf.firebaseapp.com",
    projectId: "country-61ecf",
    storageBucket: "country-61ecf.firebasestorage.app",
    messagingSenderId: "91679803947",
    appId: "1:91679803947:web:4700703e957e9c1b1cb86e",
    measurementId: "G-XQFVPJLF7R"
};

// ==================== GAME STATE ====================
let playerId = null;
let playerName = 'Chiến Binh';
let mapData = null;
let db = null;
let gameRef = null;

let gameState = {
    cities: [],
    players: {},
    buildings: [],
    armies: [],
    movingArmies: [],
    technologies: {},
    politics: {},
    resources: {},
    gameTime: 0,
    isRunning: true,
};

let selectedCity = null;
let selectedBuilding = null;
let selectedArmy = null;
let isBuildingMode = false;
let buildingType = null;

// Danh sách công trình có thể xây
const BUILDINGS = {
    barracks: {
        name: 'Doanh trại',
        cost: 50,
        icon: '🏛️',
        effect: 'Tăng sản xuất quân 2x',
        buildTime: 5000,
    },
    farm: {
        name: 'Trang trại',
        cost: 30,
        icon: '🌾',
        effect: 'Tăng vàng +5/giây',
        buildTime: 3000,
    },
    wall: {
        name: 'Tường thành',
        cost: 80,
        icon: '🧱',
        effect: 'Phòng thủ +50%',
        buildTime: 8000,
    },
    market: {
        name: 'Chợ',
        cost: 40,
        icon: '🏪',
        effect: 'Thương mại +10/giây',
        buildTime: 4000,
    },
    temple: {
        name: 'Đền thờ',
        cost: 60,
        icon: '⛪',
        effect: 'Tinh thần +20%',
        buildTime: 6000,
    },
    port: {
        name: 'Cảng',
        cost: 70,
        icon: '⚓',
        effect: 'Xuất khẩu +15/giây',
        buildTime: 7000,
    },
};

// Chính trị
const POLICIES = {
    democracy: {
        name: 'Dân chủ',
        cost: 100,
        effect: 'Tăng vàng +20%, giảm quân 10%',
        icon: '🗳️',
    },
    monarchy: {
        name: 'Quân chủ',
        cost: 80,
        effect: 'Tăng quân +30%, giảm vàng 10%',
        icon: '👑',
    },
    communism: {
        name: 'Cộng sản',
        cost: 120,
        effect: 'Sản xuất +40%, thương mại -20%',
        icon: '⚒️',
    },
    capitalism: {
        name: 'Tư bản',
        cost: 150,
        effect: 'Thương mại +50%, quân -20%',
        icon: '💰',
    },
    theocracy: {
        name: 'Thần quyền',
        cost: 90,
        effect: 'Tinh thần +50%, công nghệ -20%',
        icon: '⛪',
    },
};

// Công nghệ
const TECHNOLOGIES = {
    agriculture: {
        name: 'Nông nghiệp',
        cost: 50,
        effect: 'Vàng +5/giây',
        level: 0,
        maxLevel: 5,
    },
    military: {
        name: 'Quân sự',
        cost: 60,
        effect: 'Sức mạnh quân +10%',
        level: 0,
        maxLevel: 5,
    },
    trade: {
        name: 'Thương mại',
        cost: 70,
        effect: 'Thương mại +15%',
        level: 0,
        maxLevel: 5,
    },
    defense: {
        name: 'Phòng thủ',
        cost: 80,
        effect: 'Phòng thủ +20%',
        level: 0,
        maxLevel: 5,
    },
    science: {
        name: 'Khoa học',
        cost: 100,
        effect: 'Giảm chi phí xây dựng 10%',
        level: 0,
        maxLevel: 5,
    },
};

// ==================== LOAD MAP ====================
async function loadMap() {
    try {
        const response = await fetch('map.json');
        mapData = await response.json();
        
        canvas.width = mapData.info?.width || 1280;
        canvas.height = mapData.info?.height || 881;
        
        // Khởi tạo thành phố
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
            culture: burg.culture || null,
        }));
        
        render();
        updateUI();
        initFirebase();
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
    }
}

// ==================== FIREBASE ====================
function initFirebase() {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
    script.onload = () => {
        const script2 = document.createElement('script');
        script2.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js';
        script2.onload = () => {
            firebase.initializeApp(firebaseConfig);
            db = firebase.database();
            gameRef = db.ref('birthday_rts');
            
            registerPlayer();
            listenToGameChanges();
            startGameLoop();
        };
        document.head.appendChild(script2);
    };
    document.head.appendChild(script);
}

// ==================== ĐĂNG KÝ NGƯỜI CHƠI ====================
function registerPlayer() {
    playerName = document.getElementById('player-name').value || 'Chiến Binh';
    playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const playersRef = gameRef.child('players').child(playerId);
    
    playersRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            const colors = ['#e94560', '#4ade80', '#60a5fa', '#fbbf24', '#a78bfa', '#fb923c', '#f472b6', '#34d399'];
            const colorIndex = Object.keys(gameState.players).length % colors.length;
            
            // Tìm thành phố trống
            const unownedCity = gameState.cities.find(c => c.owner === null);
            const startCity = unownedCity || gameState.cities[0];
            
            const playerData = {
                id: playerId,
                name: playerName,
                color: colors[colorIndex],
                gold: 300,
                army: 25,
                cities: [startCity.id],
                buildings: [],
                technology: {},
                policy: null,
                score: 0,
                joinedAt: Date.now(),
                isAlive: true,
                income: 10, // vàng/giây
            };
            
            playersRef.set(playerData);
            
            if (startCity) {
                startCity.owner = playerId;
                startCity.army = 15;
                startCity.gold = 100;
                updateCity(startCity);
            }
        }
    });
}

// ==================== LẮNG NGHE THAY ĐỔI ====================
function listenToGameChanges() {
    // Cities
    gameRef.child('cities').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                const cityData = data[key];
                const localCity = gameState.cities.find(c => c.id == key);
                if (localCity) {
                    localCity.owner = cityData.owner;
                    localCity.army = cityData.army;
                    localCity.gold = cityData.gold || 0;
                    localCity.buildings = cityData.buildings || [];
                    localCity.defense = cityData.defense || 10;
                }
            });
            render();
            updateUI();
        }
    });
    
    // Players
    gameRef.child('players').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            gameState.players = data;
            updatePlayerList();
            render();
        }
    });
    
    // Armies
    gameRef.child('armies').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            gameState.armies = Object.values(data);
            render();
        }
    });
    
    // Moving armies
    gameRef.child('movingArmies').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            gameState.movingArmies = Object.values(data);
            render();
        }
    });
}

// ==================== GAME LOOP ====================
function startGameLoop() {
    setInterval(() => {
        if (!playerId) return;
        
        gameState.gameTime += 1;
        
        // Tự động tăng tiền mỗi giây
        const player = gameState.players[playerId];
        if (player) {
            // Tính thu nhập từ thành phố
            let income = player.cities.length * 5;
            
            // Cộng thêm từ công trình
            player.cities.forEach(cityId => {
                const city = gameState.cities.find(c => c.id === cityId);
                if (city && city.buildings) {
                    city.buildings.forEach(building => {
                        if (building.type === 'farm') income += 3;
                        if (building.type === 'market') income += 5;
                        if (building.type === 'port') income += 7;
                    });
                }
            });
            
            // Áp dụng chính sách
            if (player.policy) {
                const policy = POLICIES[player.policy];
                if (policy) {
                    if (player.policy === 'democracy') income *= 1.2;
                    if (player.policy === 'capitalism') income *= 1.5;
                    if (player.policy === 'communism') income *= 1.4;
                }
            }
            
            // Cộng tiền
            player.gold = (player.gold || 0) + income / 10;
            
            // Cập nhật lên Firebase
            gameRef.child('players').child(playerId).update({
                gold: player.gold,
            });
            
            // Tự động tăng quân ở các thành phố
            player.cities.forEach(cityId => {
                const city = gameState.cities.find(c => c.id === cityId);
                if (city) {
                    city.army += 0.02; // Tăng chậm
                    updateCity(city);
                }
            });
        }
        
        updateUI();
        render();
    }, 100); // Mỗi 100ms
}

// ==================== XÂY DỰNG CÔNG TRÌNH ====================
function buildBuilding(cityId, buildingType) {
    if (!playerId) return;
    
    const player = gameState.players[playerId];
    if (!player) return;
    
    const city = gameState.cities.find(c => c.id === cityId);
    if (!city || city.owner !== playerId) {
        alert('❌ Không phải thành phố của bạn!');
        return;
    }
    
    const building = BUILDINGS[buildingType];
    if (!building) return;
    
    if (player.gold < building.cost) {
        alert(`❌ Không đủ vàng! Cần ${building.cost}, có ${Math.floor(player.gold)}`);
        return;
    }
    
    // Trừ tiền
    player.gold -= building.cost;
    gameRef.child('players').child(playerId).update({ gold: player.gold });
    
    // Thêm công trình
    const newBuilding = {
        id: `build_${Date.now()}`,
        type: buildingType,
        name: building.name,
        builtAt: Date.now(),
        level: 1,
    };
    
    if (!city.buildings) city.buildings = [];
    city.buildings.push(newBuilding);
    updateCity(city);
    
    // Cập nhật lợi ích
    applyBuildingEffect(city, buildingType);
    
    console.log(`✅ Đã xây ${building.name} tại ${city.name}`);
    alert(`✅ Đã xây ${building.name} thành công!`);
    render();
}

function applyBuildingEffect(city, buildingType) {
    switch(buildingType) {
        case 'farm':
            // Tăng thu nhập
            break;
        case 'barracks':
            // Tăng sản xuất quân
            city.army += 10;
            updateCity(city);
            break;
        case 'wall':
            // Tăng phòng thủ
            city.defense = (city.defense || 10) * 1.5;
            updateCity(city);
            break;
        case 'market':
            // Tăng thương mại
            break;
        case 'temple':
            // Tăng tinh thần
            break;
        case 'port':
            // Tăng xuất khẩu
            break;
    }
}

// ==================== CHÍNH TRỊ ====================
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

// ==================== NGHIÊN CỨU CÔNG NGHỆ ====================
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
    
    // Trừ quân khỏi thành phố gửi
    fromCity.army -= units;
    updateCity(fromCity);
    
    // Tạo đoàn quân di chuyển
    const armyId = `army_${Date.now()}`;
    const army = {
        id: armyId,
        playerId: playerId,
        fromCityId: fromCityId,
        toCityId: toCityId,
        units: units,
        startX: fromCity.x,
        startY: fromCity.y,
        targetX: toCity.x,
        targetY: toCity.y,
        progress: 0,
        startTime: Date.now(),
        speed: 0.01, // Tốc độ di chuyển
    };
    
    // Lưu vào Firebase
    gameRef.child('movingArmies').child(armyId).set(army);
    
    // Xử lý khi đến nơi (sau 3 giây)
    setTimeout(() => {
        resolveBattle(toCityId, playerId, units);
        gameRef.child('movingArmies').child(armyId).remove();
    }, 3000);
}

function resolveBattle(cityId, attackerId, attackPower) {
    const city = gameState.cities.find(c => c.id === cityId);
    if (!city) return;
    
    const defenderId = city.owner;
    const defensePower = city.army + (city.defense || 10) * 0.5;
    
    // Tính sức mạnh tấn công
    let attackStrength = attackPower;
    const attacker = gameState.players[attackerId];
    if (attacker && attacker.technology) {
        const militaryLevel = attacker.technology.military || 0;
        attackStrength *= (1 + militaryLevel * 0.1);
    }
    
    if (attackStrength > defensePower) {
        // Thắng
        const oldOwner = city.owner;
        city.owner = attackerId;
        city.army = Math.floor(attackStrength - defensePower * 0.5);
        updateCity(city);
        
        // Cập nhật cho người chơi
        const attackerPlayer = gameState.players[attackerId];
        if (attackerPlayer) {
            attackerPlayer.cities.push(city.id);
            attackerPlayer.score = (attackerPlayer.score || 0) + 20;
            gameRef.child('players').child(attackerId).update({
                cities: attackerPlayer.cities,
                score: attackerPlayer.score,
            });
        }
        
        // Nếu có người phòng thủ
        if (oldOwner) {
            const defender = gameState.players[oldOwner];
            if (defender) {
                defender.cities = defender.cities.filter(id => id !== city.id);
                if (defender.cities.length === 0) {
                    defender.isAlive = false;
                }
                gameRef.child('players').child(oldOwner).update({
                    cities: defender.cities,
                    isAlive: defender.isAlive,
                });
            }
        }
        
        // Thông báo
        const msg = {
            text: `🏰 ${attacker?.name || 'Ai đó'} đã chiếm ${city.name}!`,
            time: Date.now(),
            type: 'system',
        };
        gameRef.child('messages').push(msg);
        
    } else {
        // Thua
        city.army = Math.floor(defensePower - attackStrength * 0.3);
        updateCity(city);
        
        const msg = {
            text: `💀 ${attacker?.name || 'Ai đó'} thất bại khi tấn công ${city.name}!`,
            time: Date.now(),
            type: 'system',
        };
        gameRef.child('messages').push(msg);
    }
}

// ==================== UPDATE THÀNH PHỐ ====================
function updateCity(city) {
    const cityRef = gameRef.child('cities').child(city.id);
    cityRef.set({
        id: city.id,
        name: city.name,
        x: city.x,
        y: city.y,
        owner: city.owner,
        army: Math.floor(city.army),
        gold: city.gold || 0,
        buildings: city.buildings || [],
        defense: city.defense || 10,
        isCapital: city.isCapital || false,
        population: city.population || 1000,
    });
}

// ==================== VẼ BẢN ĐỒ ====================
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const img = new Image();
    img.src = 'map.svg';
    img.onload = function() {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawGameElements();
    };
    img.onerror = function() {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGameElements();
    };
}

function drawGameElements() {
    // Vẽ quân đang di chuyển
    gameState.movingArmies.forEach(army => {
        const progress = Math.min((Date.now() - army.startTime) / 3000, 1);
        const x = army.startX + (army.targetX - army.startX) * progress;
        const y = army.startY + (army.targetY - army.startY) * progress;
        
        // Đoàn quân
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        const color = gameState.players[army.playerId]?.color || '#fff';
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Số lượng
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`⚔️${army.units}`, x, y + 25);
        
        // Mũi tên chỉ hướng
        const angle = Math.atan2(army.targetY - army.startY, army.targetX - army.startX);
        ctx.beginPath();
        ctx.moveTo(x + 15, y);
        ctx.lineTo(x + 25, y - 5);
        ctx.lineTo(x + 25, y + 5);
        ctx.closePath();
        ctx.fillStyle = '#ffd700';
        ctx.fill();
    });
    
    // Vẽ thành phố
    gameState.cities.forEach(city => {
        const owner = city.owner ? gameState.players[city.owner] : null;
        const color = owner ? owner.color : '#666';
        const isMine = city.owner === playerId;
        
        // Vòng tròn thành phố
        const radius = isMine ? 16 : 12;
        ctx.beginPath();
        ctx.arc(city.x, city.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = isMine ? '#ffd700' : '#fff';
        ctx.lineWidth = isMine ? 3 : 1;
        ctx.stroke();
        
        // Thủ đô
        if (city.isCapital) {
            ctx.beginPath();
            ctx.arc(city.x, city.y, radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Công trình
        if (city.buildings && city.buildings.length > 0) {
            let yOffset = -radius - 25;
            city.buildings.forEach(building => {
                const bData = BUILDINGS[building.type];
                if (bData) {
                    ctx.fillStyle = '#4ade80';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(bData.icon, city.x, city.y + yOffset);
                    yOffset -= 15;
                }
            });
        }
        
        // Tên
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(city.name, city.x, city.y - radius - 10);
        
        // Quân đội
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(`⚔️${Math.floor(city.army)}`, city.x, city.y + radius + 22);
        
        // Vàng
        ctx.fillStyle = '#ffd700';
        ctx.font = '11px Arial';
        ctx.fillText(`💰${Math.floor(city.gold || 0)}`, city.x, city.y + radius + 38);
        
        // Highlight khi chọn
        if (selectedCity && selectedCity.id === city.id) {
            ctx.beginPath();
            ctx.arc(city.x, city.y, radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });
    
    // UI trên canvas
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, 10, 250, 70);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`⏱️ ${Math.floor(gameState.gameTime / 10)}s`, 20, 30);
    ctx.fillText(`👥 ${Object.keys(gameState.players).length} người chơi`, 20, 48);
    ctx.fillText(`🏙️ ${gameState.cities.filter(c => c.owner === playerId).length} thành phố`, 20, 66);
    
    // Hướng dẫn
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(10, canvas.height - 30, 350, 25);
    ctx.fillStyle = '#aaa';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🖱️ Click thành phố → Xây dựng | Click thành phố khác → Xâm chiếm', 20, canvas.height - 10);
}

// ==================== UI UPDATE ====================
function updateUI() {
    if (!playerId) return;
    
    const player = gameState.players[playerId];
    if (!player) return;
    
    document.getElementById('player-name-display').textContent = `👑 ${player.name}`;
    document.getElementById('gold-display').textContent = Math.floor(player.gold || 0);
    document.getElementById('city-count').textContent = player.cities?.length || 0;
    
    // Tổng quân
    let totalArmy = 0;
    if (player.cities) {
        player.cities.forEach(cityId => {
            const city = gameState.cities.find(c => c.id === cityId);
            if (city) totalArmy += city.army;
        });
    }
    document.getElementById('army-display').textContent = Math.floor(totalArmy);
    
    // Chính sách hiện tại
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
    
    list.innerHTML = '<div style="color:#888;font-size:12px;text-align:center;margin-bottom:8px;">👥 Người chơi</div>';
    
    Object.values(gameState.players).forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-item';
        div.style.borderLeftColor = player.color;
        const cityCount = gameState.cities.filter(c => c.owner === player.id).length;
        div.innerHTML = `
            <span style="color: ${player.color};">●</span>
            ${player.isAlive ? '🟢' : '💀'} ${player.name}
            <span style="font-size:11px;color:#888;">
                🏙️${cityCount} 💰${Math.floor(player.gold || 0)}
                ${player.score ? `⭐${player.score}` : ''}
            </span>
        `;
        list.appendChild(div);
    });
}

// ==================== SỰ KIỆN CHUỘT ====================
function setupEvents() {
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // Tìm thành phố bị click
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
                <p style="font-size:11px;color:#555;">📍 Click phải để mở menu</p>
            `;
            render();
            return;
        }
        
        selectedCity = clickedCity;
        showCityMenu(clickedCity);
        render();
    });
    
    // Click phải - menu xây dựng
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (!selectedCity) return;
        
        showBuildMenu(selectedCity);
    });
}

function showCityMenu(city) {
    const owner = city.owner ? gameState.players[city.owner] : null;
    const isMine = city.owner === playerId;
    const player = gameState.players[playerId];
    
    let html = `
        <h4 style="color:#ffd700;">🏙️ ${city.name}</h4>
        <p><strong>Quốc gia:</strong> ${owner ? owner.name : 'Trống'}</p>
        <p><strong>Quân đội:</strong> ⚔️ ${Math.floor(city.army)}</p>
        <p><strong>Vàng:</strong> 💰 ${Math.floor(city.gold || 0)}</p>
        <p><strong>Phòng thủ:</strong> 🛡️ ${Math.floor(city.defense || 10)}</p>
        <p><strong>Dân số:</strong> 👨‍👩‍👧‍👦 ${Math.floor(city.population || 1000)}</p>
        ${city.isCapital ? '<p style="color:#ffd700;">⭐ Thủ đô</p>' : ''}
    `;
    
    // Công trình
    if (city.buildings && city.buildings.length > 0) {
        html += '<hr><p style="color:#4ade80;">🏗️ Công trình:</p>';
        city.buildings.forEach(b => {
            const bData = BUILDINGS[b.type];
            if (bData) {
                html += `<span style="font-size:12px;">${bData.icon} ${bData.name}</span> `;
            }
        });
    }
    
    if (isMine) {
        html += `
            <hr>
            <div style="display:flex;flex-direction:column;gap:5px;margin-top:10px;">
                <button onclick="showBuildMenu(selectedCity)" style="
                    background:#4ade80;color:#1a1a2e;border:none;padding:6px;border-radius:4px;
                    cursor:pointer;font-weight:bold;
                ">
                    🏗️ Xây dựng (Click phải)
                </button>
                <button onclick="recruitArmyLocal()" style="
                    background:#60a5fa;color:#fff;border:none;padding:6px;border-radius:4px;
                    cursor:pointer;
                ">
                    ⚔️ Tuyển quân (20 vàng)
                </button>
                <button onclick="showPolicyMenu()" style="
                    background:#a78bfa;color:#fff;border:none;padding:6px;border-radius:4px;
                    cursor:pointer;
                ">
                    📜 Chính trị
                </button>
                <button onclick="showTechMenu()" style="
                    background:#fbbf24;color:#1a1a2e;border:none;padding:6px;border-radius:4px;
                    cursor:pointer;
                ">
                    🔬 Công nghệ
                </button>
            </div>
        `;
    } else if (city.owner && owner) {
        // Thành phố của người khác
        if (player && player.isAlive) {
            html += `
                <hr>
                <button onclick="prepareInvasion()" style="
                    background:#e94560;color:#fff;border:none;padding:8px;border-radius:4px;
                    cursor:pointer;width:100%;font-weight:bold;
                ">
                    ⚔️ Xâm chiếm (Chọn quân)
                </button>
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
        const canAfford = player.gold >= b.cost;
        html += `
            <button onclick="buildBuilding(${city.id}, '${key}')" style="
                background:${canAfford ? '#2d2d4e' : '#1a1a2e'};
                color:${canAfford ? '#fff' : '#555'};
                border:1px solid ${canAfford ? '#4ade80' : '#333'};
                padding:8px;border-radius:4px;cursor:${canAfford ? 'pointer' : 'not-allowed'};
                font-size:11px;
            ">
                ${b.icon} ${b.name}
                <br><span style="font-size:9px;">💰${b.cost}</span>
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
        <div style="display:flex;flex-direction:column;gap:5px;">
    `;
    
    Object.keys(POLICIES).forEach(key => {
        const p = POLICIES[key];
        const canAfford = player.gold >= p.cost;
        html += `
            <button onclick="changePolicy('${key}')" style="
                background:${canAfford ? '#2d2d4e' : '#1a1a2e'};
                color:${canAfford ? '#fff' : '#555'};
                border:1px solid ${canAfford ? '#a78bfa' : '#333'};
                padding:8px;border-radius:4px;cursor:${canAfford ? 'pointer' : 'not-allowed'};
                text-align:left;
            ">
                ${p.icon} ${p.name} - 💰${p.cost}
                <br><span style="font-size:10px;color:#888;">${p.effect}</span>
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
        <div style="display:flex;flex-direction:column;gap:5px;">
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
                ${t.name} - Cấp ${t.level}/${t.maxLevel}
                <br><span style="font-size:10px;color:#888;">${t.effect} | 💰${cost}</span>
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
    
    // Tìm thành phố của mình gần nhất
    let myCities = gameState.cities.filter(c => c.owner === playerId);
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
        if (c.id === city.id) return;
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

function recruitArmyLocal() {
    if (!selectedCity) return;
    recruitArmy(selectedCity.id);
}

function recruitArmy(cityId) {
    if (!playerId) return;
    
    const player = gameState.players[playerId];
    if (!player) return;
    
    const city = gameState.cities.find(c => c.id === cityId);
    if (!city || city.owner !== playerId) return;
    
    const cost = 20;
    if (player.gold < cost) {
        alert(`❌ Không đủ vàng! Cần ${cost}`);
        return;
    }
    
    player.gold -= cost;
    city.army += 5;
    
    gameRef.child('players').child(playerId).update({ gold: player.gold });
    updateCity(city);
    
    alert('✅ Tuyển được 5 quân!');
    showCityMenu(city);
    updateUI();
    render();
}

// ==================== GLOBAL FUNCTIONS ====================
window.buildBuilding = buildBuilding;
window.changePolicy = changePolicy;
window.researchTech = researchTech;
window.invadeCity = invadeCity;
window.recruitArmy = recruitArmy;
window.showBuildMenu = showBuildMenu;
window.showPolicyMenu = showPolicyMenu;
window.showTechMenu = showTechMenu;
window.prepareInvasion = prepareInvasion;
window.showInvasionAmount = showInvasionAmount;
window.executeInvasion = executeInvasion;
window.recruitArmyLocal = recruitArmyLocal;
window.selectedCity = () => selectedCity;

// ==================== KHỞI TẠO ====================
window.onload = function() {
    setupEvents();
    loadMap();
    
    // Chat
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
};

console.log('🎮 RTS Full đang khởi tạo...');
