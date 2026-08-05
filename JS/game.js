
// === GAME ENGINE ===
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
        
        // ===== THỜI GIAN =====
        this.timeLimit = CONFIG.TIME_LIMIT;
        this.isTimeOver = false;
        this.timeWarningShown = false;
        this.isGameEnded = false;
        
        // ===== THỐNG KÊ =====
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
        this.isTimeOver = false;
        this.isGameEnded = false;
        this.timeWarningShown = false;
        this.stats.startTime = Date.now();
        
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
        for (const n of NATIONS) {
            const gold = CONFIG.START_GOLD_MIN + Math.floor(Math.random() * (CONFIG.START_GOLD_MAX - CONFIG.START_GOLD_MIN));
            this.nations[n.id] = {
                ...n,
                gold: gold,
                population: 500000 + Math.floor(Math.random() * 500000),
                provinces: [],
                buildings: [],
                army: 0,
                isPlayer: (n.id === this.playerNationId),
                isAlive: true,
                defeatedAt: null
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
            // Cập nhật danh sách tỉnh của quốc gia
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
        
        if (!this.isPaused && !this.isGameEnded) {
            this.gameTime += delta;
            this.stats.duration = this.gameTime;
            this.checkTimeLimit();
        }
        
        if (!this.isPaused && !this.isGameEnded) {
            this.update(delta);
        }
        
        renderMap();
        updateUI();
        this.updateTimeDisplay();
        
        if (this.isMultiplayer && this.multiplayer && this.multiplayer.isConnected) {
            if (this.gameTime % 2 < delta) this.syncToServer();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    // === CẬP NHẬT GAME ===
    update(delta) {
        for (const [id, nation] of Object.entries(this.nations)) {
            if (!nation.isAlive) continue;
            this.updatePopulation(nation, delta);
            this.updateGold(nation, delta);
            this.updateUpkeep(nation, delta);
            if (!nation.isPlayer && this.isMultiplayer) {
                aiAction(nation, delta, this);
            }
        }
        this.checkWinCondition();
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
            popGrowth += province.population * 0.005;
        }
        for (const provinceId of nation.provinces) {
            const province = this.provinces[provinceId];
            if (province) {
                province.population += (popGrowth / Math.max(1, nation.provinces.length)) * delta;
                province.population = Math.floor(province.population);
            }
        }
    }

    // === CẬP NHẬT TIỀN ===
    updateGold(nation, delta) {
        let goldIncome = 0;
        let incomeBoost = 1;
        for (const provinceId of nation.provinces) {
            const province = this.provinces[provinceId];
            if (!province) continue;
            for (const buildingId of province.buildings) {
                const building = BUILDINGS[buildingId];
                if (building && building.goldPerSecond) goldIncome += building.goldPerSecond;
                if (building && building.effect === 'income_boost') incomeBoost += building.value;
            }
        }
        goldIncome *= incomeBoost;
        nation.gold += goldIncome * delta;
        nation.gold = Math.floor(nation.gold);
    }

    // === CẬP NHẬT CHI PHÍ DUY TRÌ ===
    updateUpkeep(nation, delta) {
        let upkeepCost = nation.army * 0.1;
        let reduceUpkeep = 0;
        for (const provinceId of nation.provinces) {
            const province = this.provinces[provinceId];
            if (!province) continue;
            for (const buildingId of province.buildings) {
                const building = BUILDINGS[buildingId];
                if (building && building.effect === 'reduce_upkeep') reduceUpkeep += building.value;
            }
        }
        upkeepCost *= (1 - reduceUpkeep);
        nation.gold -= upkeepCost * delta;
        if (nation.gold < 0) {
            const deserters = Math.min(nation.army, Math.floor(-nation.gold / 10));
            nation.army -= deserters;
            nation.gold = 0;
        }
        nation.gold = Math.floor(nation.gold);
    }

    // === KIỂM TRA GIỚI HẠN THỜI GIAN ===
    checkTimeLimit() {
        const remaining = this.timeLimit - this.gameTime;
        if (remaining <= CONFIG.TIME_WARNING && !this.timeWarningShown) {
            this.timeWarningShown = true;
            showToast(`⚠️ Còn ${Math.ceil(remaining)} giây!`);
            this.showTimeWarning();
        }
        if (remaining <= 0 && !this.isTimeOver) {
            this.isTimeOver = true;
            this.endGame('time_up');
        }
    }

    // === HIỂN THỊ CẢNH BÁO THỜI GIAN ===
    showTimeWarning() {
        const warning = document.createElement('div');
        warning.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-red-900/90 backdrop-blur-md border-2 border-red-500/50 rounded-2xl p-4 text-center max-w-xs';
        warning.innerHTML = `
            <div class="text-4xl mb-2">⏰</div>
            <h3 class="text-lg font-bold text-white mb-1">SẮP HẾT GIỜ!</h3>
            <p class="text-gray-300 text-sm mb-2">Còn ${Math.ceil(this.timeLimit - this.gameTime)} giây</p>
            <div class="flex flex-col gap-1">
                <button id="btn-buy-time" class="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs">⏰ Mua thêm 30s (${CONFIG.TIME_EXTRA_COST} vàng)</button>
                <button id="btn-continue-warning" class="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs">Tiếp tục</button>
            </div>
        `;
        document.body.appendChild(warning);
        document.getElementById('btn-buy-time').addEventListener('click', () => {
            this.buyTime();
            warning.remove();
        });
        document.getElementById('btn-continue-warning').addEventListener('click', () => warning.remove());
    }

    // === MUA THÊM THỜI GIAN ===
    buyTime() {
        const player = this.nations[this.playerNationId];
        if (!player) return;
        if (player.gold >= CONFIG.TIME_EXTRA_COST) {
            player.gold -= CONFIG.TIME_EXTRA_COST;
            this.timeLimit += CONFIG.TIME_EXTRA;
            this.timeWarningShown = false;
            showToast(`✅ Mua thêm ${CONFIG.TIME_EXTRA}s! Còn ${Math.ceil(this.timeLimit - this.gameTime)}s`);
            this.syncToServer();
        } else {
            showToast(`❌ Không đủ vàng! Cần ${CONFIG.TIME_EXTRA_COST} vàng`);
        }
    }

    // === CẬP NHẬT ĐỒNG HỒ ===
    updateTimeDisplay() {
        const remaining = Math.max(0, this.timeLimit - this.gameTime);
        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60);
        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) {
            timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            if (remaining <= 60) timeDisplay.style.color = '#ef4444';
            else if (remaining <= 180) timeDisplay.style.color = '#f59e0b';
            else timeDisplay.style.color = '#9ca3af';
        }
        // Thanh thời gian
        const timeBar = document.getElementById('time-bar');
        if (timeBar) {
            const percent = (remaining / CONFIG.TIME_LIMIT) * 100;
            timeBar.style.transform = `scaleX(${percent / 100})`;
            if (percent < 10) timeBar.style.background = 'linear-gradient(to right, #ef4444, #dc2626)';
            else if (percent < 30) timeBar.style.background = 'linear-gradient(to right, #f59e0b, #ef4444)';
            else timeBar.style.background = 'linear-gradient(to right, #22c55e, #f59e0b)';
        }
    }

    // === TUYỂN QUÂN ===
    recruitTroops(provinceId, amount) {
        const province = this.provinces[provinceId];
        if (!province) return { success: false, message: 'Tỉnh không tồn tại' };
        const nation = this.nations[province.nationId];
        if (!nation) return { success: false, message: 'Quốc gia không tồn tại' };
        if (!nation.isAlive) return { success: false, message: 'Quốc gia đã bị tiêu diệt' };
        
        let costPerUnit = CONFIG.RECRUIT_COST_GOLD;
        let popPerUnit = CONFIG.RECRUIT_COST_POP;
        for (const buildingId of province.buildings) {
            const building = BUILDINGS[buildingId];
            if (building && building.effect === 'reduce_recruit_cost') {
                costPerUnit *= (1 - building.value);
                popPerUnit *= (1 - building.value);
            }
        }
        costPerUnit = Math.ceil(costPerUnit);
        popPerUnit = Math.ceil(popPerUnit);
        const costGold = amount * costPerUnit;
        const costPop = amount * popPerUnit;
        
        if (nation.gold < costGold) return { success: false, message: `Không đủ tiền! Cần ${costGold} vàng` };
        if (province.population < costPop) return { success: false, message: `Không đủ dân! Cần ${costPop} dân` };
        
        nation.gold -= costGold;
        province.population -= costPop;
        province.army += amount;
        nation.army += amount;
        this.stats.totalArmyRecruited += amount;
        if (this.isMultiplayer) this.syncToServer();
        
        return { success: true, message: `✅ Tuyển ${amount} quân (💰${costGold} + 👤${costPop} dân)`, amount, costGold, costPop };
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
                    showToast(`💀 ${toNation.name} đã bị tiêu diệt!`);
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

    // === XÂY CÔNG TRÌNH ===
    buildBuilding(provinceId, buildingId) {
        const province = this.provinces[provinceId];
        if (!province) return { success: false, message: 'Tỉnh không tồn tại' };
        const nation = this.nations[province.nationId];
        if (!nation) return { success: false, message: 'Quốc gia không tồn tại' };
        const building = BUILDINGS[buildingId];
        if (!building) return { success: false, message: 'Công trình không tồn tại' };
        
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

    // === KIỂM TRA ĐIỀU KIỆN THẮNG ===
    checkWinCondition() {
        const player = this.nations[this.playerNationId];
        if (!player) return false;
        const totalProvinces = Object.keys(this.provinces).length;
        const playerProvinces = player.provinces?.length || 0;
        if (playerProvinces >= totalProvinces * 0.8) {
            this.endGame('victory');
            return true;
        }
        if (playerProvinces === 0 && !player.isAlive) {
            this.endGame('defeat');
            return true;
        }
        return false;
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
                isAlive: player?.isAlive || false
            },
            nations: [],
            rankings: [],
            totalProvinces: 0,
            totalNations: 0,
            winner: null
        };
        for (const [id, nation] of Object.entries(this.nations)) {
            const provinceCount = nation.provinces?.length || 0;
            results.totalProvinces += provinceCount;
            results.totalNations++;
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
                isPlayer: nation.isPlayer
            });
        }
        results.rankings = results.nations.sort((a, b) => b.provinces - a.provinces || b.army - a.army);
        if (results.rankings.length > 0) results.winner = results.rankings[0];
        return results;
    }

    // === HIỂN THỊ MÀN HÌNH KẾT THÚC ===
    showEndScreen(reason, results) {
        const playerResult = results.player;
        const winner = results.winner;
        const isPlayerWinner = winner?.isPlayer || false;
        let title = '⏰ HẾT GIỜ!', desc = 'Trận đấu đã kết thúc', color = 'indigo';
        if (reason === 'time_up') { title = `⏰ HẾT ${Math.floor(CONFIG.TIME_LIMIT / 60)} PHÚT!`; desc = 'Thời gian đã kết thúc!'; color = 'amber'; }
        else if (reason === 'victory') { title = '🏆 CHIẾN THẮNG!'; desc = 'Bạn đã thống nhất thế giới!'; color = 'green'; }
        else if (reason === 'defeat') { title = '💀 THẤT BẠI!'; desc = 'Bạn đã bị tiêu diệt!'; color = 'red'; }
        
        const modal = document.createElement('div');
        modal.className = `fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4`;
        modal.innerHTML = `
            <div class="bg-gray-900 border-2 border-${color}-500/50 rounded-2xl p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="text-center mb-3">
                    <div class="text-5xl mb-1">${title.split(' ')[0]}</div>
                    <h2 class="text-xl font-bold text-white">${title}</h2>
                    <p class="text-gray-400 text-sm">${desc}</p>
                </div>
                <div class="bg-gray-800/50 rounded-xl p-3 mb-3">
                    <h3 class="font-bold text-white text-sm mb-1.5">📊 THỐNG KÊ CỦA BẠN</h3>
                    <div class="grid grid-cols-2 gap-1.5 text-xs">
                        <div class="bg-gray-900/50 p-1.5 rounded-lg"><span class="text-gray-400">🏛️ Tỉnh</span><div class="font-bold text-white">${playerResult.provinces}</div></div>
                        <div class="bg-gray-900/50 p-1.5 rounded-lg"><span class="text-gray-400">💰 Vàng</span><div class="font-bold text-yellow-400">${Math.floor(playerResult.gold).toLocaleString()}</div></div>
                        <div class="bg-gray-900/50 p-1.5 rounded-lg"><span class="text-gray-400">⚔️ Quân</span><div class="font-bold text-red-400">${playerResult.army.toLocaleString()}</div></div>
                        <div class="bg-gray-900/50 p-1.5 rounded-lg"><span class="text-gray-400">👤 Dân</span><div class="font-bold text-blue-400">${Math.floor(playerResult.population).toLocaleString()}</div></div>
                        <div class="bg-gray-900/50 p-1.5 rounded-lg col-span-2"><span class="text-gray-400">🏗️ Công trình</span><div class="font-bold text-green-400">${playerResult.buildings}</div></div>
                    </div>
                </div>
                <div class="bg-gray-800/50 rounded-xl p-3 mb-3">
                    <h3 class="font-bold text-white text-sm mb-1.5">🏆 BẢNG XẾP HẠNG</h3>
                    <div class="space-y-0.5 max-h-40 overflow-y-auto text-xs">
                        ${results.rankings.map((n, i) => `
                            <div class="flex justify-between items-center p-1.5 rounded-lg ${n.isPlayer ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-gray-900/50'}">
                                <div class="flex items-center gap-1.5"><span class="text-xs font-bold text-gray-400 w-4">#${i+1}</span><span class="w-2.5 h-2.5 rounded-full" style="background:${n.color}"></span><span class="text-white text-xs font-bold">${n.name}</span>${n.isPlayer ? '<span class="text-indigo-400 text-[9px]">(Bạn)</span>' : ''}</div>
                                <div class="flex gap-2 text-[9px]"><span class="text-gray-400">🏛️${n.provinces}</span><span class="text-yellow-400">💰${Math.floor(n.gold)}</span><span class="text-red-400">⚔️${n.army}</span></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="flex gap-1.5">
                    <button onclick="location.reload()" class="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition">🔄 Chơi lại</button>
                    <button onclick="saveAndQuit()" class="flex-1 px-3 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs transition">💾 Lưu & Thoát</button>
                </div>
                ${isPlayerWinner ? `<div class="mt-2 text-center text-green-400 font-bold text-xs">🎉 CHÚC MỪNG! Bạn đã chiến thắng!</div>` : reason === 'time_up' ? `<div class="mt-2 text-center text-amber-400 text-xs">⏰ Hết giờ! Người thắng: ${winner?.name || 'Không xác định'}</div>` : ''}
            </div>
        `;
        document.body.appendChild(modal);
    }

    // === LƯU KẾT QUẢ ===
    saveGameResult(results) {
        const resultData = {
            timestamp: Date.now(),
            duration: this.stats.duration,
            player: results.player,
            winner: results.winner ? { name: results.winner.name, color: results.winner.color, provinces: results.winner.provinces } : null,
            rankings: results.rankings.map(n => ({ name: n.name, color: n.color, provinces: n.provinces, gold: n.gold, army: n.army }))
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
        const gameData = { nations: {}, provinces: {}, gameTime: this.gameTime, timestamp: Date.now() };
        for (const [id, nation] of Object.entries(this.nations)) {
            gameData.nations[id] = {
                gold: nation.gold,
                population: nation.population,
                army: nation.army,
                provinces: nation.provinces,
                buildings: nation.buildings,
                isAlive: nation.isAlive,
                isPlayer: nation.isPlayer
            };
        }
        for (const [id, province] of Object.entries(this.provinces)) {
            gameData.provinces[id] = {
                nationId: province.nationId,
                population: province.population,
                army: province.army,
                buildings: province.buildings,
                isCapital: province.isCapital || false
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
