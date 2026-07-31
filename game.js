// ============================================
// 🎮 GAME.JS - RTS FULL với Firebase
// ============================================

// ==================== CẤU HÌNH ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Firebase Config (của bạn)
const firebaseConfig = {
    apiKey: "AIzaSyCGXq3xpUv_qaH5R7RB9LlJwsnVhrlewoA",
    authDomain: "country-61ecf.firebaseapp.com",
    databaseURL: "https://country-61ecf-default-rtdb.asia-southeast1.firebasedatabase.app",
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
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let cameraX = 0;
let cameraY = 0;

// ==================== DANH SÁCH CÔNG TRÌNH ====================
const BUILDINGS = {
    barracks: {
        name: 'Doanh trại',
        cost: 50,
        icon: '🏛️',
        effect: 'Tăng sản xuất quân 2x',
        buildTime: 5000,
        color: '#e94560',
    },
    farm: {
        name: 'Trang trại',
        cost: 30,
        icon: '🌾',
        effect: 'Tăng vàng +5/giây',
        buildTime: 3000,
        color: '#4ade80',
    },
    wall: {
        name: 'Tường thành',
        cost: 80,
        icon: '🧱',
        effect: 'Phòng thủ +50%',
        buildTime: 8000,
        color: '#60a5fa',
    },
    market: {
        name: 'Chợ',
        cost: 40,
        icon: '🏪',
        effect: 'Thương mại +10/giây',
        buildTime: 4000,
        color: '#fbbf24',
    },
    temple: {
        name: 'Đền thờ',
        cost: 60,
        icon: '⛪',
        effect: 'Tinh thần +20%',
        buildTime: 6000,
        color: '#a78bfa',
    },
    port: {
        name: 'Cảng',
        cost: 70,
        icon: '⚓',
        effect: 'Xuất khẩu +15/giây',
        buildTime: 7000,
        color: '#34d399',
    },
    mine: {
        name: 'Mỏ vàng',
        cost: 45,
        icon: '⛏️',
        effect: 'Vàng +8/giây',
        buildTime: 3500,
        color: '#f472b6',
    },
};

// ==================== CHÍNH TRỊ ====================
const POLICIES = {
    democracy: {
        name: 'Dân chủ',
        cost: 100,
        effect: 'Tăng vàng +20%, giảm quân 10%',
        icon: '🗳️',
        color: '#4ade80',
    },
    monarchy: {
        name: 'Quân chủ',
        cost: 80,
        effect: 'Tăng quân +30%, giảm vàng 10%',
        icon: '👑',
        color: '#fbbf24',
    },
    communism: {
        name: 'Cộng sản',
        cost: 120,
        effect: 'Sản xuất +40%, thương mại -20%',
        icon: '⚒️',
        color: '#e94560',
    },
    capitalism: {
        name: 'Tư bản',
        cost: 150,
        effect: 'Thương mại +50%, quân -20%',
        icon: '💰',
        color: '#34d399',
    },
    theocracy: {
        name: 'Thần quyền',
        cost: 90,
        effect: 'Tinh thần +50%, công nghệ -20%',
        icon: '⛪',
        color: '#a78bfa',
    },
    federation: {
        name: 'Liên bang',
        cost: 130,
        effect: 'Phòng thủ +30%, ngoại giao +20%',
        icon: '🤝',
        color: '#60a5fa',
    },
};

// ==================== CÔNG NGHỆ ====================
const TECHNOLOGIES = {
    agriculture: {
        name: 'Nông nghiệp',
        cost: 50,
        effect: 'Vàng +5/giây',
        icon: '🌾',
        level: 0,
        maxLevel: 5,
    },
    military: {
        name: 'Quân sự',
        cost: 60,
        effect: 'Sức mạnh quân +10%',
        icon: '⚔️',
        level: 0,
        maxLevel: 5,
    },
    trade: {
        name: 'Thương mại',
        cost: 70,
        effect: 'Thương mại +15%',
        icon: '📦',
        level: 0,
        maxLevel: 5,
    },
    defense: {
        name: 'Phòng thủ',
        cost: 80,
        effect: 'Phòng thủ +20%',
        icon: '🛡️',
        level: 0,
        maxLevel: 5,
    },
    science: {
        name: 'Khoa học',
        cost: 100,
        effect: 'Giảm chi phí xây dựng 10%',
        icon: '🔬',
        level: 0,
        maxLevel: 5,
    },
    diplomacy: {
        name: 'Ngoại giao',
        cost: 90,
        effect: 'Quan hệ +20%, liên minh dễ hơn',
        icon: '🤝',
        level: 0,
        maxLevel: 5,
    },
};

// ==================== LOAD MAP ====================
async function loadMap() {
    try {
        console.log('🔄 Đang tải bản đồ...');
        const response = await fetch('map.json');
        mapData = await response.json();
        console.log('✅ Đã tải bản đồ!');
        
        // Set canvas size
        canvas.width = mapData.info?.width || 1280;
        canvas.height = mapData.info?.height || 881;
        
        // Khởi tạo thành phố từ dữ liệu
        const burgs = mapData.burgs || [];
        const cultures = mapData.cultures || [];
        
        gameState.cities = burgs.map(burg => {
            // Tìm culture cho thành phố này
            let culture = null;
            if (burg.culture !== undefined) {
                culture = cultures.find(c => c.i === burg.culture);
            }
            
            return {
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
                culture: culture ? culture.name : null,
                cultureColor: culture ? culture.color : '#888',
                income: 5,
                production: burg.production || [],
            };
        });
        
        console.log(`✅ Đã tạo ${gameState.cities.length} thành phố`);
        
        // Vẽ bản đồ
        render();
        updateUI();
        
        // Kết nối Firebase
        initFirebase();
        
    } catch (error) {
        console.error('❌ Lỗi tải map:', error);
        document.getElementById('info-content').innerHTML = `
            <p style="color: #e94560;">❌ Không thể tải map.json!</p>
            <p style="font-size: 12px;">Kiểm tra file có tồn tại không.</p>
        `;
    }
}

// ==================== FIREBASE INIT ====================
function initFirebase() {
    // Load Firebase SDK
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
    script.onload = () => {
        const script2 = document.createElement('script');
        script2.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js';
        script2.onload = () => {
            // Khởi tạo Firebase
            firebase.initializeApp(firebaseConfig);
            db = firebase.database();
            gameRef = db.ref('birthday_rts');
            
            console.log('🔥 Firebase đã kết nối!');
            
            // Đăng ký người chơi
            registerPlayer();
            
            // Lắng nghe thay đổi
            listenToGameChanges();
            
            // Bắt đầu game loop
            startGameLoop();
        };
        document.head.appendChild(script2);
    };
    document.head.appendChild(script);
}

// ==================== ĐĂNG KÝ NGƯỜI CHƠI ====================
function registerPlayer() {
    playerName = document.getElementById('player-name')?.value || 'Chiến Binh';
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
                income: 10,
                alliances: [],
                wars: [],
            };
            
            playersRef.set(playerData);
            
            // Gán thành phố cho người chơi
            if (startCity) {
                startCity.owner = playerId;
                startCity.army = 15;
                startCity.gold = 100;
                updateCity(startCity);
            }
            
            console.log(`✅ Đã đăng ký: ${playerName} (${playerId})`);
            document.getElementById('connection-status').textContent = '🟢 Đã kết nối';
            document.getElementById('connection-status').style.color = '#4ade80';
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
                    localCity.army = cityData.army || 0;
                    localCity.gold = cityData.gold || 0;
                    localCity.buildings = cityData.buildings || [];
                    localCity.defense = cityData.defense || 10;
                    localCity.population = cityData.population || 1000;
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

// ==================== GAME LOOP ====================
function startGameLoop() {
    setInterval(() => {
        if (!playerId || !gameState.players[playerId]) return;
        
        gameState.gameTime += 0.1;
        
        const player = gameState.players[playerId];
        if (!player || !player.isAlive) return;
        
        // Tự động tăng tiền mỗi giây
        let income = player.cities.length * 5;
        
        // Cộng thêm từ công trình
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
        
        // Áp dụng chính sách
        if (player.policy) {
            const policy = POLICIES[player.policy];
            if (policy) {
                if (player.policy === 'democracy') income *= 1.2;
                if (player.policy === 'capitalism') income *= 1.5;
                if (player.policy === 'communism') income *= 1.4;
                if (player.policy === 'federation') income *= 1.1;
            }
        }
        
        // Áp dụng công nghệ
        if (player.technology) {
            const agriLevel = player.technology.agriculture || 0;
            income += agriLevel * 2;
            const tradeLevel = player.technology.trade || 0;
            income *= (1 + tradeLevel * 0.05);
        }
        
        // Cộng tiền
        const incomePerTick = income / 10;
        player.gold = (player.gold || 0) + incomePerTick;
        
        // Cập nhật lên Firebase
        gameRef.child('players').child(playerId).update({
            gold: player.gold,
        });
        
        // Tự động tăng quân ở các thành phố
        player.cities.forEach(cityId => {
            const city = gameState.cities.find(c => c.id === cityId);
            if (city) {
                // Tăng quân dựa trên doanh trại
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
    
    // Kiểm tra chi phí (có giảm giá từ công nghệ)
    let cost = building.cost;
    if (player.technology && player.technology.science) {
        cost *= (1 - player.technology.science * 0.05);
    }
    cost = Math.floor(cost);
    
    if (player.gold < cost) {
        alert(`❌ Không đủ vàng! Cần ${cost}, có ${Math.floor(player.gold)}`);
        return;
    }
    
    // Trừ tiền
    player.gold -= cost;
    gameRef.child('players').child(playerId).update({ gold: player.gold });
    
    // Thêm công trình
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
    
    // Thông báo
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

// ==================== TUYỂN QUÂN ====================
function recruitArmy(cityId) {
    if (!playerId) return;
    
    const player = gameState.players[playerId];
    if (!player) return;
    
    const city = gameState.cities.find(c => c.id === cityId);
    if (!city || city.owner !== playerId) {
        alert('❌ Không phải thành phố của bạn!');
        return;
    }
    
    // Chi phí tuyển quân (có thể giảm giá từ công nghệ)
    let cost = 20;
    if (player.technology && player.technology.military) {
        cost -= player.technology.military * 1;
    }
    cost = Math.max(10, Math.floor(cost));
    
    if (player.gold < cost) {
        alert(`❌ Không đủ vàng! Cần ${cost}, có ${Math.floor(player.gold)}`);
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
    if (toCity.owner === playerId) {
        alert('❌ Đây là thành phố của bạn!');
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
        playerName: playerName,
        fromCityId: fromCityId,
        toCityId: toCityId,
        units: units,
        startX: fromCity.x,
        startY: fromCity.y,
        targetX: toCity.x,
        targetY: toCity.y,
        progress: 0,
        startTime: Date.now(),
        speed: 0.012,
    };
    
    // Lưu vào Firebase
    gameRef.child('movingArmies').child(armyId).set(army);
    
    // Xử lý khi đến nơi
    const travelTime = 3000;
    setTimeout(() => {
        resolveBattle(toCityId, playerId, units);
        gameRef.child('movingArmies').child(armyId).remove();
    }, travelTime);
}

function resolveBattle(cityId, attackerId, attackPower) {
    const city = gameState.cities.find(c => c.id === cityId);
    if (!city) return;
    
    const defenderId = city.owner;
    const attacker = gameState.players[attackerId];
    const defender = defenderId ? gameState.players[defenderId] : null;
    
    // Tính sức mạnh tấn công
    let attackStrength = attackPower;
    if (attacker && attacker.technology) {
        const militaryLevel = attacker.technology.military || 0;
        attackStrength *= (1 + militaryLevel * 0.1);
    }
    
    // Tính sức mạnh phòng thủ
    let defenseStrength = city.army + (city.defense || 10) * 0.5;
    if (defender && defender.technology) {
        const defenseLevel = defender.technology.defense || 0;
        defenseStrength *= (1 + defenseLevel * 0.1);
    }
    
    // Kiểm tra tường thành
    if (city.buildings) {
        city.buildings.forEach(b => {
            if (b.type === 'wall') defenseStrength *= 1.5;
        });
    }
    
    if (attackStrength > defenseStrength) {
        // 🏆 THẮNG
        const oldOwner = city.owner;
        city.owner = attackerId;
        city.army = Math.floor(attackStrength - defenseStrength * 0.5);
        city.gold = Math.floor(city.gold * 0.6);
        updateCity(city);
        
        // Cập nhật cho người tấn công
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
        
        // Cập nhật cho người phòng thủ
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
        
        // Thông báo
        const msg = {
            text: `🏰 ${attacker?.name || 'Ai đó'} đã chiếm ${city.name} từ ${defender?.name || 'AI'}!`,
            time: Date.now(),
            type: 'system',
        };
        gameRef.child('messages').push(msg);
        
        // Bonus vàng cho người thắng
        if (attacker) {
            attacker.gold += 50;
            gameRef.child('players').child(attackerId).update({ gold: attacker.gold });
        }
        
    } else {
        // 💀 THUA
        city.army = Math.floor(defenseStrength - attackStrength * 0.3);
        updateCity(city);
        
        // Người tấn công mất quân
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
    
    const msg = {
        text: `📜 ${playerName} đã áp dụng chính sách ${policy.name}!`,
        time: Date.now(),
        type: 'system',
    };
    gameRef.child('messages').push(msg);
    
    alert(`✅ Đã áp dụng chính sách ${policy.name}!`);
    updateUI();
}

// ==================== CÔNG NGHỆ ====================
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
        gold: Math.floor(city.gold || 0),
        buildings: city.buildings || [],
        defense: Math.floor(city.defense || 10),
        isCapital: city.isCapital || false,
        population: Math.floor(city.population || 1000),
    });
}

// ==================== VẼ BẢN ĐỒ ====================
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ map SVG
    const img = new Image();
    img.src = 'map.svg';
    img.onload = function() {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawGameElements();
    };
    img.onerror = function() {
        drawGameElements();
    };
}

function drawGameElements() {
    // 1. Vẽ quân đang di chuyển
    gameState.movingArmies.forEach(army => {
        const progress = Math.min((Date.now() - army.startTime) / 3000, 1);
        const x = army.startX + (army.targetX - army.startX) * progress;
        const y = army.startY + (army.targetY - army.startY) * progress;
        
        const color = gameState.players[army.playerId]?.color || '#fff';
        
        // Đoàn quân
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
        
        // Số lượng
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`⚔️${Math.floor(army.units)}`, x, y + 28);
        
        // Tên người chơi
        ctx.fillStyle = '#ddd';
        ctx.font = '10px Arial';
        ctx.fillText(army.playerName || '', x, y - 22);
    });
    
    // 2. Vẽ thành phố
    gameState.cities.forEach(city => {
        const owner = city.owner ? gameState.players[city.owner] : null;
        const color = owner ? owner.color : '#666';
        const isMine = city.owner === playerId;
        const isEnemy = city.owner && city.owner !== playerId;
        
        // Bóng đổ
        ctx.shadowColor = color;
        ctx.shadowBlur = isMine ? 20 : 10;
        
        // Vòng tròn thành phố
        const radius = isMine ? 18 : 13;
        ctx.beginPath();
        ctx.arc(city.x, city.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Viền
        ctx.strokeStyle = isMine ? '#ffd700' : isEnemy ? '#e94560' : '#fff';
        ctx.lineWidth = isMine ? 3 : 1.5;
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
        
        // Icon công trình
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
            if (city.buildings.length > 3) {
                ctx.fillStyle = '#4ade80';
                ctx.font = '10px Arial';
                ctx.fillText(`+${city.buildings.length - 3}`, city.x, city.y + yOffset + 5);
            }
        }
        
        // Tên thành phố
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(city.name, city.x, city.y - radius - 12);
        
        // Quân đội
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`⚔️${Math.floor(city.army)}`, city.x, city.y + radius + 24);
        
        // Vàng
        ctx.fillStyle = '#ffd700';
        ctx.font = '11px Arial';
        ctx.fillText(`💰${Math.floor(city.gold || 0)}`, city.x, city.y + radius + 40);
        
        // Tên quốc gia
        if (owner) {
            ctx.fillStyle = '#aaa';
            ctx.font = '9px Arial';
            ctx.fillText(owner.name, city.x, city.y + radius + 56);
        }
        
        // Highlight khi chọn
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
    
    // 3. UI trên canvas
    // Thông tin game
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(10, 10, 220, 90);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`⏱️ ${Math.floor(gameState.gameTime)}s`, 20, 30);
    ctx.fillText(`👥 ${Object.keys(gameState.players).length} người chơi`, 20, 48);
    const myCities = gameState.cities.filter(c => c.owner === playerId);
    ctx.fillText(`🏙️ ${myCities.length} thành phố`, 20, 66);
    ctx.fillText(`⚔️ Tổng quân: ${Math.floor(myCities.reduce((sum, c) => sum + c.army, 0))}`, 20, 84);
    
    // Hướng dẫn
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, canvas.height - 35, 400, 28);
    ctx.fillStyle = '#aaa';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🖱️ Click: Chọn | Click phải: Xây dựng | Click thành phố khác: Tấn công', 20, canvas.height - 14);
}

// ==================== UI UPDATE ====================
function updateUI() {
    if (!playerId || !gameState.players[playerId]) return;
    
    const player = gameState.players[playerId];
    
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
    
    // Chính sách
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
    
    // Sắp xếp theo điểm
    const sortedPlayers = Object.values(gameState.players).sort((a, b) => (b.score || 0) - (a.score || 0));
    
    sortedPlayers.forEach(player => {
        const cityCount = gameState.cities.filter(c => c.owner === player.id).length;
        const isMe = player.id === playerId;
        const div = document.createElement('div');
        div.className = 'player-item';
        div.style.borderLeftColor = player.color;
        div.style.background = isMe ? 'rgba(255,215,0,0.1)' : 'transparent';
        div.innerHTML = `
            <span style="color: ${player.color};">●</span>
            ${player.isAlive ? '🟢' : '💀'} 
            <strong>${player.name}</strong> ${isMe ? '⭐' : ''}
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
                <p style="font-size:11px;color:#555;">📌 Click phải để mở menu xây dựng</p>
            `;
            render();
            return;
        }
        
        // Xử lý chọn thành phố
        if (selectedCity && selectedCity.id === clickedCity.id) {
            // Click lại cùng thành phố -> mở menu
            showCityMenu(clickedCity);
            render();
            return;
        }
        
        // Nếu đã chọn 1 thành phố của mình và click vào thành phố khác -> tấn công
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
    
    // Click phải - menu xây dựng
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
        <p><strong>Dân số:</strong> 👨‍👩‍👧‍👦 ${Math.floor(city.population || 1000)}</p>
        ${city.isCapital ? '<p style="color:#ffd700;">⭐ Thủ đô</p>' : ''}
        ${city.culture ? `<p><strong>Văn hóa:</strong> <span style="color:${city.cultureColor};">${city.culture}</span></p>` : ''}
    `;
    
    // Công trình
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
                <button onclick="showBuildMenu(selectedCity)" style="
                    background:#4ade80;color:#1a1a2e;border:none;padding:8px;border-radius:4px;
                    cursor:pointer;font-weight:bold;
                ">
                    🏗️ Xây dựng (Click phải)
                </button>
                <button onclick="recruitArmy(${city.id})" style="
                    background:#60a5fa;color:#fff;border:none;padding:8px;border-radius:4px;
                    cursor:pointer;
                ">
                    ⚔️ Tuyển quân (~20 vàng)
                </button>
                <button onclick="showPolicyMenu()" style="
                    background:#a78bfa;color:#fff;border:none;padding:8px;border-radius:4px;
                    cursor:pointer;
                ">
                    📜 Chính trị
                </button>
                <button onclick="showTechMenu()" style="
                    background:#fbbf24;color:#1a1a2e;border:none;padding:8px;border-radius:4px;
                    cursor:pointer;
                ">
                    🔬 Công nghệ
                </button>
            </div>
        `;
    } else if (city.owner && owner && city.owner !== playerId) {
        // Thành phố của người khác
        if (player && player.isAlive) {
            html += `
                <hr>
                <button onclick="prepareInvasion()" style="
                    background:#e94560;color:#fff;border:none;padding:10px;border-radius:4px;
                    cursor:pointer;width:100%;font-weight:bold;
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
                <br><span style="font-size:8px;color:#888;">${b.effect}</span>
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
    
    // Tìm thành phố của mình
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
window.sendChatMessage = sendChatMessage;
window.selectedCity = () => selectedCity;

// ==================== KHỞI TẠO ====================
window.onload = function() {
    console.log('🎮 RTS Full đang khởi tạo...');
    setupEvents();
    loadMap();
    
    // Chat Enter
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
};
