// ============================================
// 🎮 GAME.JS - Realtime RTS với Firebase
// ============================================

// ==================== CẤU HÌNH ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Firebase Config (của bạn)
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
let gameState = {
    cities: [],
    players: {},
    movingUnits: [],
    messages: [],
};

let selectedCity = null;
let targetCity = null;
let isSelectingFrom = false;
let myNation = null;

// Firebase references
let db = null;
let gameRef = null;

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
        gameState.cities = burgs.map(burg => ({
            id: burg.i,
            name: burg.name || `City ${burg.i}`,
            x: burg.x,
            y: burg.y,
            owner: null,
            army: Math.floor(Math.random() * 8) + 5,
            population: burg.population || 0,
            isCapital: burg.capital === 1,
            type: burg.type || 'Generic',
        }));
        
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
    
    // Kiểm tra đã tồn tại chưa
    playersRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            // Đăng ký mới
            const colors = ['#e94560', '#4ade80', '#60a5fa', '#fbbf24', '#a78bfa', '#fb923c', '#f472b6', '#34d399'];
            const colorIndex = Object.keys(gameState.players).length % colors.length;
            
            // Tìm thành phố trống
            const unownedCity = gameState.cities.find(c => c.owner === null);
            const startCity = unownedCity || gameState.cities[0];
            
            const playerData = {
                id: playerId,
                name: playerName,
                color: colors[colorIndex],
                gold: 200,
                army: 20,
                startCity: startCity.id,
                joinedAt: Date.now(),
                isAlive: true,
                score: 0,
            };
            
            // Lưu vào Firebase
            playersRef.set(playerData);
            
            // Gán thành phố cho người chơi
            if (startCity) {
                startCity.owner = playerId;
                startCity.army = 10;
                updateCity(startCity);
            }
            
            console.log(`✅ Đã đăng ký: ${playerName} (${playerId})`);
            
            // Lưu playerId vào local
            localStorage.setItem('playerId', playerId);
        }
    });
    
    // Cập nhật UI
    document.getElementById('connection-status').textContent = '🟢 Đã kết nối';
    document.getElementById('connection-status').style.color = '#4ade80';
}

// ==================== LẮNG NGHE THAY ĐỔI ====================
function listenToGameChanges() {
    // Lắng nghe thành phố
    gameRef.child('cities').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                const cityData = data[key];
                const localCity = gameState.cities.find(c => c.id == key);
                if (localCity) {
                    localCity.owner = cityData.owner;
                    localCity.army = cityData.army;
                }
            });
            render();
            updateUI();
        }
    });
    
    // Lắng nghe người chơi
    gameRef.child('players').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            gameState.players = data;
            updatePlayerList();
            render();
        }
    });
    
    // Lắng nghe quân đang di chuyển
    gameRef.child('movingUnits').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            gameState.movingUnits = Object.values(data);
            render();
        }
    });
    
    // Lắng nghe tin nhắn chat
    gameRef.child('messages').limitToLast(50).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            gameState.messages = Object.values(data);
            updateChat();
        }
    });
}

// ==================== CẬP NHẬT THÀNH PHỐ ====================
function updateCity(city) {
    const cityRef = gameRef.child('cities').child(city.id);
    cityRef.set({
        id: city.id,
        owner: city.owner,
        army: Math.round(city.army),
        name: city.name,
        x: city.x,
        y: city.y,
        isCapital: city.isCapital || false,
    });
}

// ==================== GỬI LỆNH DI CHUYỂN ====================
function sendMoveUnits(fromCityId, toCityId, units) {
    if (!playerId) {
        alert('❌ Chưa đăng nhập!');
        return;
    }
    
    const fromCity = gameState.cities.find(c => c.id === fromCityId);
    const toCity = gameState.cities.find(c => c.id === toCityId);
    
    if (!fromCity || !toCity) {
        alert('❌ Không tìm thấy thành phố!');
        return;
    }
    
    if (fromCity.owner !== playerId) {
        alert('❌ Đây không phải thành phố của bạn!');
        return;
    }
    
    if (fromCity.army < units) {
        alert(`❌ Không đủ quân! (Có ${Math.round(fromCity.army)})`);
        return;
    }
    
    // Trừ quân khỏi thành phố gửi
    fromCity.army -= units;
    updateCity(fromCity);
    
    // Tạo unit di chuyển
    const moveId = `move_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const move = {
        id: moveId,
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
    };
    
    // Lưu vào Firebase
    const moveRef = gameRef.child('movingUnits').child(moveId);
    moveRef.set(move);
    
    // Thêm vào local
    gameState.movingUnits.push(move);
    
    console.log(`⚔️ Đã gửi ${units} quân từ ${fromCity.name} đến ${toCity.name}`);
}

// ==================== TUYỂN QUÂN ====================
function recruitArmy(cityId) {
    if (!playerId) {
        alert('❌ Chưa đăng nhập!');
        return;
    }
    
    const city = gameState.cities.find(c => c.id === cityId);
    if (!city || city.owner !== playerId) {
        alert('❌ Không phải thành phố của bạn!');
        return;
    }
    
    // Lấy thông tin người chơi
    const playerRef = gameRef.child('players').child(playerId);
    playerRef.once('value', (snapshot) => {
        const player = snapshot.val();
        if (!player) return;
        
        const cost = 20;
        if (player.gold < cost) {
            alert(`❌ Không đủ vàng! (Cần ${cost}, có ${player.gold})`);
            return;
        }
        
        // Trừ vàng
        player.gold -= cost;
        playerRef.update({ gold: player.gold });
        
        // Tăng quân cho thành phố
        city.army += 5;
        updateCity(city);
        
        // Cập nhật UI
        updateUI();
        
        console.log(`✅ Đã tuyển 5 quân tại ${city.name}`);
    });
}

// ==================== CHIẾN ĐẤU ====================
function resolveBattle(cityId, attackerId, attackPower) {
    const city = gameState.cities.find(c => c.id === cityId);
    if (!city) return;
    
    const defenderId = city.owner;
    const defensePower = city.army || 5;
    
    if (attackPower > defensePower) {
        // Tấn công thắng
        city.owner = attackerId;
        city.army = Math.round(attackPower - defensePower / 2);
        updateCity(city);
        
        // Cập nhật điểm cho người tấn công
        const attackerRef = gameRef.child('players').child(attackerId);
        attackerRef.once('value', (snapshot) => {
            const attacker = snapshot.val();
            if (attacker) {
                attacker.score = (attacker.score || 0) + 10;
                attackerRef.update({ score: attacker.score });
            }
        });
        
        // Gửi thông báo
        const msg = {
            text: `🏰 ${playerName} đã chiếm ${city.name}!`,
            time: Date.now(),
            type: 'system',
        };
        gameRef.child('messages').push(msg);
        
    } else {
        // Tấn công thua
        city.army = Math.round(defensePower - attackPower / 3);
        updateCity(city);
        
        const msg = {
            text: `💀 ${playerName} thất bại khi tấn công ${city.name}!`,
            time: Date.now(),
            type: 'system',
        };
        gameRef.child('messages').push(msg);
    }
}

// ==================== GỬI TIN NHẮN CHAT ====================
function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    const msg = {
        playerId: playerId,
        playerName: playerName,
        text: text,
        time: Date.now(),
    };
    
    gameRef.child('messages').push(msg);
    input.value = '';
}

// ==================== UPDATE UI ====================
function updateUI() {
    if (!playerId) return;
    
    // Lấy thông tin người chơi
    const player = gameState.players[playerId];
    if (!player) return;
    
    // Cập nhật thông tin
    document.getElementById('player-name-display').textContent = `👑 ${player.name}`;
    document.getElementById('gold-display').textContent = player.gold || 0;
    
    // Đếm số thành phố
    const myCities = gameState.cities.filter(c => c.owner === playerId);
    document.getElementById('city-count').textContent = myCities.length;
    
    // Đếm tổng quân
    let totalArmy = 0;
    myCities.forEach(c => totalArmy += c.army);
    document.getElementById('army-display').textContent = Math.round(totalArmy);
}

function updatePlayerList() {
    const list = document.getElementById('player-list');
    if (!list) return;
    
    list.innerHTML = '';
    Object.values(gameState.players).forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-item';
        div.style.borderLeftColor = player.color;
        div.innerHTML = `
            <span style="color: ${player.color};">●</span>
            ${player.name}
            <span style="float: right; font-size: 12px; color: #888;">
                🏙️ ${gameState.cities.filter(c => c.owner === player.id).length}
            </span>
        `;
        list.appendChild(div);
    });
}

function updateChat() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    container.innerHTML = '';
    gameState.messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'chat-message';
        if (msg.type === 'system') {
            div.style.color = '#ffd700';
            div.style.fontStyle = 'italic';
        } else {
            const player = gameState.players[msg.playerId];
            const color = player ? player.color : '#fff';
            div.innerHTML = `<span style="color: ${color};">${msg.playerName}:</span> ${msg.text}`;
        }
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

// ==================== VẼ BẢN ĐỒ ====================
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ map SVG
    const img = new Image();
    img.src = 'map.svg';
    img.onload = function() {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawGameElements();
    };
    img.onerror = function() {
        // Fallback: vẽ nền
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGameElements();
    };
}

function drawGameElements() {
    // Vẽ quân đang di chuyển
    gameState.movingUnits.forEach(move => {
        const progress = Math.min((Date.now() - move.startTime) / 3000, 1);
        const x = move.startX + (move.targetX - move.startX) * progress;
        const y = move.startY + (move.targetY - move.startY) * progress;
        
        // Vẽ đoàn quân
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = gameState.players[move.playerId]?.color || '#fff';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Số lượng
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`⚔️${move.units}`, x, y + 20);
    });
    
    // Vẽ thành phố
    gameState.cities.forEach(city => {
        const owner = city.owner ? gameState.players[city.owner] : null;
        const color = owner ? owner.color : '#666';
        const isMine = city.owner === playerId;
        
        // Vẽ vòng tròn
        const radius = isMine ? 14 : 10;
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
            ctx.arc(city.x, city.y, radius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Tên
        ctx.fillStyle = '#fff';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(city.name, city.x, city.y - radius - 10);
        
        // Số quân
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`⚔️${Math.round(city.army)}`, city.x, city.y + radius + 18);
        
        // Highlight khi được chọn
        if (selectedCity && selectedCity.id === city.id) {
            ctx.beginPath();
            ctx.arc(city.x, city.y, radius + 6, 0, Math.PI * 2);
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });
    
    // Vẽ hướng dẫn
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(10, canvas.height - 50, 300, 40);
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🖱️ Click thành phố → Chọn quân → Click thành phố khác để tấn công', 20, canvas.height - 22);
    
    // Hiển thị số người chơi
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(canvas.width - 160, 10, 150, 25);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`👥 ${Object.keys(gameState.players).length} người chơi`, canvas.width - 20, 29);
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
            if (Math.sqrt(dx*dx + dy*dy) < 20) {
                clickedCity = city;
                break;
            }
        }
        
        if (!clickedCity) {
            // Click ra ngoài
            selectedCity = null;
            document.getElementById('info-content').innerHTML = `
                <p style="color: #888;">Click vào thành phố để xem thông tin</p>
            `;
            render();
            return;
        }
        
        // Xử lý chọn
        if (!selectedCity) {
            // Chọn thành phố đầu tiên
            selectedCity = clickedCity;
            showCityInfo(clickedCity);
            render();
            return;
        }
        
        // Đã chọn 1 thành phố
        if (selectedCity.id === clickedCity.id) {
            // Click lại cùng thành phố -> bỏ chọn
            selectedCity = null;
            document.getElementById('info-content').innerHTML = `
                <p style="color: #888;">Click vào thành phố để xem thông tin</p>
            `;
            render();
            return;
        }
        
        // Chọn thành phố thứ 2 (để tấn công)
        if (selectedCity.owner === playerId) {
            // Nếu là thành phố của mình
            if (clickedCity.owner === playerId) {
                // Di chuyển quân giữa các thành phố của mình
                const units = prompt(`Nhập số quân muốn chuyển từ ${selectedCity.name} đến ${clickedCity.name}:`, '5');
                if (units && !isNaN(units) && parseInt(units) > 0) {
                    sendMoveUnits(selectedCity.id, clickedCity.id, parseInt(units));
                }
            } else {
                // Tấn công thành phố khác
                const units = prompt(`Nhập số quân tấn công ${clickedCity.name}:`, '10');
                if (units && !isNaN(units) && parseInt(units) > 0) {
                    sendMoveUnits(selectedCity.id, clickedCity.id, parseInt(units));
                }
            }
        } else {
            // Chọn thành phố không phải của mình
            selectedCity = clickedCity;
            showCityInfo(clickedCity);
        }
        
        render();
    });
}

function showCityInfo(city) {
    const owner = city.owner ? gameState.players[city.owner] : null;
    const isMine = city.owner === playerId;
    
    document.getElementById('info-content').innerHTML = `
        <h4 style="color: #ffd700;">🏙️ ${city.name}</h4>
        <p><strong>Quốc gia:</strong> ${owner ? owner.name : 'Trống'}</p>
        <p><strong>Quân đội:</strong> ⚔️ ${Math.round(city.army)}</p>
        <p><strong>Dân số:</strong> ${Math.round(city.population * 1000)}</p>
        ${city.isCapital ? '<p style="color: #ffd700;">⭐ Thủ đô</p>' : ''}
        ${isMine ? `
            <hr>
            <button onclick="recruitArmy(${city.id})" style="
                background: #4ade80;
                color: #1a1a2e;
                border: none;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
                width: 100%;
                font-weight: bold;
            ">
                ⚔️ Tuyển quân (20 vàng)
            </button>
        ` : ''}
    `;
}

// ==================== KHỞI TẠO ====================
window.onload = function() {
    // Gán hàm sendChatMessage ra global
    window.sendChatMessage = sendChatMessage;
    window.recruitArmy = recruitArmy;
    
    // Setup events
    setupEvents();
    
    // Load map
    loadMap();
    
    // Xử lý Enter trong chat
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
};

console.log('🎮 Game đang khởi tạo...');
