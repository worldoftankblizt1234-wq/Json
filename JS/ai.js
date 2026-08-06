// === AI.JS - ĐỐI THỦ AI ===

function aiAction(nation, delta, game) {
    if (!nation.isAlive) return;
    if (nation.isPlayer) return;
    
    // === AI XÂY DỰNG ===
    if (nation.gold > 3000 && Math.random() < 0.03 * delta) {
        const provinces = nation.provinces || [];
        if (provinces.length > 0) {
            // Ưu tiên xây ở thủ đô
            let targetProvince = null;
            for (const pId of provinces) {
                const p = game.provinces[pId];
                if (p && p.isCapital) {
                    targetProvince = pId;
                    break;
                }
            }
            if (!targetProvince) targetProvince = provinces[Math.floor(Math.random() * provinces.length)];
            
            const available = getAvailableBuildings(nation.id, targetProvince);
            const affordable = available.filter(b => b.canAfford);
            
            // Ưu tiên Political Center nếu chưa có
            const hasPolitical = game.provinces[targetProvince]?.buildings.includes('political_center');
            if (!hasPolitical) {
                const pc = available.find(b => b.id === 'political_center');
                if (pc && pc.canAfford) {
                    game.buildBuilding(targetProvince, 'political_center');
                    return;
                }
            }
            
            if (affordable.length > 0) {
                // Ưu tiên công trình KH
                const scienceBuildings = affordable.filter(b => b.effect === 'science');
                if (scienceBuildings.length > 0 && Math.random() < 0.7) {
                    game.buildBuilding(targetProvince, scienceBuildings[0].id);
                    return;
                }
                // Hoặc công trình kinh tế
                const economicBuildings = affordable.filter(b => b.effect === 'gold_income' || b.effect === 'population_growth');
                if (economicBuildings.length > 0 && Math.random() < 0.5) {
                    game.buildBuilding(targetProvince, economicBuildings[0].id);
                    return;
                }
                // Random
                const building = affordable[Math.floor(Math.random() * affordable.length)];
                game.buildBuilding(targetProvince, building.id);
            }
        }
    }
    
    // === AI TUYỂN QUÂN ===
    if (nation.gold > 5000 && Math.random() < 0.02 * delta) {
        const provinces = nation.provinces || [];
        const targetProvinces = provinces.filter(pId => {
            const p = game.provinces[pId];
            return p && p.population > 1000;
        });
        if (targetProvinces.length > 0) {
            const provinceId = targetProvinces[Math.floor(Math.random() * targetProvinces.length)];
            const province = game.provinces[provinceId];
            const maxRecruit = Math.floor((nation.gold * 0.7) / CONFIG.RECRUIT_COST_GOLD);
            const amount = Math.min(Math.floor(Math.random() * 50) + 10, maxRecruit);
            if (amount > 10) {
                game.recruitTroops(provinceId, amount);
            }
        }
    }
    
    // === AI TẤN CÔNG ===
    if (Math.random() < 0.008 * delta && nation.army > 100) {
        const provinces = nation.provinces || [];
        // Tìm tỉnh có nhiều quân nhất
        let fromProvinceId = null;
        let maxArmy = 0;
        for (const pId of provinces) {
            const p = game.provinces[pId];
            if (p && p.army > maxArmy) {
                maxArmy = p.army;
                fromProvinceId = pId;
            }
        }
        if (fromProvinceId && maxArmy > 50) {
            const fromProvince = game.provinces[fromProvinceId];
            const center = provinceCenters[fromProvinceId];
            if (center) {
                const neighbors = getNeighbors(center.c, center.r);
                // Tìm tỉnh lân cận khác quốc gia
                let targets = [];
                for (const nb of neighbors) {
                    const nbPNum = provinceNum[nb.index];
                    if (nbPNum !== 0 && game.provinces[nbPNum]) {
                        const toProvince = game.provinces[nbPNum];
                        if (toProvince && toProvince.nationId !== nation.id && toProvince.nationId >= 10) {
                            targets.push(nbPNum);
                        }
                    }
                }
                if (targets.length > 0) {
                    // Tấn công tỉnh yếu nhất
                    let targetId = targets[0];
                    let minArmy = Infinity;
                    for (const tId of targets) {
                        const p = game.provinces[tId];
                        if (p && p.army < minArmy) {
                            minArmy = p.army;
                            targetId = tId;
                        }
                    }
                    game.attack(fromProvinceId, targetId);
                }
            }
        }
    }
}

// === LẤY QUỐC GIA ===
function getNation(nationId) {
    return game ? game.nations[nationId] : null;
}

// === LẤY TỈNH ===
function getProvince(provinceId) {
    return game ? game.provinces[provinceId] : null;
}
