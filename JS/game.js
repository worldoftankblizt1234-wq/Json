// === GAME.JS - GAME ENGINE CHÍNH ===
class AoHGame {
    constructor() {
        this.nations = {};
        this.provinces = {};
        this.isRunning = false;
        this.isPaused = false;
        this.speed = 1;
        this.lastUpdate = Date.now();
        this.gameTime = 0;
        this.selectedProvince = null;
        this.phase = 'idle';
        this.playerNationId = 10;
        this.multiplayer = null;
        this.isMultiplayer = false;
        this.autoSaveInterval = null;
        
        // Thời gian
        this.gameDate = { day: 1, month: 1, year: 701 };
        this.dateUpdateCounter = 0;
        
        // Chính sách quốc gia
        this.policies = {
            tax: 20,
            goods: 50,
            welfare: 30,
            research: 20
        };
        
        // Lạm phát
        this.inflation = 0;
        
        // Thống kê
        this.stats = {
            totalProvincesConquered: 0,
            totalBattlesWon: 0,
            totalBattlesLost: 0,
            totalGoldEarned: 0,
            totalArmyRecruited: 0,
            totalBuildingsBuilt: 0,
            startTime: Date.now(),
            endTime: null,
            duration: 0
        };
    }

    // === KHỞI TẠO ===
    init(multiplayerMode = false) {
        this.isMultiplayer = multiplayerMode;
        this.initNations();
        this.initProvinces();
        this.isRunning = true;
        this.lastUpdate = Date.now();
        this.gameTime = 0;
        
        if (this.isMultiplayer) {
            this.multiplayer = multiplayer;
            this.multiplayer.connect();
            setTimeout(() => this.syncToServer(), 1000);
        }
        
        this.autoSaveInterval = setInterval(() => this.autoSave(), 5000);
        this.gameLoop();
    }

    // === KHỞI TẠO QUỐC GIA ===
    initNations() {
        const playerNations = JSON.parse(localStorage.getItem('aoh_player_nations') || '[]');
        const aiNations = JSON.parse(localStorage.getItem('aoh_ai_nations') || '[]');
        const players = JSON.parse(localStorage.getItem('aoh_players') || '[]');
        
        const playerMap = {};
        players.forEach(p => { playerMap[p.nationId] = p.playerName; });
        
        for (const n of NATIONS) {
            const isPlayer = playerNations.includes(n.id);
            const isAI = aiNations.includes(n.id) || (!isPlayer && !playerNations.includes(n.id));
            const gold = CONFIG.START_GOLD_MIN + Math.floor(Math.random() * (CONFIG.START_GOLD_MAX - CONFIG.START_GOLD_MIN));
            const playerName = playerMap[n.id] || null;
            
            this.nations[n.id] = {
                ...n,
                gold: gold,
                population: 500000 + Math.floor(Math.random() * 500000),
                provinces: [],
                buildings: [],
                army: 0,
                isPlayer: isPlayer,
                isAI: isAI,
                playerName: playerName,
                isAlive: true,
                defeatedAt: null,
                scienceLevel: CONFIG.SCIENCE_START,
                happiness: 75,
                inflation: 0,
                policies: { ...this.policies }
            };
        }
    }

    // === KHỞI TẠO TỈNH ===
    initProvinces() {
        this.provinces = {};
        const provinceIndices = {};
        for (let i = 0; i < CONFIG.COLS * CONFIG.ROWS; i++) {
            const pNum = provinceNum[i];
            if (pNum !== 0) {
                if (!provinceIndices[pNum]) provinceIndices[pNum] = [];
                provinceIndices[pNum].push(i);
            }
        }
        for (const [pNum, indices] of Object.entries(provinceIndices)) {
            const idx = indices[0];
            const type = mapType[idx];
            const isCapital = Object.values(CAPITALS).some(c => c.provinceNum === parseInt(pNum));
            const pop = Math.floor(Math.random() * 50000) + 10000;
            this.provinces[parseInt(pNum)] = {
                id: parseInt(pNum),
                nationId: type,
                population: pop,
                army: 0,
                buildings: [],
                isCapital: isCapital,
                development: CONFIG.SCIENCE_START,
                capitalName: isCapital ? Object.keys(CAPITALS).find(k => CAPITALS[k].provinceNum === parseInt(pNum)) : null
            };
            if (isCapital) {
                const nationId = Object.keys(CAPITALS).find(k => CAPITALS[k].provinceNum === parseInt(pNum));
                if (nationId) {
                    const army = Math.floor(Math.random() * 1500) + 500;
                    this.provinces[parseInt(pNum)].army = army;
                    this.nations[parseInt(nationId)].army = army;
                }
            }
            if (type >= 10 && this.nations[type]) {
                this.nations[type].provinces.push(parseInt(pNum));
            }
        }
        provinceArmies = {};
        for (const [pNum, province] of Object.entries(this.provinces)) {
            provinceArmies[parseInt(pNum)] = province.army || 0;
        }
    }

    // === VÒNG LẶP GAME ===
    gameLoop() {
        if (!this.isRunning) return;
        const now = Date.now();
        const delta = (now - this.lastUpdate) / 1000 * this.speed;
        this.lastUpdate = now;
        
        if (!this.isPaused) {
            this.gameTime += delta;
            this.updateDate(delta);
            this.update(delta);
        }
        
        renderMap();
        updateUI();
        
        if (this.isMultiplayer && this.multiplayer && this.multiplayer.isConnected) {
            if (this.gameTime % 2 < delta) this.syncToServer();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    // === CẬP NHẬT THỜI GIAN ===
    updateDate(delta) {
        this.dateUpdateCounter += delta;
        if (this.dateUpdateCounter >= 1) {
            this.dateUpdateCounter = 0;
            this.gameDate.day++;
            if (this.gameDate.day > 30) {
                this.gameDate.day = 1;
                this.gameDate.month++;
                if (this.gameDate.month > 12) {
                    this.gameDate.month = 1;
                    this.gameDate.year++;
                }
            }
            document.getElementById('game-date').textContent = 
                `${String(this.gameDate.day).padStart(2, '0')}/${String(this.gameDate.month).padStart(2, '0')}/${this.gameDate.year}`;
        }
    }

    // === CẬP NHẬT GAME ===
    update(delta) {
        for (const [id, nation] of Object.entries(this.nations)) {
            if (!nation.isAlive) continue;
            
            // Tính thu nhập
            const income = this.calculateIncome(nation);
            nation.gold += income * delta;
            
            // Cập nhật dân số
            this.updatePopulation(nation, delta);
            
            // Cập nhật KH
            this.updateScience(nation, delta);
            
            // Cập nhật lạm phát
            this.updateInflation(nation, delta);
            
            // Trừ chi phí duy trì quân
            this.updateUpkeep(nation, delta);
            
            // Kiểm tra biểu tình
            this.checkProtests(nation, delta);
            
            // AI
            if (nation.isAI && !nation.isPlayer) {
                aiAction(nation, delta, this);
            }
        }
        this.updateNotifications();
        this.checkWinCondition();
    }

    // === TÍNH THU NHẬP ===
    calculateIncome(nation) {
        const p = nation.policies || this.policies;
        const taxIncome = (p.tax || 20) * 100;
        const goodsIncome = (p.goods || 50) * 50;
        const welfareCost = (p.welfare || 30) * 20;
        const researchCost = (p.research || 20) * 10;
        
        // Thu nhập từ công trình
        let buildingIncome = 0;
        for (const provinceId of nation.provinces) {
            const province = this.provinces[provinceId];
            if (!province) continue;
            for (const buildingId of province.buildings) {
                const building = BUILDINGS[buildingId];
                if (building && building.goldPerSecond) {
                    buildingIncome += building.goldPerSecond;
                }
                if (building && building.effect === 'income_boost') {
                    buildingIncome *= (1 + building.value);
                }
            }
        }
        
        return taxIncome + goodsIncome - welfareCost - researchCost + buildingIncome;
    }

    // === CẬP NHẬT DÂN SỐ ===
    updatePopulation(nation, delta) {
        let popGrowth = 0;
        for (const provinceId of nation.provinces) {
            const province = this.provinces[provinceId];
            if (!province) continue;
            for (const buildingId of province.buildings) {
                const building = BUILDINGS[buildingId];
                if (building && building.popPerSecond) popGrowth += building.popPerSecond;
            }
            popGrowth += province.population * 0.001;
        }
        for (const provinceId of nation.provinces) {
            const province = this.provinces[provinceId];
            if (province) {
                province.population += (popGrowth / Math.max(1, nation.provinces.length)) * delta;
                province.population = Math.floor(province.population);
            }
        }
    }

    // === CẬP NHẬT KHOA HỌC ===
    updateScience(nation, delta) {
        let scienceGrowth = 0;
        for (const provinceId of nation.provinces) {
            const province = this.provinces[provinceId];
            if (!province) continue;
            for (const buildingId of province.buildings) {
                const building = BUILDINGS[buildingId];
                if (building && building.sciencePerSecond) {
                    scienceGrowth += building.sciencePerSecond;
                }
            }
        }
        // Research policy boost
        const researchBoost = (nation.policies?.research || 20) / 1000;
        scienceGrowth += researchBoost * delta;
        
        nation.scienceLevel = Math.min(CONFIG.SCIENCE_MAX, nation.scienceLevel + scienceGrowth * delta);
        // Cập nhật development cho các tỉnh
        for (const provinceId of nation.provinces) {
            const province = this.provinces[provinceId];
            if (province) {
                province.development = Math.min(nation.scienceLevel, CONFIG.SCIENCE_MAX);
            }
        }
    }

    // === CẬP NHẬT LẠM PHÁT ===
    updateInflation(nation, delta) {
        // Lạm phát tăng theo chi tiêu
        let inflationRate = 0.001;
        
        // Giảm lạm phát từ công trình
        let inflationReduce = 0;
        for (const provinceId of nation.provinces) {
            const province = this.provinces[provinceId];
            if (!province) continue;
            for (const buildingId of province.buildings) {
                const building = BUILDINGS[buildingId];
                if (building && building.effect === 'gold_income') {
                    inflationReduce += 0.002;
                }
            }
        }
        
        nation.inflation = Math.max(0, nation.inflation + inflationRate * delta - inflationReduce * delta);
        nation.inflation = Math.min(100, nation.inflation);
    }

    // === CẬP NHẬT CHI PHÍ DUY TRÌ QUÂN ===
    updateUpkeep(nation, delta) {
        const army = nation.army || 0;
        const upkeepCost = army * 0.1 * (1 + army / 10000) * delta;
        nation.gold -= upkeepCost;
        
        // Nếu hết tiền, quân bỏ chạy
        if (nation.gold < 0) {
            const deserters = Math.min(army, Math.floor(army * 0.05 * delta));
            nation.army -= deserters;
            // Cập nhật quân số các tỉnh
            for (const provinceId of nation.provinces) {
                const province = this.provinces[provinceId];
                if (province && province.army > 0) {
                    const ratio = province.army / army;
                    province.army -= Math.floor(deserters * ratio);
                    if (province.army < 0) province.army = 0;
                }
            }
            nation.gold = 0;
        }
    }

    // === KIỂM TRA BIỂU TÌNH ===
    checkProtests(nation, delta) {
        // Kiểm tra có Political Center không
        let hasPoliticalCenter = false;
        for (const provinceId of nation.provinces) {
            const province = this.provinces[provinceId];
            if (province && province.buildings.includes('political_center')) {
                hasPoliticalCenter = true;
                break;
            }
        }
        
        if (!hasPoliticalCenter && Math.random() < 0.01 * delta) {
            // Biểu tình
            nation.happiness = Math.max(0, nation.happiness - 5);
            nation.gold -= 100;
            for (const provinceId of nation.provinces) {
                const province = this.provinces[provinceId];
                if (province) {
                    province.population = Math.floor(province.population * 0.99);
                }
            }
            showToast(`⚠️ Biểu tình tại ${nation.name}! Mất 5% hạnh phúc`, 'error');
        }
    }

    // === CẬP NHẬT THÔNG BÁO ===
    updateNotifications() {
        const notification = document.getElementById('notification-text');
        const content = document.getElementById('notification-content');
        if (!notification || !content) return;
        
        const player = this.nations[this.playerNationId];
        if (!player) return;
        
        let messages = [];
        if (player.inflation > 30) messages.push(`Lạm phát ${Math.round(player.inflation)}%`);
        if (player.happiness < 40) messages.push(`Hạnh phúc thấp ${Math.round(player.happiness)}%`);
        if (player.gold < 0) messages.push(`Nợ ${Math.round(Math.abs(player.gold))} vàng`);
        
        if (messages.length > 0) {
            notification.classList.remove('hidden');
            content.textContent = messages.join(' | ');
        } else {
            notification.classList.add('hidden');
        }
    }

    // === KIỂM TRA ĐIỀU KIỆN THẮNG ===
    checkWinCondition() {
        const player = this.nations[this.playerNationId];
        if (!player) return false;
        
        const totalProvinces = Object.keys(this.provinces).length;
        const playerProvinces = player.provinces?.length || 0;
        
        // Kiểm tra mất Political Center
        let hasPoliticalCenter = false;
        for (const provinceId of player.provinces) {
            const province = this.provinces[provinceId];
            if (province && province.buildings.includes('political_center')) {
                hasPoliticalCenter = true;
                break;
            }
        }
        
        if (!hasPoliticalCenter && player.provinces.length > 0) {
            // Mất trung tâm chính trị → cả nước thất thủ
            this.endGame('defeat');
            return true;
        }
        
        if (playerProvinces === 0) {
            this.endGame('defeat');
            return true;
        }
        
        if (playerProvinces >= totalProvinces * 0.8) {
            this.endGame('victory');
            return true;
        }
        
        return false;
    }

    // === TUYỂN QUÂN ===
    recruitTroops(provinceId, amount) {
        const province = this.provinces[provinceId];
        if (!province) return { success: false, message: 'Tỉnh không tồn tại' };
        const nation = this.nations[province.nationId];
        if (!nation) return { success: false, message: 'Quốc gia không tồn tại' };
        if (!nation.isAlive) return { success: false, message: 'Quốc gia đã bị tiêu diệt' };
        if (nation.gold < 0) return { success: false, message: '❌ Đang nợ, không thể tuyển quân!' };
        
        // Kiểm tra giới hạn 70% kho bạc
        const maxRecruit = Math.floor((nation.gold * 0.7) / CONFIG.RECRUIT_COST_GOLD);
        if (amount > maxRecruit) {
            return { success: false, message: `❌ Tối đa ${maxRecruit} quân (70% kho bạc)` };
        }
        
        let costPerUnit = CONFIG.RECRUIT_COST_GOLD;
        let popPerUnit = CONFIG.RECRUIT_COST_POP;
        for (const buildingId of province.buildings) {
            const building = BUILDINGS[buildingId];
            if (building && building.effect === 'reduce_recruit_cost') {
                costPerUnit *= (1 - building.value);
                popPerUnit *= (1 - building.value);
            }
        }
        // Ảnh hưởng lạm phát
        costPerUnit *= (1 + nation.inflation / 100);
        
        costPerUnit = Math.ceil(costPerUnit);
        popPerUnit = Math.ceil(popPerUnit);
        const costGold = amount * costPerUnit;
        const costPop = amount * popPerUnit;
        
        if (nation.gold < costGold) {
            return { success: false, message: `Không đủ tiền! Cần ${costGold} vàng` };
        }
        if (province.population < costPop) {
            return { success: false, message: `Không đủ dân! Cần ${costPop} dân` };
        }
        
        nation.gold -= costGold;
        province.population -= costPop;
        province.army += amount;
        nation.army += amount;
        this.stats.totalArmyRecruited += amount;
        if (this.isMultiplayer) this.syncToServer();
        
        return { success: true, message: `✅ Tuyển ${amount} quân (💰${costGold} + 👤${costPop} dân)`, amount, costGold, costPop };
    }

    // === GIẢI TÁN QUÂN ===
    disbandTroops(provinceId) {
        const province = this.provinces[provinceId];
        if (!province) return { success: false, message: 'Tỉnh không tồn tại' };
        const nation = this.nations[province.nationId];
        if (!nation) return { success: false, message: 'Quốc gia không tồn tại' };
        if (province.army <= 0) return { success: false, message: 'Không có quân để giải tán' };
        
        const army = province.army;
        const goldReturn = Math.floor(army * CONFIG.RECRUIT_COST_GOLD * 0.5);
        const popReturn = Math.floor(army * CONFIG.RECRUIT_COST_POP * 0.5);
        
        province.army = 0;
        nation.army -= army;
        if (nation.army < 0) nation.army = 0;
        nation.gold += goldReturn;
        province.population += popReturn;
        
        if (this.isMultiplayer) this.syncToServer();
        return { success: true, message: `✅ Giải tán ${army} quân, nhận ${goldReturn} vàng + ${popReturn} dân` };
    }

    // === DI CHUYỂN QUÂN ===
    moveTroops(fromProvinceId, toProvinceId) {
        const fromProvince = this.provinces[fromProvinceId];
        const toProvince = this.provinces[toProvinceId];
        if (!fromProvince || !toProvince) return { success: false, message: 'Tỉnh không tồn tại' };
        if (fromProvince.nationId !== toProvince.nationId) return { success: false, message: '❌ Khác quốc gia!' };
        if (fromProvince.army <= 0) return { success: false, message: '❌ Không có quân!' };
        
        const moveAmount = Math.floor(fromProvince.army / 2);
        fromProvince.army -= moveAmount;
        toProvince.army += moveAmount;
        if (this.isMultiplayer) this.syncToServer();
        
        return { success: true, message: `✅ Di chuyển ${moveAmount} quân`, amount: moveAmount };
    }

    // === TẤN CÔNG ===
    attack(fromProvinceId, toProvinceId) {
        const fromProvince = this.provinces[fromProvinceId];
        const toProvince = this.provinces[toProvinceId];
        if (!fromProvince || !toProvince) return { success: false, message: 'Tỉnh không tồn tại' };
        if (fromProvince.nationId === toProvince.nationId) return { success: false, message: '❌ Đây là tỉnh của bạn!' };
        if (fromProvince.army <= 0) return { success: false, message: '❌ Không có quân để tấn công!' };
        
        const fromNation = this.nations[fromProvince.nationId];
        const toNation = this.nations[toProvince.nationId];
        const attacker = fromProvince.army;
        const defender = toProvince.army || 0;
        
        // Phòng thủ từ công trình
        let defenseBoost = 0;
        for (const buildingId of toProvince.buildings) {
            const building = BUILDINGS[buildingId];
            if (building && building.effect === 'defense_boost') defenseBoost += building.value;
        }
        const defendPower = defender * (1 + defenseBoost) * (0.8 + Math.random() * 0.4);
        const attackPower = attacker * (0.8 + Math.random() * 0.4);
        
        if (attackPower > defendPower) {
            const remaining = Math.floor(attacker * 0.6);
            fromProvince.army = remaining;
            const oldNationId = toProvince.nationId;
            toProvince.nationId = fromProvince.nationId;
            toProvince.army = Math.floor(attacker * 0.3);
            
            // Cập nhật danh sách tỉnh
            if (fromNation) {
                fromNation.provinces.push(toProvinceId);
                fromNation.army = Object.values(this.provinces)
                    .filter(p => p.nationId === fromProvince.nationId)
                    .reduce((sum, p) => sum + p.army, 0);
            }
            if (toNation) {
                toNation.provinces = toNation.provinces.filter(id => id !== toProvinceId);
                toNation.army = Object.values(this.provinces)
                    .filter(p => p.nationId === oldNationId)
                    .reduce((sum, p) => sum + p.army, 0);
                if (toNation.provinces.length === 0) {
                    toNation.isAlive = false;
                    toNation.defeatedAt = Date.now();
                    showToast(`💀 ${toNation.name} đã bị tiêu diệt!`, 'error');
                }
            }
            this.stats.totalBattlesWon++;
            this.stats.totalProvincesConquered++;
            if (this.isMultiplayer) this.syncToServer();
            return { success: true, message: `✅ Chiến thắng! Đã chiếm tỉnh`, remaining };
        } else {
            const remaining = Math.floor(attacker * 0.3);
            fromProvince.army = remaining;
            this.stats.totalBattlesLost++;
            if (this.isMultiplayer) this.syncToServer();
            return { success: false, message: `❌ Thua trận! Mất ${attacker - remaining} quân`, remaining };
        }
    }

    // === BỎ TỈNH ===
    abandonProvince(provinceId) {
        const province = this.provinces[provinceId];
        if (!province) return { success: false, message: 'Tỉnh không tồn tại' };
        const nation = this.nations[province.nationId];
        if (!nation) return { success: false, message: 'Quốc gia không tồn tại' };
        
        // Kiểm tra nếu là thủ đô hành chính
        if (province.buildings.includes('political_center')) {
            return { success: false, message: '❌ Không thể bỏ tỉnh có Trung tâm chính trị!' };
        }
        
        province.nationId = 0;
        province.army = 0;
        province.buildings = [];
        nation.provinces = nation.provinces.filter(id => id !== provinceId);
        nation.army = Object.values(this.provinces)
            .filter(p => p.nationId === nation.id)
            .reduce((sum, p) => sum + p.army, 0);
        
        if (this.isMultiplayer) this.syncToServer();
        return { success: true, message: `✅ Đã bỏ tỉnh ${provinceId}` };
    }

    // === XÂY CÔNG TRÌNH ===
    buildBuilding(provinceId, buildingId) {
        const province = this.provinces[provinceId];
        if (!province) return { success: false, message: 'Tỉnh không tồn tại' };
        const nation = this.nations[province.nationId];
        if (!nation) return { success: false, message: 'Quốc gia không tồn tại' };
        const building = BUILDINGS[buildingId];
        if (!building) return { success: false, message: 'Công trình không tồn tại' };
        if (nation.gold < 0) return { success: false, message: '❌ Đang nợ, không thể xây dựng!' };
        
        if (nation.gold < building.cost) return { success: false, message: `Không đủ tiền! Cần ${building.cost} vàng` };
        
        const existing = province.buildings.filter(b => b === buildingId).length;
        if (existing >= building.maxLevel) return { success: false, message: 'Đã đạt cấp độ tối đa!' };
        
        nation.gold -= building.cost;
        province.buildings.push(buildingId);
        nation.buildings.push(buildingId);
        this.stats.totalBuildingsBuilt++;
        if (this.isMultiplayer) this.syncToServer();
        
        return { success: true, message: `✅ Xây ${building.name} thành công!` };
    }

    // === TỔ CHỨC LỄ HỘI ===
    organizeFestival(provinceId) {
        const province = this.provinces[provinceId];
        if (!province) return { success: false, message: 'Tỉnh không tồn tại' };
        const nation = this.nations[province.nationId];
        if (!nation) return { success: false, message: 'Quốc gia không tồn tại' };
        if (nation.gold < 500) return { success: false, message: 'Cần 500 vàng để tổ chức lễ hội' };
        
        nation.gold -= 500;
        nation.happiness = Math.min(100, nation.happiness + 10);
        province.population = Math.floor(province.population * 1.02);
        nation.inflation += 0.5;
        
        if (this.isMultiplayer) this.syncToServer();
        return { success: true, message: '🎉 Tổ chức lễ hội thành công! +10% HP, +2% dân' };
    }

    // === ĐỒNG HÓA ===
    assimilate(provinceId) {
        const province = this.provinces[provinceId];
        if (!province) return { success: false, message: 'Tỉnh không tồn tại' };
        const nation = this.nations[province.nationId];
        if (!nation) return { success: false, message: 'Quốc gia không tồn tại' };
        if (nation.scienceLevel < 0.5) return { success: false, message: 'Cần KH ≥ 0.5 để đồng hóa' };
        if (nation.gold < 1000) return { success: false, message: 'Cần 1000 vàng để đồng hóa' };
        
        nation.gold -= 1000;
        province.population = Math.floor(province.population * 1.1);
        province.development = Math.min(nation.scienceLevel, CONFIG.SCIENCE_MAX);
        
        if (this.isMultiplayer) this.syncToServer();
        return { success: true, message: '🔄 Đồng hóa thành công! +10% dân' };
    }

    // === CẬP NHẬT CHÍNH SÁCH ===
    updatePolicy(policy, value) {
        const nation = this.nations[this.playerNationId];
        if (!nation) return;
        if (!nation.policies) nation.policies = { ...this.policies };
        nation.policies[policy] = Math.max(0, Math.min(100, value));
        if (this.isMultiplayer) this.syncToServer();
    }

    // === KẾT THÚC GAME ===
    endGame(reason) {
        if (this.isGameEnded) return;
        this.isGameEnded = true;
        this.isRunning = false;
        this.stats.endTime = Date.now();
        const results = this.calculateResults();
        this.showEndScreen(reason, results);
        this.saveGameResult(results);
        if (this.isMultiplayer) this.syncToServer();
    }

    // === TÍNH KẾT QUẢ ===
    calculateResults() {
        const player = this.nations[this.playerNationId];
        const results = {
            player: {
                name: player?.name || 'Unknown',
                provinces: player?.provinces?.length || 0,
                gold: player?.gold || 0,
                army: player?.army || 0,
                population: player?.population || 0,
                buildings: player?.buildings?.length || 0,
                isAlive: player?.isAlive || false,
                science: player?.scienceLevel || 0,
                happiness: player?.happiness || 0
            },
            nations: [],
            rankings: [],
            totalProvinces: 0,
            winner: null
        };
        for (const [id, nation] of Object.entries(this.nations)) {
            const provinceCount = nation.provinces?.length || 0;
            results.totalProvinces += provinceCount;
            results.nations.push({
                id: id,
                name: nation.name,
                color: nation.color,
                provinces: provinceCount,
                gold: nation.gold,
                army: nation.army,
                population: nation.population,
                buildings: nation.buildings?.length || 0,
                isAlive: nation.isAlive,
                isPlayer: nation.isPlayer,
                science: nation.scienceLevel || 0
            });
        }
        results.rankings = results.nations.sort((a, b) => b.provinces - a.provinces || b.army - a.army);
        if (results.rankings.length > 0) results.winner = results.rankings[0];
        return results;
    }

    // === HIỂN THỊ MÀN HÌNH KẾT THÚC ===
    showEndScreen(reason, results) {
        // ... (tương tự như các phiên bản trước)
        // Tôi sẽ viết gọn lại để tránh quá dài
        showToast(`🏁 Game kết thúc! Lý do: ${reason}`, 'info');
        // Hiển thị kết quả đơn giản
        const winner = results.winner;
        alert(`🏆 KẾT THÚC GAME!\n\nNgười chiến thắng: ${winner?.name || 'Không xác định'}\nSố tỉnh: ${winner?.provinces || 0}\nQuân số: ${winner?.army || 0}\n\nBảng xếp hạng:\n${results.rankings.map((n, i) => `${i+1}. ${n.name} - ${n.provinces} tỉnh`).join('\n')}`);
    }

    // === LƯU KẾT QUẢ ===
    saveGameResult(results) {
        const resultData = {
            timestamp: Date.now(),
            duration: this.stats.duration,
            player: results.player,
            winner: results.winner ? { name: results.winner.name, provinces: results.winner.provinces } : null,
            rankings: results.rankings.map(n => ({ name: n.name, provinces: n.provinces, gold: n.gold, army: n.army }))
        };
        localStorage.setItem('aoh_last_result', JSON.stringify(resultData));
        let history = JSON.parse(localStorage.getItem('aoh_history') || '[]');
        history.push(resultData);
        if (history.length > 10) history.shift();
        localStorage.setItem('aoh_history', JSON.stringify(history));
    }

    // === TỰ ĐỘNG LƯU ===
    autoSave() {
        const cacheData = {
            cameraX: cameraX || 0,
            cameraY: cameraY || 0,
            zoom: zoom || 0.6,
            selectedProvince: this.selectedProvince,
            phase: this.phase,
            gameTime: this.gameTime,
            timestamp: Date.now()
        };
        localStorage.setItem('aoh_cache_data', JSON.stringify(cacheData));
        if (this.isMultiplayer && this.multiplayer) this.syncToServer();
    }

    // === ĐỒNG BỘ LÊN SERVER ===
    syncToServer() {
        if (!this.multiplayer || !this.multiplayer.isConnected) return;
        const gameData = { nations: {}, provinces: {}, gameTime: this.gameTime, gameDate: this.gameDate };
        for (const [id, nation] of Object.entries(this.nations)) {
            gameData.nations[id] = {
                gold: nation.gold,
                population: nation.population,
                army: nation.army,
                provinces: nation.provinces,
                buildings: nation.buildings,
                isAlive: nation.isAlive,
                isPlayer: nation.isPlayer,
                scienceLevel: nation.scienceLevel,
                happiness: nation.happiness,
                inflation: nation.inflation,
                policies: nation.policies
            };
        }
        for (const [id, province] of Object.entries(this.provinces)) {
            gameData.provinces[id] = {
                nationId: province.nationId,
                population: province.population,
                army: province.army,
                buildings: province.buildings,
                isCapital: province.isCapital || false,
                development: province.development || 0
            };
        }
        this.multiplayer.syncGameData(gameData);
    }

    // === ĐỊNH DẠNG THỜI GIAN ===
    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}

let game = null;
