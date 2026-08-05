
// === AI ĐỐI THỦ ===
function aiAction(nation, delta, game) {
    if (!nation.isAlive) return;
    if (nation.isPlayer) return;
    
    // AI xây dựng
    if (nation.gold > 3000 && Math.random() < 0.02 * delta) {
        const provinces = nation.provinces || [];
        if (provinces.length > 0) {
            const provinceId = provinces[Math.floor(Math.random() * provinces.length)];
            const province = game.provinces[provinceId];
            if (province) {
                const available = getAvailableBuildings(nation.id, provinceId);
                const affordable = available.filter(b => b.canAfford);
                if (affordable.length > 0) {
                    const building = affordable[Math.floor(Math.random() * affordable.length)];
                    game.buildBuilding(provinceId, building.id);
                }
            }
        }
    }
    
    // AI tuyển quân
    if (nation.gold > 2000 && Math.random() < 0.01 * delta) {
        const provinces = nation.provinces || [];
        if (provinces.length > 0) {
            const provinceId = provinces[Math.floor(Math.random() * provinces.length)];
            const province = game.provinces[provinceId];
            if (province && province.population > 500) {
                const amount = Math.floor(Math.random() * 50) + 10;
                game.recruitTroops(provinceId, amount);
            }
        }
    }
    
    // AI tấn công
    if (Math.random() < 0.005 * delta && nation.army > 100) {
        const provinces = nation.provinces || [];
        if (provinces.length > 0) {
            const fromProvinceId = provinces[Math.floor(Math.random() * provinces.length)];
            const fromProvince = game.provinces[fromProvinceId];
            if (fromProvince && fromProvince.army > 50) {
                // Tìm tỉnh lân cận để tấn công
                const center = provinceCenters[fromProvinceId];
                if (center) {
                    const neighbors = getNeighbors(center.c, center.r);
                    for (const nb of neighbors) {
                        const nbPNum = provinceNum[nb.index];
                        if (nbPNum !== 0 && game.provinces[nbPNum]) {
                            const toProvince = game.provinces[nbPNum];
                            if (toProvince && toProvince.nationId !== nation.id && toProvince.nationId >= 10) {
                                const result = game.attack(fromProvinceId, nbPNum);
                                if (result.success) break;
                            }
                        }
                    }
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
