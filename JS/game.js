// === GAME.JS - CẬP NHẬT ===

// === KHỞI TẠO QUỐC GIA ===
initNations() {
    // Lấy danh sách từ localStorage (được lưu từ lobby)
    const playerNations = JSON.parse(localStorage.getItem('aoh_player_nations') || '[]');
    const aiNations = JSON.parse(localStorage.getItem('aoh_ai_nations') || '[]');
    const players = JSON.parse(localStorage.getItem('aoh_players') || '[]');
    
    // Tạo map playerName -> nationId
    const playerMap = {};
    players.forEach(p => {
        playerMap[p.nationId] = p.playerName;
    });
    
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
            defeatedAt: null
        };
    }
    
    console.log('👑 Người chơi:', Object.values(this.nations).filter(n => n.isPlayer).map(n => `${n.name} (${n.playerName || 'Unknown'})`));
    console.log('🤖 AI:', Object.values(this.nations).filter(n => n.isAI).map(n => n.name));
}

// === TRONG UI - HIỂN THỊ TÊN NGƯỜI CHƠI TRÊN MAP ===
// Thêm vào hàm renderMap() trong map.js

// Hiển thị tên người chơi trên bản đồ (khi zoom vừa)
if (!isZoomedOut && game) {
    for (const [id, nation] of Object.entries(game.nations)) {
        if (nation.isPlayer && nation.playerName) {
            // Tìm trung tâm của quốc gia
            const provinces = nation.provinces || [];
            if (provinces.length > 0) {
                let sumC = 0, sumR = 0, count = 0;
                for (const pNum of provinces) {
                    const center = provinceCenters[pNum];
                    if (center) {
                        sumC += center.c;
                        sumR += center.r;
                        count++;
                    }
                }
                if (count > 0) {
                    const c = Math.round(sumC / count);
                    const r = Math.round(sumR / count);
                    const { x, y } = getPixelCoords(c, r);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `bold ${Math.floor(8 * zoom + 6)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = 'rgba(0,0,0,0.9)';
                    ctx.shadowBlur = 6;
                    ctx.fillText(`👤 ${nation.playerName}`, x, y - 20 * zoom);
                    ctx.shadowBlur = 0;
                }
            }
        }
    }
}
