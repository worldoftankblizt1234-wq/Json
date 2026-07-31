// =============================================
// AGE OF HISTORY - EUROPE MODERN
// Game Engine v1.0
// =============================================

// ============== CẤU HÌNH ==============
const CONFIG = {
    GITHUB_RAW: 'https://raw.githubusercontent.com/yourusername/yourgame/main/data/',
    MAP_SIZE: { width: 1200, height: 800 },
    TURN_DURATION: 1000, // ms mỗi lượt
    DEBUG: true
};

// ============== DỮ LIỆU GAME ==============
const GameData = {
    units: null,
    techTree: null,
    countries: null,
    mapData: null,
    gameState: {
        turn: 0,
        currentCountry: 'france',
        selectedProvince: null,
        phase: 'peacetime' // peacetime | wartime | diplomacy
    },
    resources: {
        gold: 1000,
        manpower: 10000,
        oil: 500,
        steel: 300,
        aluminum: 200,
        ammo: 1000,
        uranium: 0
    },
    provinces: {},
    countries: {},
    wars: [],
    diplomacy: {},
    techLevels: {},
    armyMovements: []
};

// ============== LOAD DỮ LIỆU ==============
async function loadGameData() {
    console.log('🔄 Đang tải dữ liệu game...');
    
    try {
        const [units, techTree, countries] = await Promise.all([
            fetch(`${CONFIG.GITHUB_RAW}units.json?t=${Date.now()}`).then(r => {
                if (!r.ok) throw new Error(`Units load failed: ${r.status}`);
                return r.json();
            }),
            fetch(`${CONFIG.GITHUB_RAW}techTree.json?t=${Date.now()}`).then(r => {
                if (!r.ok) throw new Error(`TechTree load failed: ${r.status}`);
                return r.json();
            }),
            fetch(`${CONFIG.GITHUB_RAW}countries.json?t=${Date.now()}`).then(r => {
                if (!r.ok) throw new Error(`Countries load failed: ${r.status}`);
                return r.json();
            })
        ]);
        
        GameData.units = units;
        GameData.techTree = techTree;
        GameData.countries = countries;
        
        // Khởi tạo dữ liệu mẫu cho các tỉnh
        initializeProvinces();
        
        console.log('✅ Tất cả dữ liệu đã được tải!');
        console.log(`📦 Units: ${Object.keys(units.unitTypes).length} loại`);
        console.log(`🧬 TechTree: ${Object.keys(techTree).length} nhánh`);
        console.log(`🌍 Countries: ${Object.keys(countries).length} quốc gia`);
        
        // Khởi tạo game
        initGame();
        
    } catch (error) {
        console.error('❌ Lỗi tải dữ liệu:', error);
        document.getElementById('loading').innerHTML = `
            <div style="color:red; text-align:center; padding:50px;">
                <h2>❌ Không thể tải dữ liệu từ GitHub!</h2>
                <p>Vui lòng kiểm tra đường dẫn hoặc kết nối internet.</p>
                <p style="font-size:12px; color:#666;">Chi tiết lỗi: ${error.message}</p>
                <button onclick="location.reload()" style="margin-top:20px; padding:10px 20px; cursor:pointer;">
                    🔄 Thử lại
                </button>
            </div>
        `;
    }
}

// ============== KHỞI TẠO PROVINCE MẪU ==============
function initializeProvinces() {
    // Dữ liệu mẫu cho các tỉnh Châu Âu
    const sampleProvinces = {
        'france_paris': {
            name: 'Paris',
            country: 'france',
            development: 'veryHigh',
            population: 12000000,
            garrison: 0,
            buildings: ['barracks', 'fortress'],
            units: {
                light_infantry: 200,
                mechanized_infantry: 100
            },
            x: 400,
            y: 300,
            color: '#1a6b8a'
        },
        'germany_berlin': {
            name: 'Berlin',
            country: 'germany',
            development: 'veryHigh',
            population: 8000000,
            garrison: 0,
            buildings: ['barracks', 'factory'],
            units: {
                light_infantry: 150,
                mechanized_infantry: 200,
                main_battle_tank: 50
            },
            x: 550,
            y: 280,
            color: '#2b7a2b'
        },
        'uk_london': {
            name: 'London',
            country: 'uk',
            development: 'veryHigh',
            population: 9000000,
            garrison: 0,
            buildings: ['barracks', 'port', 'fortress'],
            units: {
                marines: 100,
                light_infantry: 120,
                destroyer: 10
            },
            x: 320,
            y: 250,
            color: '#1a4a8a'
        },
        'poland_warsaw': {
            name: 'Warsaw',
            country: 'poland',
            development: 'medium',
            population: 5000000,
            garrison: 0,
            buildings: ['barracks'],
            units: {
                light_infantry: 100,
                howitzer: 30
            },
            x: 600,
            y: 310,
            color: '#8a2a2a'
        },
        'ukraine_kiev': {
            name: 'Kiev',
            country: 'ukraine',
            development: 'medium',
            population: 4000000,
            garrison: 0,
            buildings: ['barracks'],
            units: {
                light_infantry: 80,
                main_battle_tank: 20
            },
            x: 680,
            y: 340,
            color: '#6a8a2a'
        },
        'russia_moscow': {
            name: 'Moscow',
            country: 'russia',
            development: 'high',
            population: 15000000,
            garrison: 0,
            buildings: ['barracks', 'factory', 'fortress'],
            units: {
                light_infantry: 300,
                mechanized_infantry: 200,
                main_battle_tank: 150,
                fighter: 50
            },
            x: 850,
            y: 250,
            color: '#5a2a6a'
        },
        'italy_rome': {
            name: 'Rome',
            country: 'italy',
            development: 'high',
            population: 6000000,
            garrison: 0,
            buildings: ['barracks', 'port'],
            units: {
                light_infantry: 120,
                marines: 50
            },
            x: 450,
            y: 420,
            color: '#8a4a1a'
        },
        'spain_madrid': {
            name: 'Madrid',
            country: 'spain',
            development: 'high',
            population: 5000000,
            garrison: 0,
            buildings: ['barracks'],
            units: {
                light_infantry: 100,
                mechanized_infantry: 50
            },
            x: 280,
            y: 430,
            color: '#8a1a1a'
        }
    };
    
    GameData.provinces = sampleProvinces;
}

// ============== KHỞI TẠO GAME ==============
function initGame() {
    console.log('🎮 Game đang khởi tạo...');
    
    // Ẩn loading, hiện game
    document.getElementById('loading').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'flex';
    
    // Render bản đồ
    renderMap();
    
    // Cập nhật UI
    updateUI();
    
    // Bắt đầu vòng lặp game
    gameLoop();
    
    console.log('✅ Game đã sẵn sàng!');
}

// ============== RENDER BẢN ĐỒ ==============
function renderMap() {
    const mapContainer = document.getElementById('mapContainer');
    mapContainer.innerHTML = '';
    
    // Vẽ bản đồ SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', CONFIG.MAP_SIZE.width);
    svg.setAttribute('height', CONFIG.MAP_SIZE.height);
    svg.style.border = '2px solid #333';
    svg.style.borderRadius = '8px';
    svg.style.backgroundColor = '#1a3a5a';
    
    // Vẽ các tỉnh
    Object.entries(GameData.provinces).forEach(([id, province]) => {
        // Tạo polygon cho tỉnh (hình chữ nhật đơn giản cho demo)
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const size = 60 + Math.random() * 40;
        rect.setAttribute('x', province.x - size/2);
        rect.setAttribute('y', province.y - size/2);
        rect.setAttribute('width', size);
        rect.setAttribute('height', size);
        rect.setAttribute('fill', province.color);
        rect.setAttribute('stroke', '#fff');
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '4');
        rect.setAttribute('data-province', id);
        
        // Sự kiện click
        rect.addEventListener('click', () => selectProvince(id));
        rect.addEventListener('mouseenter', () => highlightProvince(id, true));
        rect.addEventListener('mouseleave', () => highlightProvince(id, false));
        
        svg.appendChild(rect);
        
        // Tên tỉnh
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', province.x);
        text.setAttribute('y', province.y - 10);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', 'bold');
        text.textContent = province.name;
        svg.appendChild(text);
        
        // Số quân
        const unitsCount = Object.values(province.units).reduce((a,b) => a+b, 0);
        const unitsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        unitsText.setAttribute('x', province.x);
        unitsText.setAttribute('y', province.y + 15);
        unitsText.setAttribute('text-anchor', 'middle');
        unitsText.setAttribute('fill', '#ffdd44');
        unitsText.setAttribute('font-size', '10');
        unitsText.textContent = `🪖 ${unitsCount}`;
        svg.appendChild(unitsText);
    });
    
    mapContainer.appendChild(svg);
}

// ============== TƯƠNG TÁC BẢN ĐỒ ==============
function selectProvince(provinceId) {
    GameData.gameState.selectedProvince = provinceId;
    const province = GameData.provinces[provinceId];
    
    if (!province) return;
    
    console.log(`📍 Đã chọn: ${province.name} (${province.country})`);
    updateProvinceInfo(provinceId);
    updateUI();
}

function highlightProvince(provinceId, isHighlighted) {
    const svg = document.querySelector('#mapContainer svg');
    const rects = svg.querySelectorAll('rect');
    rects.forEach(rect => {
        if (rect.dataset.province === provinceId) {
            rect.setAttribute('stroke', isHighlighted ? '#ffdd44' : '#fff');
            rect.setAttribute('stroke-width', isHighlighted ? '4' : '2');
        }
    });
}

// ============== UI UPDATE ==============
function updateUI() {
    // Cập nhật tài nguyên
    document.getElementById('goldDisplay').textContent = GameData.resources.gold;
    document.getElementById('manpowerDisplay').textContent = GameData.resources.manpower;
    document.getElementById('oilDisplay').textContent = GameData.resources.oil;
    document.getElementById('steelDisplay').textContent = GameData.resources.steel;
    document.getElementById('turnDisplay').textContent = GameData.gameState.turn;
    
    // Cập nhật thông tin tỉnh
    if (GameData.gameState.selectedProvince) {
        updateProvinceInfo(GameData.gameState.selectedProvince);
    }
}

function updateProvinceInfo(provinceId) {
    const province = GameData.provinces[provinceId];
    if (!province) return;
    
    const info = document.getElementById('provinceInfo');
    const unitsList = Object.entries(province.units)
        .map(([type, count]) => {
            const unitDef = getUnitDef(type);
            return `<li>${unitDef ? unitDef.name : type}: ${count}</li>`;
        })
        .join('');
    
    info.innerHTML = `
        <h3>📍 ${province.name}</h3>
        <p><strong>Quốc gia:</strong> ${getCountryName(province.country)}</p>
        <p><strong>Dân số:</strong> ${province.population.toLocaleString()}</p>
        <p><strong>Phát triển:</strong> ${province.development}</p>
        <p><strong>Quân đồn trú:</strong> ${Object.values(province.units).reduce((a,b) => a+b, 0)}</p>
        <div>
            <strong>Đơn vị:</strong>
            <ul>${unitsList}</ul>
        </div>
        <div style="margin-top:10px;">
            <h4>🎯 Hành động:</h4>
            <button onclick="showRecruitMenu('${provinceId}')">Tuyển quân</button>
            <button onclick="buildBuilding('${provinceId}')">Xây dựng</button>
            <button onclick="declareWar('${provinceId}')">Tuyên chiến</button>
        </div>
    `;
}

// ============== HÀM TIỆN ÍCH ==============
function getCountryName(countryId) {
    if (GameData.countries[countryId]) {
        return GameData.countries[countryId].name;
    }
    return countryId.charAt(0).toUpperCase() + countryId.slice(1);
}

function getUnitDef(type) {
    for (const category of Object.values(GameData.units.unitTypes)) {
        if (category.categories && category.categories[type]) {
            return category.categories[type];
        }
    }
    return null;
}

function getRecruitmentCapacity(province) {
    const base = 100;
    const bonuses = {
        low: 50,
        medium: 100,
        high: 200,
        veryHigh: 300
    };
    return base + (bonuses[province.development] || 0);
}

// ============== TUYỂN QUÂN ==============
function showRecruitMenu(provinceId) {
    const province = GameData.provinces[provinceId];
    if (!province) return;
    
    const modal = document.getElementById('recruitModal');
    const content = document.getElementById('recruitContent');
    
    const currentTotal = Object.values(province.units).reduce((a,b) => a+b, 0);
    const capacity = getRecruitmentCapacity(province);
    
    let html = `
        <h3>Tuyển quân tại ${province.name}</h3>
        <p>Sức chứa: ${currentTotal}/${capacity}</p>
        <p>💰 Vàng: ${GameData.resources.gold} | 👤 Nhân lực: ${GameData.resources.manpower}</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
    `;
    
    // Hiển thị các đơn vị có thể tuyển
    Object.entries(GameData.units.unitTypes).forEach(([categoryKey, category]) => {
        Object.entries(category.categories).forEach(([unitKey, unit]) => {
            const canAfford = GameData.resources.gold >= (unit.cost.gold || 0);
            const hasManpower = GameData.resources.manpower >= (unit.cost.manpower || 0);
            const canRecruit = canAfford && hasManpower && currentTotal < capacity;
            
            html += `
                <div style="border:1px solid #444; padding:10px; border-radius:4px; ${!canRecruit ? 'opacity:0.5;' : ''}">
                    <strong>${unit.name}</strong>
                    <div style="font-size:12px; color:#aaa;">
                        ⚔️ ${unit.baseStats.attack} 🛡️ ${unit.baseStats.defense}
                    </div>
                    <div style="font-size:12px; color:#ffd700;">
                        💰 ${unit.cost.gold || 0} | 👤 ${unit.cost.manpower || 0}
                    </div>
                    <div style="margin-top:5px;">
                        <input type="number" id="qty_${unitKey}" value="100" min="1" max="1000" style="width:60px;">
                        <button onclick="recruitUnits('${provinceId}', '${unitKey}')" ${!canRecruit ? 'disabled' : ''}>
                            Tuyển
                        </button>
                    </div>
                    ${unit.techRequired ? `<div style="font-size:10px; color:#888;">🔬 ${unit.techRequired}</div>` : ''}
                </div>
            `;
        });
    });
    
    html += `</div><button onclick="closeModal('recruitModal')" style="margin-top:10px;">Đóng</button>`;
    content.innerHTML = html;
    modal.style.display = 'block';
}

function recruitUnits(provinceId, unitType) {
    const province = GameData.provinces[provinceId];
    const qtyInput = document.getElementById(`qty_${unitType}`);
    const quantity = parseInt(qtyInput.value) || 100;
    
    if (quantity <= 0) {
        alert('Số lượng phải lớn hơn 0!');
        return;
    }
    
    const unitDef = getUnitDef(unitType);
    if (!unitDef) {
        alert('Không tìm thấy đơn vị này!');
        return;
    }
    
    // Kiểm tra sức chứa
    const currentTotal = Object.values(province.units).reduce((a,b) => a+b, 0);
    const capacity = getRecruitmentCapacity(province);
    if (currentTotal + quantity > capacity) {
        alert(`Tỉnh đã đầy! Sức chứa tối đa: ${capacity}`);
        return;
    }
    
    // Kiểm tra chi phí
    const goldCost = (unitDef.cost.gold || 0) * quantity;
    const manpowerCost = (unitDef.cost.manpower || 0) * quantity;
    const oilCost = (unitDef.cost.oil || 0) * quantity;
    
    if (GameData.resources.gold < goldCost) {
        alert(`Không đủ vàng! Cần ${goldCost} vàng`);
        return;
    }
    if (GameData.resources.manpower < manpowerCost) {
        alert(`Không đủ nhân lực! Cần ${manpowerCost} nhân lực`);
        return;
    }
    if (GameData.resources.oil < oilCost) {
        alert(`Không đủ dầu! Cần ${oilCost} dầu`);
        return;
    }
    
    // Trừ tài nguyên
    GameData.resources.gold -= goldCost;
    GameData.resources.manpower -= manpowerCost;
    GameData.resources.oil -= oilCost;
    
    // Thêm quân
    if (!province.units[unitType]) {
        province.units[unitType] = 0;
    }
    province.units[unitType] += quantity;
    
    console.log(`✅ Đã tuyển ${quantity} ${unitDef.name} tại ${province.name}`);
    
    // Cập nhật UI
    updateUI();
    renderMap();
    showRecruitMenu(provinceId);
}

// ============== XÂY DỰNG ==============
function buildBuilding(provinceId) {
    const province = GameData.provinces[provinceId];
    if (!province) return;
    
    const buildings = [
        { name: 'Doanh trại', cost: 200, effect: '+50 sức chứa quân' },
        { name: 'Pháo đài', cost: 300, effect: '+10 phòng thủ' },
        { name: 'Nhà máy', cost: 400, effect: '+20 vàng/turn' },
        { name: 'Cảng', cost: 500, effect: 'Cho phép đóng tàu' }
    ];
    
    let html = `<h3>Xây dựng tại ${province.name}</h3>`;
    buildings.forEach((building, index) => {
        const canAfford = GameData.resources.gold >= building.cost;
        html += `
            <div style="border:1px solid #444; padding:10px; margin:5px 0; border-radius:4px; ${!canAfford ? 'opacity:0.5;' : ''}">
                <strong>${building.name}</strong>
                <div>💰 ${building.cost} vàng</div>
                <div style="font-size:12px; color:#aaa;">${building.effect}</div>
                <button onclick="confirmBuild('${provinceId}', ${index})" ${!canAfford ? 'disabled' : ''}>
                    Xây
                </button>
            </div>
        `;
    });
    html += `<button onclick="closeModal('buildModal')">Đóng</button>`;
    
    document.getElementById('buildContent').innerHTML = html;
    document.getElementById('buildModal').style.display = 'block';
}

function confirmBuild(provinceId, buildingIndex) {
    const province = GameData.provinces[provinceId];
    const buildings = [
        { name: 'Doanh trại', cost: 200, effect: 'capacity+50' },
        { name: 'Pháo đài', cost: 300, effect: 'defense+10' },
        { name: 'Nhà máy', cost: 400, effect: 'gold+20' },
        { name: 'Cảng', cost: 500, effect: 'port' }
    ];
    
    const building = buildings[buildingIndex];
    if (!building) return;
    
    if (GameData.resources.gold < building.cost) {
        alert('Không đủ vàng!');
        return;
    }
    
    GameData.resources.gold -= building.cost;
    if (!province.buildings) province.buildings = [];
    province.buildings.push(building.name);
    
    // Áp dụng hiệu ứng
    if (building.effect === 'capacity+50') {
        // Tăng sức chứa
    } else if (building.effect === 'gold+20') {
        // Tăng vàng mỗi turn
    }
    
    alert(`Đã xây ${building.name} tại ${province.name}!`);
    updateUI();
    closeModal('buildModal');
}

// ============== CHIẾN TRANH ==============
function declareWar(provinceId) {
    const targetProvince = GameData.provinces[provinceId];
    if (!targetProvince) return;
    
    // Kiểm tra xem có đang chiến tranh với nước này không
    const existingWar = GameData.wars.find(w => 
        (w.attacker === GameData.gameState.currentCountry && w.defender === targetProvince.country) ||
        (w.attacker === targetProvince.country && w.defender === GameData.gameState.currentCountry)
    );
    
    if (existingWar) {
        alert('Đã có chiến tranh!');
        return;
    }
    
    if (confirm(`Tuyên chiến với ${targetProvince.name} (${getCountryName(targetProvince.country)})?`)) {
        GameData.wars.push({
            attacker: GameData.gameState.currentCountry,
            defender: targetProvince.country,
            startTurn: GameData.gameState.turn,
            active: true
        });
        
        console.log(`⚔️ ${getCountryName(GameData.gameState.currentCountry)} tuyên chiến với ${getCountryName(targetProvince.country)}`);
        GameData.gameState.phase = 'wartime';
        updateUI();
        alert('⚔️ Chiến tranh đã bắt đầu!');
    }
}

function resolveCombat() {
    // Chiến đấu giữa các tỉnh giáp ranh
    GameData.wars.forEach(war => {
        if (!war.active) return;
        
        // Tìm các tỉnh của attacker và defender
        const attackerProvinces = Object.entries(GameData.provinces)
            .filter(([id, p]) => p.country === war.attacker);
        const defenderProvinces = Object.entries(GameData.provinces)
            .filter(([id, p]) => p.country === war.defender);
        
        // Kiểm tra các cặp tỉnh giáp ranh (đơn giản hóa: tất cả đều đánh nhau)
        attackerProvinces.forEach(([attId, attProv]) => {
            defenderProvinces.forEach(([defId, defProv]) => {
                // Tính toán sức mạnh
                const attPower = Object.entries(attProv.units).reduce((total, [type, count]) => {
                    const def = getUnitDef(type);
                    return total + (def ? def.baseStats.attack * count : 0);
                }, 0);
                
                const defPower = Object.entries(defProv.units).reduce((total, [type, count]) => {
                    const def = getUnitDef(type);
                    return total + (def ? def.baseStats.defense * count : 0);
                }, 0);
                
                // Chiến đấu
                if (attPower > defPower * 1.2) {
                    // Attacker thắng
                    const losses = Math.floor(defPower / 10);
                    const units = Object.keys(defProv.units);
                    if (units.length > 0) {
                        const randomUnit = units[Math.floor(Math.random() * units.length)];
                        defProv.units[randomUnit] = Math.max(0, defProv.units[randomUnit] - losses);
                        console.log(`💥 ${attProv.name} tấn công ${defProv.name}, tiêu diệt ${losses} đơn vị`);
                    }
                } else if (defPower > attPower * 1.2) {
                    // Defender thắng
                    const losses = Math.floor(attPower / 10);
                    const units = Object.keys(attProv.units);
                    if (units.length > 0) {
                        const randomUnit = units[Math.floor(Math.random() * units.length)];
                        attProv.units[randomUnit] = Math.max(0, attProv.units[randomUnit] - losses);
                        console.log(`💥 ${defProv.name} phản công ${attProv.name}, tiêu diệt ${losses} đơn vị`);
                    }
                } else {
                    // Hòa
                    console.log(`⚖️ ${attProv.name} và ${defProv.name} giằng co`);
                }
            });
        });
        
        // Kiểm tra kết thúc chiến tranh
        const attackerHasUnits = Object.values(GameData.provinces)
            .filter(p => p.country === war.attacker)
            .some(p => Object.values(p.units).reduce((a,b) => a+b, 0) > 0);
        
        const defenderHasUnits = Object.values(GameData.provinces)
            .filter(p => p.country === war.defender)
            .some(p => Object.values(p.units).reduce((a,b) => a+b, 0) > 0);
        
        if (!attackerHasUnits || !defenderHasUnits) {
            war.active = false;
            console.log(`☮️ Chiến tranh kết thúc!`);
            GameData.gameState.phase = 'peacetime';
        }
    });
}

// ============== NGOẠI GIAO ==============
function diplomacyAction(action, targetCountry) {
    console.log(`📜 ${action} với ${getCountryName(targetCountry)}`);
    
    // Đơn giản hóa: các hành động ngoại giao
    switch(action) {
        case 'ally':
            if (GameData.diplomacy[targetCountry]) {
                GameData.diplomacy[targetCountry].ally = true;
                alert(`✅ Đã liên minh với ${getCountryName(targetCountry)}`);
            }
            break;
        case 'trade':
            GameData.resources.gold += 50;
            GameData.resources.manpower += 100;
            alert(`📦 Đã trao đổi thương mại với ${getCountryName(targetCountry)}`);
            break;
        case 'demand':
            if (confirm(`Yêu cầu ${getCountryName(targetCountry)} đầu hàng?`)) {
                alert(`💬 Đã gửi yêu cầu đến ${getCountryName(targetCountry)}`);
            }
            break;
        default:
            console.log(`Hành động không xác định: ${action}`);
    }
    updateUI();
}

// ============== CÔNG NGHỆ ==============
function researchTech(techId) {
    const tech = GameData.techTree[techId];
    if (!tech) {
        alert('Không tìm thấy công nghệ này!');
        return;
    }
    
    if (GameData.resources.gold < tech.cost) {
        alert(`Không đủ vàng! Cần ${tech.cost} vàng`);
        return;
    }
    
    // Kiểm tra yêu cầu
    if (tech.requires) {
        for (const req of tech.requires) {
            if (!GameData.techLevels[req]) {
                alert(`Cần nghiên cứu ${req} trước!`);
                return;
            }
        }
    }
    
    GameData.resources.gold -= tech.cost;
    GameData.techLevels[techId] = true;
    
    console.log(`🧪 Đã nghiên cứu ${tech.name}!`);
    alert(`🧪 Đã nghiên cứu ${tech.name}!`);
    updateUI();
}

// ============== VÒNG LẶP GAME ==============
function gameLoop() {
    setInterval(() => {
        // Tăng lượt
        GameData.gameState.turn++;
        
        // Tự động tăng tài nguyên
        GameData.resources.gold += 50 + Math.floor(Math.random() * 30);
        GameData.resources.manpower += 100 + Math.floor(Math.random() * 50);
        GameData.resources.oil += 10 + Math.floor(Math.random() * 20);
        GameData.resources.steel += 5 + Math.floor(Math.random() * 10);
        
        // Chiến đấu
        if (GameData.wars.some(w => w.active)) {
            resolveCombat();
        }
        
        // Cập nhật UI
        updateUI();
        
        // Log
        if (CONFIG.DEBUG && GameData.gameState.turn % 5 === 0) {
            console.log(`🔄 Turn ${GameData.gameState.turn}: 💰 ${GameData.resources.gold} | 👤 ${GameData.resources.manpower}`);
        }
        
    }, CONFIG.TURN_DURATION);
}

// ============== MODAL HELPERS ==============
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Đóng modal khi click ra ngoài
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// ============== GIAO DIỆN NGOẠI GIAO ==============
function showDiplomacy() {
    const modal = document.getElementById('diplomacyModal');
    const content = document.getElementById('diplomacyContent');
    
    let html = `<h3>🌍 Ngoại giao</h3>`;
    Object.keys(GameData.countries).forEach(countryId => {
        if (countryId === GameData.gameState.currentCountry) return;
        
        const country = GameData.countries[countryId];
        const isAlly = GameData.diplomacy[countryId]?.ally || false;
        const isAtWar = GameData.wars.some(w => 
            (w.attacker === GameData.gameState.currentCountry && w.defender === countryId) ||
            (w.attacker === countryId && w.defender === GameData.gameState.currentCountry)
        );
        
        html += `
            <div style="border:1px solid #444; padding:15px; margin:10px 0; border-radius:4px;">
                <strong>${country.name}</strong>
                <div style="font-size:12px; color:#aaa;">
                    ${isAtWar ? '⚔️ Đang chiến tranh' : isAlly ? '🤝 Đồng minh' : '😐 Trung lập'}
                </div>
                <div style="margin-top:5px;">
                    <button onclick="diplomacyAction('ally', '${countryId}')" ${isAlly ? 'disabled' : ''}>
                        🤝 Liên minh
                    </button>
                    <button onclick="diplomacyAction('trade', '${countryId}')">
                        📦 Thương mại
                    </button>
                    <button onclick="diplomacyAction('demand', '${countryId}')">
                        💬 Yêu cầu
                    </button>
                </div>
            </div>
        `;
    });
    html += `<button onclick="closeModal('diplomacyModal')">Đóng</button>`;
    content.innerHTML = html;
    modal.style.display = 'block';
}

// ============== GIAO DIỆN CÔNG NGHỆ ==============
function showTechTree() {
    const modal = document.getElementById('techModal');
    const content = document.getElementById('techContent');
    
    let html = `<h3>🧬 Cây Công Nghệ</h3>`;
    Object.entries(GameData.techTree).forEach(([techId, tech]) => {
        const isResearched = GameData.techLevels[techId] || false;
        const canResearch = GameData.resources.gold >= tech.cost && !isResearched;
        
        html += `
            <div style="border:1px solid #444; padding:15px; margin:10px 0; border-radius:4px; ${isResearched ? 'background:#2a4a2a;' : ''}">
                <strong>${tech.name}</strong>
                <div style="font-size:12px; color:#aaa;">${tech.description}</div>
                <div>💰 ${tech.cost} vàng</div>
                ${tech.requires ? `<div style="font-size:12px; color:#888;">Yêu cầu: ${tech.requires.join(', ')}</div>` : ''}
                <button onclick="researchTech('${techId}')" ${!canResearch ? 'disabled' : ''}>
                    ${isResearched ? '✅ Đã nghiên cứu' : '🔬 Nghiên cứu'}
                </button>
            </div>
        `;
    });
    html += `<button onclick="closeModal('techModal')">Đóng</button>`;
    content.innerHTML = html;
    modal.style.display = 'block';
}

// ============== KHỞI ĐỘNG GAME ==============
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra xem đã có gameContainer chưa
    if (!document.getElementById('gameContainer')) {
        console.warn('⚠️ Game container not found, creating default...');
        createDefaultUI();
    }
    loadGameData();
});

// ============== TẠO UI MẶC ĐỊNH ==============
function createDefaultUI() {
    const html = `
        <div id="loading">
            <h2>🔄 Đang tải dữ liệu game...</h2>
            <div class="loader"></div>
        </div>
        <div id="gameContainer" style="display:none; flex-direction:row; gap:20px; padding:20px; max-width:1400px; margin:0 auto;">
            <div id="leftPanel" style="flex:3;">
                <div id="topBar" style="display:flex; gap:20px; padding:10px; background:#2a2a2a; border-radius:8px; margin-bottom:10px; flex-wrap:wrap;">
                    <span>🔄 Turn: <span id="turnDisplay">0</span></span>
                    <span>💰 Vàng: <span id="goldDisplay">0</span></span>
                    <span>👤 Nhân lực: <span id="manpowerDisplay">0</span></span>
                    <span>🛢️ Dầu: <span id="oilDisplay">0</span></span>
                    <span>🔩 Thép: <span id="steelDisplay">0</span></span>
                    <button onclick="showDiplomacy()">🌍 Ngoại giao</button>
                    <button onclick="showTechTree()">🧬 Công nghệ</button>
                </div>
                <div id="mapContainer" style="background:#1a3a5a; border-radius:8px; padding:10px;"></div>
            </div>
            <div id="rightPanel" style="flex:1; min-width:280px;">
                <div id="provinceInfo" style="background:#2a2a2a; padding:15px; border-radius:8px; min-height:200px;">
                    <p style="color:#888;">Chọn một tỉnh trên bản đồ</p>
                </div>
            </div>
        </div>
        <!-- Modals -->
        <div id="recruitModal" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1000; overflow-y:auto;">
            <div style="background:#1a1a2e; max-width:800px; margin:50px auto; padding:20px; border-radius:8px; max-height:80vh; overflow-y:auto;">
                <div id="recruitContent"></div>
            </div>
        </div>
        <div id="buildModal" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1000;">
            <div style="background:#1a1a2e; max-width:500px; margin:100px auto; padding:20px; border-radius:8px;">
                <div id="buildContent"></div>
            </div>
        </div>
        <div id="diplomacyModal" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1000;">
            <div style="background:#1a1a2e; max-width:600px; margin:50px auto; padding:20px; border-radius:8px; max-height:80vh; overflow-y:auto;">
                <div id="diplomacyContent"></div>
            </div>
        </div>
        <div id="techModal" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1000;">
            <div style="background:#1a1a2e; max-width:600px; margin:50px auto; padding:20px; border-radius:8px; max-height:80vh; overflow-y:auto;">
                <div id="techContent"></div>
            </div>
        </div>
        <style>
            body { background:#0a0a1a; color:#fff; font-family:Arial, sans-serif; margin:0; padding:20px; }
            button { background:#4a6a8a; color:#fff; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; transition:0.2s; }
            button:hover:not(:disabled) { background:#5a7a9a; transform:scale(1.02); }
            button:disabled { opacity:0.4; cursor:not-allowed; }
            .loader { border:4px solid #4a6a8a; border-top:4px solid #ffdd44; border-radius:50%; width:40px; height:40px; animation:spin 1s linear infinite; margin:20px auto; }
            @keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
            #provinceInfo ul { list-style:none; padding:0; }
            #provinceInfo ul li { padding:5px 0; border-bottom:1px solid #333; }
            ::-webkit-scrollbar { width:8px; }
            ::-webkit-scrollbar-track { background:#1a1a2e; }
            ::-webkit-scrollbar-thumb { background:#4a6a8a; border-radius:4px; }
        </style>
    `;
    document.body.innerHTML = html;
}
