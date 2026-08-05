// === UI FUNCTIONS ===
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    const colors = {
        success: 'border-green-500/50',
        error: 'border-red-500/50',
        info: 'border-indigo-500/50'
    };
    toast.className = `toast ${colors[type] || colors.info}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateUI() {
    if (!game) return;
    const nation = game.nations[game.playerNationId];
    if (!nation) return;
    document.getElementById('gold-display').textContent = Math.floor(nation.gold).toLocaleString();
    document.getElementById('pop-display').textContent = Math.floor(nation.population / 1000).toLocaleString() + 'K';
    document.getElementById('army-display').textContent = nation.army.toLocaleString() + 'K';
    document.getElementById('building-count').textContent = nation.buildings?.length || 0;
    document.getElementById('nation-name-display').textContent = nation.name;
    document.getElementById('nation-color-display').style.background = nation.color;
    updateTimeBar();
}

function updateTimeBar() {
    if (!game) return;
    const remaining = Math.max(0, game.timeLimit - game.gameTime);
    const percent = (remaining / CONFIG.TIME_LIMIT) * 100;
    const timeBar = document.getElementById('time-bar');
    if (timeBar) {
        timeBar.style.transform = `scaleX(${percent / 100})`;
        if (percent < 10) timeBar.style.background = 'linear-gradient(to right, #ef4444, #dc2626)';
        else if (percent < 30) timeBar.style.background = 'linear-gradient(to right, #f59e0b, #ef4444)';
        else timeBar.style.background = 'linear-gradient(to right, #22c55e, #f59e0b)';
    }
}

function showProvinceInfo(idx) {
    const modal = document.getElementById('province-modal');
    const content = document.getElementById('modal-content');
    const type = mapType[idx];
    const pNum = provinceNum[idx];
    const province = game ? game.provinces[pNum] : null;
    const details = provinceDetails[idx];
    
    if (type === 0) {
        const sea = SEA_ZONES[seaZoneId[idx] - 1];
        content.innerHTML = `<h3 class="font-bold text-indigo-400 text-sm">🌊 ${sea ? sea.name : 'Biển'}</h3><p class="text-gray-400 text-[10px]">Hải phận quốc tế</p>`;
    } else if (type === 1) {
        content.innerHTML = `<h3 class="font-bold text-gray-300 text-sm">🏜️ Trung Lập</h3><p class="text-gray-400 text-[10px]">Dân số: ${details ? Math.floor(details.popNum || 0).toLocaleString() : 0}</p>`;
    } else {
        const nat = NATIONS.find(n => n.id === type);
        const isCapital = province?.isCapital || false;
        const army = province?.army || 0;
        const pop = province?.population || 0;
        content.innerHTML = `
            <div class="flex items-center gap-1.5 mb-1.5">
                <span class="w-2.5 h-2.5 rounded-full border" style="background:${nat?.color || '#fff'}"></span>
                <h3 class="font-bold text-white text-sm">${isCapital ? '⭐ ' + (CAPITALS[type]?.name || 'Thủ Đô') : (nat?.prefix || '') + ' ' + pNum}</h3>
                ${isCapital ? '<span class="text-[8px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded">THỦ ĐÔ</span>' : ''}
            </div>
            <p class="text-gray-400 text-[10px]">Quốc gia: ${nat?.name || 'Unknown'}</p>
            <p class="text-gray-400 text-[10px]">👤 Dân số: ${Math.floor(pop).toLocaleString()}</p>
            <p class="text-red-400 font-bold text-[10px]">⚔️ Quân số: ${army.toLocaleString()}K</p>
            ${isCapital ? `<p class="text-amber-400 text-[9px]">🏛️ Thủ đô của ${nat?.name}</p>` : ''}
            <p class="text-gray-500 text-[9px]">🏗️ Công trình: ${province?.buildings?.length || 0}</p>
        `;
    }
    modal.classList.remove('hidden');
}

function updateNationInfo() {
    if (!game) return;
    const nation = game.nations[game.playerNationId];
    if (!nation) return;
    document.getElementById('nation-name-display').textContent = nation.name;
    document.getElementById('nation-color-display').style.background = nation.color;
}

function saveAndQuit() {
    if (game) {
        game.autoSave();
        showToast('💾 Đã lưu game!');
    }
    setTimeout(() => { window.location.href = '/'; }, 500);
}
