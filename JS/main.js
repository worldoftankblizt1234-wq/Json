// === MAIN.JS - KHỞI TẠO VÀ ĐIỀU KHIỂN ===

let game = null;
let isMultiplayer = false;

// === KIỂM TRA HƯỚNG MÀN HÌNH ===
function checkOrientation() {
    const isMobile = window.innerWidth < 768;
    const isPortrait = window.innerHeight > window.innerWidth;
    const warning = document.getElementById('rotate-warning');
    
    if (isMobile && isPortrait) {
        if (warning) warning.style.display = 'flex';
        return false;
    } else {
        if (warning) warning.style.display = 'none';
        return true;
    }
}

// === KHỞI TẠO GAME ===
function startGame() {
    console.log('🚀 Khởi tạo game...');
    
    // Lấy thông tin người chơi
    const playerNations = JSON.parse(localStorage.getItem('aoh_player_nations') || '[]');
    const players = JSON.parse(localStorage.getItem('aoh_players') || '[]');
    
    // Tìm nation của người chơi hiện tại
    const myPlayer = players.find(p => p.playerId === lobby.playerId);
    const myNationId = myPlayer?.nationId || playerNations[0] || 10;
    
    console.log(`👑 Bạn là: ${NATIONS.find(n => n.id === myNationId)?.name}`);
    
    // 1. Khởi tạo Canvas
    resizeCanvas();
    
    // 2. Tạo bản đồ
    generateMap();
    
    // 3. Khởi tạo Game Engine
    game = new AoHGame();
    game.playerNationId = myNationId;
    game.init(true);
    
    // 4. Thiết lập sự kiện
    setupEventListeners();
    
    // 5. Cập nhật UI
    updateUI();
    updateNationInfo();
    
    // 6. Kết nối Firebase
    if (game.multiplayer) {
        game.multiplayer.connect();
    }
    
    // 7. Đồng bộ dữ liệu ban đầu
    setTimeout(() => {
        if (game.multiplayer) {
            game.syncToServer();
        }
    }, 2000);
    
    console.log('✅ Game đã sẵn sàng!');
    const aiCount = Object.values(game.nations).filter(n => n.isAI).length;
    const playerCount = Object.values(game.nations).filter(n => n.isPlayer).length;
    showToast(`🌐 ${playerCount} người chơi + ${aiCount} AI`, 'success');
}

// === KHỞI CHẠY ===
window.onload = function() {
    // Kiểm tra hướng màn hình
    if (!checkOrientation()) {
        window.addEventListener('resize', function onResize() {
            if (checkOrientation()) {
                window.removeEventListener('resize', onResize);
                showLogin();
            }
        });
        return;
    }
    
    showLogin();
};

// === SỰ KIỆN ===
function setupEventListeners() {
    const canvasEl = document.getElementById('worldMapCanvas');
    
    canvasEl.addEventListener('click', handleCanvasClick);
    canvasEl.addEventListener('wheel', handleZoom);
    canvasEl.addEventListener('mousedown', startDrag);
    canvasEl.addEventListener('touchstart', handleTouchStart);
    canvasEl.addEventListener('touchmove', handleTouchMove);
    canvasEl.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', endDrag);
    
    document.getElementById('miniMapCanvas').addEventListener('click', handleMiniMapClick);
    
    // Cờ trái - Ngoại giao
    document.getElementById('flag-left').addEventListener('click', function() {
        // Tìm nước đầu tiên khác mình
        if (!game) return;
        const player = game.nations[game.playerNationId];
        if (!player) return;
        const target = Object.values(game.nations).find(n => n.id !== game.playerNationId && n.isAlive);
        if (target) {
            showDiplomacyMenu(target.id);
        } else {
            showToast('❌ Không có quốc gia nào để ngoại giao', 'error');
        }
    });
    
    // Cờ phải - Quốc gia
    document.getElementById('flag-right').addEventListener('click', function() {
        showNationMenu();
    });
    
    // Province menu buttons
    document.getElementById('btn-add').addEventListener('click', handleAdd);
    document.getElementById('btn-recruit').addEventListener('click', handleRecruit);
    document.getElementById('btn-disband').addEventListener('click', handleDisband);
    document.getElementById('btn-abandon').addEventListener('click', handleAbandon);
    
    // Close modals
    document.getElementById('btn-close-modal').addEventListener('click', () => {
        document.getElementById('province-modal').classList.add('hidden');
    });
    document.getElementById('btn-close-add').addEventListener('click', () => {
        document.getElementById('add-menu').classList.add('hidden');
    });
    document.getElementById('btn-close-nation-modal').addEventListener('click', () => {
        document.getElementById('nation-menu-modal').classList.add('hidden');
    });
    document.getElementById('btn-close-diplomacy-modal').addEventListener('click', () => {
        document.getElementById('diplomacy-modal').classList.add('hidden');
    });
    document.getElementById('btn-close-trade').addEventListener('click', () => {
        document.getElementById('trade-popup').classList.add('hidden');
    });
    document.getElementById('btn-close-treaty').addEventListener('click', () => {
        document.getElementById('treaty-popup').classList.add('hidden');
    });
    
    window.addEventListener('resize', resizeCanvas);
    
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (game) {
                game.autoSave();
                showToast('💾 Đã lưu game!', 'success');
            }
        }
    });
    
    window.addEventListener('beforeunload', () => {
        if (game) game.autoSave();
    });
}

// === XỬ LÝ CLICK CANVAS ===
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const grid = getGridCoords(x, y);
    const idx = grid.row * CONFIG.COLS + grid.col;
    const pNum = provinceNum[idx];
    const type = mapType[idx];
    
    if (pNum === 0 || type === 0) {
        showToast('🌊 Đây là biển hoặc đất trống');
        return;
    }
    
    if (!game) return;
    const province = game.provinces[pNum];
    if (!province) return;
    
    // Hiển thị menu tỉnh
    document.getElementById('province-menu').classList.remove('hidden');
    document.getElementById('province-info').textContent = `🏛️ Tỉnh ${pNum} - ${NATIONS.find(n => n.id === type)?.name || 'Unknown'}`;
    game.selectedProvince = pNum;
    showProvinceInfo(idx);
}

// === CÁC HÀM XỬ LÝ TỈNH ===
function handleAdd() {
    if (!game || !game.selectedProvince) {
        showToast('❌ Hãy chọn một tỉnh trước!', 'error');
        return;
    }
    const province = game.provinces[game.selectedProvince];
    if (!province) return;
    
    const available = getAvailableBuildings(province.nationId, game.selectedProvince);
    if (available.length === 0) {
        showToast('❌ Không có công trình nào để xây!', 'error');
        return;
    }
    
    const list = document.getElementById('add-list');
    const nation = game.nations[province.nationId];
    document.getElementById('add-province-name').textContent = `Tỉnh ${game.selectedProvince}`;
    
    // Thêm các công trình
    let html = '';
    for (const b of available) {
        html += `
            <div class="flex justify-between items-center p-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50 ${b.canAfford ? 'hover:border-green-500/50 cursor-pointer' : 'opacity-50'}">
                <div>
                    <div class="text-white font-bold text-[10px]">${b.icon} ${b.name}</div>
                    <div class="text-gray-400 text-[8px]">💰 ${b.cost} vàng | ${b.description}</div>
                    <div class="text-gray-500 text-[7px]">Cấp: ${b.currentLevel}/${b.maxLevel}</div>
                </div>
                <button onclick="buildBuilding('${b.id}')" 
                    class="px-2 py-0.5 rounded-lg ${b.canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 cursor-not-allowed'} text-white text-[8px] font-bold">
                    ${b.canAfford ? 'Xây' : '❌'}
                </button>
            </div>
        `;
    }
    
    // Thêm Lễ hội và Đồng hóa
    html += `
        <div class="border-t border-gray-700 pt-1.5 mt-1.5">
            <button onclick="organizeFestival()" class="w-full px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-[10px] font-bold transition">
                🎉 Tổ chức lễ hội (500 vàng)
            </button>
            <button onclick="assimilateProvince()" class="w-full mt-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition">
                🔄 Đồng hóa (1000 vàng, cần KH ≥ 0.5)
            </button>
        </div>
    `;
    
    list.innerHTML = html;
    document.getElementById('add-menu').classList.remove('hidden');
}

function buildBuilding(buildingId) {
    if (!game || !game.selectedProvince) return;
    const result = game.buildBuilding(game.selectedProvince, buildingId);
    showToast(result.message, result.success ? 'success' : 'error');
    if (result.success) {
        updateUI();
        document.getElementById('add-menu').classList.add('hidden');
    }
}

function organizeFestival() {
    if (!game || !game.selectedProvince) return;
    const result = game.organizeFestival(game.selectedProvince);
    showToast(result.message, result.success ? 'success' : 'error');
    if (result.success) updateUI();
}

function assimilateProvince() {
    if (!game || !game.selectedProvince) return;
    const result = game.assimilate(game.selectedProvince);
    showToast(result.message, result.success ? 'success' : 'error');
    if (result.success) updateUI();
}

function handleRecruit() {
    if (!game || !game.selectedProvince) {
        showToast('❌ Hãy chọn một tỉnh trước!', 'error');
        return;
    }
    const province = game.provinces[game.selectedProvince];
    if (!province) return;
    const nation = game.nations[province.nationId];
    if (!nation) return;
    
    const maxRecruit = Math.floor((nation.gold * 0.7) / CONFIG.RECRUIT_COST_GOLD);
    const amount = parseInt(prompt(`Nhập số quân muốn tuyển (tối đa ${maxRecruit}):`, '100'));
    if (!amount || amount < 10) {
        showToast('❌ Số quân không hợp lệ! Tối thiểu 10', 'error');
        return;
    }
    const result = game.recruitTroops(game.selectedProvince, amount);
    showToast(result.message, result.success ? 'success' : 'error');
    if (result.success) updateUI();
}

function handleDisband() {
    if (!game || !game.selectedProvince) {
        showToast('❌ Hãy chọn một tỉnh trước!', 'error');
        return;
    }
    if (!confirm('Bạn có chắc muốn giải tán toàn bộ quân tại tỉnh này?')) return;
    const result = game.disbandTroops(game.selectedProvince);
    showToast(result.message, result.success ? 'success' : 'error');
    if (result.success) updateUI();
}

function handleAbandon() {
    if (!game || !game.selectedProvince) {
        showToast('❌ Hãy chọn một tỉnh trước!', 'error');
        return;
    }
    if (!confirm('Bạn có chắc muốn bỏ tỉnh này?')) return;
    const result = game.abandonProvince(game.selectedProvince);
    showToast(result.message, result.success ? 'success' : 'error');
    if (result.success) {
        updateUI();
        document.getElementById('province-menu').classList.add('hidden');
    }
}

// === DRAG & ZOOM ===
function startDrag(e) {
    isDragging = true;
    touchStartX = e.clientX - cameraX;
    touchStartY = e.clientY - cameraY;
    canvas.style.cursor = 'grabbing';
}

function drag(e) {
    if (!isDragging) return;
    cameraX = e.clientX - touchStartX;
    cameraY = e.clientY - touchStartY;
    clampCamera();
}

function endDrag() {
    isDragging = false;
    canvas.style.cursor = 'grab';
}

function handleZoom(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const oldZoom = zoom;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, oldZoom * factor));
    const worldX = (mouseX - cameraX) / oldZoom;
    const worldY = (mouseY - cameraY) / oldZoom;
    zoom = newZoom;
    cameraX = mouseX - worldX * zoom;
    cameraY = mouseY - worldY * zoom;
    clampCamera();
    document.getElementById('zoom-text').textContent = Math.round(zoom * 100) + '%';
}

let initialPinchDist = null;
let lastTouchDist = 0;

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        isDragging = true;
        touchStartX = e.touches[0].clientX - cameraX;
        touchStartY = e.touches[0].clientY - cameraY;
        initialPinchDist = null;
    } else if (e.touches.length === 2) {
        isDragging = false;
        initialPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        lastTouchDist = initialPinchDist;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
        cameraX = e.touches[0].clientX - touchStartX;
        cameraY = e.touches[0].clientY - touchStartY;
        clampCamera();
    } else if (e.touches.length === 2 && initialPinchDist) {
        const touch1 = e.touches[0], touch2 = e.touches[1];
        const rect = canvas.getBoundingClientRect();
        const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
        const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
        const oldZoom = zoom;
        const currentDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        const factor = currentDist / lastTouchDist;
        const newZoom = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, oldZoom * factor));
        const worldX = (centerX - cameraX) / oldZoom;
        const worldY = (centerY - cameraY) / oldZoom;
        zoom = newZoom;
        cameraX = centerX - worldX * zoom;
        cameraY = centerY - worldY * zoom;
        clampCamera();
        document.getElementById('zoom-text').textContent = Math.round(zoom * 100) + '%';
        lastTouchDist = currentDist;
    }
}

function handleTouchEnd() {
    isDragging = false;
    initialPinchDist = null;
    lastTouchDist = 0;
}

function handleMiniMapClick(e) {
    const rect = miniCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / miniCanvas.width;
    const y = (e.clientY - rect.top) / miniCanvas.height;
    const radius = CONFIG.BASE_HEX_RADIUS * zoom;
    const totalW = Math.sqrt(3) * radius * CONFIG.COLS;
    const totalH = (3/2) * radius * CONFIG.ROWS;
    cameraX = canvas.width / 2 - x * totalW;
    cameraY = canvas.height / 2 - y * totalH;
    clampCamera();
}

function updateNationInfo() {
    if (!game) return;
    const nation = game.nations[game.playerNationId];
    if (!nation) return;
    document.getElementById('nation-name-display').textContent = nation.name;
    document.getElementById('nation-color-display').style.background = nation.color;
}
