// === UI.JS - GIAO DIỆN ===

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
    document.getElementById('income-display').textContent = `+${Math.floor(game.calculateIncome(nation))}/s`;
    document.getElementById('pop-display').textContent = Math.floor(nation.population / 1000).toLocaleString() + 'K';
    document.getElementById('army-display').textContent = nation.army.toLocaleString() + 'K';
    document.getElementById('building-count').textContent = nation.buildings?.length || 0;
    document.getElementById('science-display').textContent = nation.scienceLevel.toFixed(5);
    document.getElementById('nation-name-display').textContent = nation.name;
    document.getElementById('nation-color-display').style.background = nation.color;
    
    // Nation menu (cờ phải)
    document.getElementById('nation-menu-name').textContent = nation.name;
    document.getElementById('nation-menu-leader').textContent = nation.playerName || 'ABC';
    document.getElementById('nation-menu-gold').textContent = Math.floor(nation.gold).toLocaleString();
    document.getElementById('nation-menu-happiness').textContent = Math.round(nation.happiness) + '%';
    document.getElementById('nation-menu-science').textContent = nation.scienceLevel.toFixed(5);
}

function showNationMenu() {
    if (!game) return;
    const nation = game.nations[game.playerNationId];
    if (!nation) return;
    
    const modal = document.getElementById('nation-menu-modal');
    const content = document.getElementById('nation-modal-content');
    document.getElementById('nation-modal-name').textContent = nation.name;
    
    const p = nation.policies || { tax: 20, goods: 50, welfare: 30, research: 20 };
    const income = game.calculateIncome(nation);
    
    content.innerHTML = `
        <div class="space-y-3">
            <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-gray-800/50 p-2 rounded-lg">
                    <span class="text-gray-400">💰 Vàng</span>
                    <div class="font-bold text-yellow-400">${Math.floor(nation.gold).toLocaleString()}</div>
                </div>
                <div class="bg-gray-800/50 p-2 rounded-lg">
                    <span class="text-gray-400">📈 Thu nhập</span>
                    <div class="font-bold text-green-400">+${Math.floor(income)}/s</div>
                </div>
                <div class="bg-gray-800/50 p-2 rounded-lg">
                    <span class="text-gray-400">😊 Hạnh phúc</span>
                    <div class="font-bold text-pink-400">${Math.round(nation.happiness)}%</div>
                </div>
                <div class="bg-gray-800/50 p-2 rounded-lg">
                    <span class="text-gray-400">🔬 KH</span>
                    <div class="font-bold text-purple-400">${nation.scienceLevel.toFixed(5)}</div>
                </div>
                <div class="bg-gray-800/50 p-2 rounded-lg col-span-2">
                    <span class="text-gray-400">💸 Lạm phát</span>
                    <div class="font-bold ${nation.inflation > 30 ? 'text-red-400' : nation.inflation > 15 ? 'text-yellow-400' : 'text-green-400'}">
                        ${nation.inflation.toFixed(1)}%
                    </div>
                </div>
            </div>
            
            <div class="border-t border-gray-800 pt-2">
                <h4 class="text-white font-bold text-xs mb-2">📊 CHÍNH SÁCH QUỐC GIA</h4>
                
                <div class="space-y-2">
                    <div>
                        <div class="flex justify-between text-[10px]">
                            <span class="text-gray-400">💰 Thuế</span>
                            <span class="text-yellow-400">${Math.round(p.tax || 20)}%</span>
                        </div>
                        <div class="flex gap-1 mt-0.5">
                            <button onclick="adjustPolicy('tax', -5)" class="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[8px]">-5%</button>
                            <button onclick="adjustPolicy('tax', 5)" class="px-2 py-0.5 rounded bg-green-600 hover:bg-green-500 text-white text-[8px]">+5%</button>
                        </div>
                    </div>
                    
                    <div>
                        <div class="flex justify-between text-[10px]">
                            <span class="text-gray-400">📦 Hàng hoá</span>
                            <span class="text-blue-400">${Math.round(p.goods || 50)}%</span>
                        </div>
                        <div class="flex gap-1 mt-0.5">
                            <button onclick="adjustPolicy('goods', -10)" class="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[8px]">-10%</button>
                            <button onclick="adjustPolicy('goods', 10)" class="px-2 py-0.5 rounded bg-green-600 hover:bg-green-500 text-white text-[8px]">+10%</button>
                        </div>
                    </div>
                    
                    <div>
                        <div class="flex justify-between text-[10px]">
                            <span class="text-gray-400">🏥 An sinh</span>
                            <span class="text-green-400">${Math.round(p.welfare || 30)}%</span>
                        </div>
                        <div class="flex gap-1 mt-0.5">
                            <button onclick="adjustPolicy('welfare', -10)" class="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[8px]">-10%</button>
                            <button onclick="adjustPolicy('welfare', 10)" class="px-2 py-0.5 rounded bg-green-600 hover:bg-green-500 text-white text-[8px]">+10%</button>
                        </div>
                        <div class="text-[8px] text-gray-500 mt-0.5">Tăng: -10 vàng/s, +5% HP | Giảm: +10 vàng/s, -5% HP</div>
                    </div>
                    
                    <div>
                        <div class="flex justify-between text-[10px]">
                            <span class="text-gray-400">🔬 Nghiên cứu</span>
                            <span class="text-purple-400">${Math.round(p.research || 20)}%</span>
                        </div>
                        <div class="flex gap-1 mt-0.5">
                            <button onclick="adjustPolicy('research', -10)" class="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[8px]">-10%</button>
                            <button onclick="adjustPolicy('research', 10)" class="px-2 py-0.5 rounded bg-green-600 hover:bg-green-500 text-white text-[8px]">+10%</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

function adjustPolicy(policy, value) {
    if (!game) return;
    const nation = game.nations[game.playerNationId];
    if (!nation) return;
    if (!nation.policies) nation.policies = { tax: 20, goods: 50, welfare: 30, research: 20 };
    const current = nation.policies[policy] || 20;
    const newValue = Math.max(0, Math.min(100, current + value));
    game.updatePolicy(policy, newValue);
    showNationMenu();
    updateUI();
}

function showDiplomacyMenu(nationId) {
    if (!game) return;
    const target = game.nations[nationId];
    if (!target) return;
    
    const modal = document.getElementById('diplomacy-modal');
    const content = document.getElementById('diplomacy-modal-content');
    document.getElementById('diplomacy-modal-name').textContent = target.name;
    
    content.innerHTML = `
        <div class="space-y-1.5">
            <div class="grid grid-cols-3 gap-1 text-[10px]">
                <div class="bg-gray-800/50 p-1.5 rounded-lg text-center">
                    <span class="text-gray-400">👤 Dân số</span>
                    <div class="font-bold text-white">${Math.floor(target.population/1000)}K</div>
                </div>
                <div class="bg-gray-800/50 p-1.5 rounded-lg text-center">
                    <span class="text-gray-400">💰 Kinh tế</span>
                    <div class="font-bold text-yellow-400">${Math.floor(target.gold)}</div>
                </div>
                <div class="bg-gray-800/50 p-1.5 rounded-lg text-center">
                    <span class="text-gray-400">😊 Hạnh phúc</span>
                    <div class="font-bold text-pink-400">${Math.round(target.happiness)}%</div>
                </div>
            </div>
            
            <div class="flex flex-wrap gap-1">
                <button onclick="diplomacyAction('declare_war', ${target.id})" class="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[9px] font-bold">⚔️ Tuyên chiến</button>
                <button onclick="diplomacyAction('ultimatum', ${target.id})" class="px-2 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-[9px] font-bold">📜 Tối hậu thư</button>
                <button onclick="diplomacyAction('friendship', ${target.id})" class="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold">🤝 Tăng hữu nghị</button>
                <button onclick="diplomacyAction('break', ${target.id})" class="px-2 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white text-[9px] font-bold">🚫 Đình chỉ</button>
                <button onclick="diplomacyAction('allies', ${target.id})" class="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-bold">📢 Kêu gọi đồng minh</button>
                <button onclick="diplomacyAction('gift', ${target.id})" class="px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-[9px] font-bold">🎁 Tặng quà</button>
                <button onclick="diplomacyAction('trade', ${target.id})" class="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-bold">🔄 Trao đổi</button>
                <button onclick="diplomacyAction('treaty', ${target.id})" class="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold">📝 Hiệp ước</button>
                <button onclick="diplomacyAction('ceasefire', ${target.id})" class="px-2 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[9px] font-bold">🕊️ Đình chiến</button>
                <button onclick="diplomacyAction('rebel', ${target.id})" class="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[9px] font-bold">🔥 Hỗ trợ nổi loạn</button>
                <button onclick="diplomacyAction('pass', ${target.id})" class="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold">🚪 Cho phép quân qua</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

function diplomacyAction(action, targetId) {
    const target = game.nations[targetId];
    if (!target) return;
    const messages = {
        'declare_war': `⚔️ Đã tuyên chiến với ${target.name}!`,
        'ultimatum': `📜 Đã gửi tối hậu thư cho ${target.name}`,
        'friendship': `🤝 Đã tăng điểm hữu nghị với ${target.name}`,
        'break': `🚫 Đã đình chỉ quan hệ với ${target.name}`,
        'allies': `📢 Đã kêu gọi đồng minh tham chiến với ${target.name}`,
        'gift': `🎁 Đã tặng 500 vàng cho ${target.name}`,
        'trade': `🔄 Mở cửa sổ trao đổi với ${target.name}`,
        'treaty': `📝 Mở cửa sổ hiệp ước với ${target.name}`,
        'ceasefire': `🕊️ Đã đề nghị đình chiến với ${target.name}`,
        'rebel': `🔥 Đã hỗ trợ quân nổi loạn tại ${target.name}`,
        'pass': `🚪 Đã cho phép quân qua lãnh thổ ${target.name}`
    };
    showToast(messages[action] || `✅ Đã thực hiện ${action} với ${target.name}`, 'success');
    document.getElementById('diplomacy-modal').classList.add('hidden');
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
        const buildings = province?.buildings || [];
        const dev = province?.development || 0;
        
        content.innerHTML = `
            <div class="flex items-center gap-1.5 mb-1.5">
                <span class="w-2.5 h-2.5 rounded-full border" style="background:${nat?.color || '#fff'}"></span>
                <h3 class="font-bold text-white text-sm">${isCapital ? '⭐ ' + (CAPITALS[type]?.name || 'Thủ Đô') : (nat?.prefix || '') + ' ' + pNum}</h3>
                ${isCapital ? '<span class="text-[8px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded">THỦ ĐÔ</span>' : ''}
            </div>
            <p class="text-gray-400 text-[10px]">Quốc gia: ${nat?.name || 'Unknown'}</p>
            <p class="text-gray-400 text-[10px]">👤 Dân số: ${Math.floor(pop).toLocaleString()}</p>
            <p class="text-red-400 font-bold text-[10px]">⚔️ Quân số: ${army.toLocaleString()}</p>
            <p class="text-blue-400 text-[10px]">🔬 Phát triển: ${(dev * 100).toFixed(1)}%</p>
            <p class="text-green-400 text-[10px]">🏗️ Công trình: ${buildings.length}</p>
            ${isCapital ? `<p class="text-amber-400 text-[9px]">🏛️ Thủ đô của ${nat?.name}</p>` : ''}
        `;
    }
    modal.classList.remove('hidden');
}
