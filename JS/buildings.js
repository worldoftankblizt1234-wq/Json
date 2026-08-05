
// === CÔNG TRÌNH ===
const BUILDINGS = {
    'headquarters': {
        id: 'headquarters',
        name: '🏛️ Trụ sở chính',
        icon: '🏛️',
        cost: 5000,
        goldPerSecond: 0,
        popPerSecond: 0,
        effect: 'allow_build',
        value: 0,
        description: 'Cho phép xây dựng công trình khác',
        maxLevel: 1
    },
    'treasury': {
        id: 'treasury',
        name: '💰 Kho bạc',
        icon: '💰',
        cost: 3000,
        goldPerSecond: 5,
        popPerSecond: 0,
        effect: 'gold_income',
        value: 5,
        description: '+5 vàng/giây',
        maxLevel: 5
    },
    'factory': {
        id: 'factory',
        name: '🏭 Nhà máy',
        icon: '🏭',
        cost: 4000,
        goldPerSecond: 10,
        popPerSecond: 0,
        effect: 'gold_income',
        value: 10,
        description: '+10 vàng/giây',
        maxLevel: 5
    },
    'farm': {
        id: 'farm',
        name: '🌾 Trang trại',
        icon: '🌾',
        cost: 2000,
        goldPerSecond: 2,
        popPerSecond: 2,
        effect: 'population_growth',
        value: 2,
        description: '+2 vàng/giây, +2 dân/giây',
        maxLevel: 5
    },
    'barracks': {
        id: 'barracks',
        name: '⚔️ Doanh trại',
        icon: '⚔️',
        cost: 3500,
        goldPerSecond: 0,
        popPerSecond: 0,
        effect: 'reduce_recruit_cost',
        value: 0.3,
        description: 'Giảm 30% chi phí tuyển quân',
        maxLevel: 3
    },
    'fortress': {
        id: 'fortress',
        name: '🛡️ Pháo đài',
        icon: '🛡️',
        cost: 5000,
        goldPerSecond: 0,
        popPerSecond: 0,
        effect: 'defense_boost',
        value: 0.5,
        description: '+50% phòng thủ cho tỉnh',
        maxLevel: 3
    },
    'research_lab': {
        id: 'research_lab',
        name: '🔬 Viện nghiên cứu',
        icon: '🔬',
        cost: 6000,
        goldPerSecond: 0,
        popPerSecond: 0,
        effect: 'income_boost',
        value: 0.2,
        description: '+20% thu nhập từ tất cả công trình',
        maxLevel: 3
    },
    'hospital': {
        id: 'hospital',
        name: '🏥 Bệnh viện',
        icon: '🏥',
        cost: 4000,
        goldPerSecond: 0,
        popPerSecond: 5,
        effect: 'population_growth',
        value: 5,
        description: '+5 dân/giây',
        maxLevel: 3
    },
    'church': {
        id: 'church',
        name: '⛪ Nhà thờ',
        icon: '⛪',
        cost: 3000,
        goldPerSecond: 0,
        popPerSecond: 0,
        effect: 'reduce_upkeep',
        value: 0.1,
        description: '-10% chi phí duy trì quân',
        maxLevel: 3
    },
    'market': {
        id: 'market',
        name: '🏟️ Chợ',
        icon: '🏟️',
        cost: 2500,
        goldPerSecond: 3,
        popPerSecond: 0,
        effect: 'gold_income',
        value: 3,
        description: '+3 vàng/giây',
        maxLevel: 5
    },
    'port': {
        id: 'port',
        name: '🚢 Cảng biển',
        icon: '🚢',
        cost: 4500,
        goldPerSecond: 5,
        popPerSecond: 0,
        effect: 'gold_income',
        value: 5,
        description: '+5 vàng/giây',
        maxLevel: 3
    },
    'gold_mine': {
        id: 'gold_mine',
        name: '💎 Mỏ vàng',
        icon: '💎',
        cost: 5500,
        goldPerSecond: 15,
        popPerSecond: 0,
        effect: 'gold_income',
        value: 15,
        description: '+15 vàng/giây',
        maxLevel: 5
    }
};

// Lấy danh sách công trình có thể xây
function getAvailableBuildings(nationId, provinceId) {
    const available = [];
    const nation = getNation(nationId);
    const province = getProvince(provinceId);
    if (!nation || !province) return available;
    
    const hasHeadquarters = province.buildings.some(b => b === 'headquarters');
    for (const [id, building] of Object.entries(BUILDINGS)) {
        if (id === 'headquarters' && hasHeadquarters) continue;
        if (!hasHeadquarters && id !== 'headquarters') continue;
        const existing = province.buildings.filter(b => b === id).length;
        if (existing >= building.maxLevel) continue;
        available.push({ ...building, currentLevel: existing, canAfford: nation.gold >= building.cost });
    }
    return available;
}
