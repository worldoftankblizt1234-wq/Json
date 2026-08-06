// === CÔNG TRÌNH (CHI PHÍ ĐÃ TĂNG) ===
const BUILDINGS = {
    'political_center': {
        id: 'political_center',
        name: '🏛️ Trung tâm chính trị',
        icon: '🏛️',
        cost: 5000,
        goldPerSecond: 0,
        popPerSecond: 0,
        sciencePerSecond: 0,
        effect: 'govern',
        value: 0,
        description: 'Quản lý đất nước, ổn định chính trị',
        maxLevel: 1,
        require: null
    },
    'headquarters': {
        id: 'headquarters',
        name: '🏛️ Trụ sở chính',
        icon: '🏛️',
        cost: 8000,
        goldPerSecond: 0,
        popPerSecond: 0,
        sciencePerSecond: 0,
        effect: 'allow_build',
        value: 0,
        description: 'Cho phép xây công trình khác',
        maxLevel: 1,
        require: 'political_center'
    },
    'primary_school': {
        id: 'primary_school',
        name: '🏫 Tiểu học',
        icon: '🏫',
        cost: 4000,
        goldPerSecond: 0,
        popPerSecond: 0,
        sciencePerSecond: 0.00001,
        effect: 'science',
        value: 0.00001,
        description: '+0.00001 KH/giây',
        maxLevel: 3,
        require: 'headquarters'
    },
    'secondary_school': {
        id: 'secondary_school',
        name: '🏫 Trung học',
        icon: '🏫',
        cost: 7000,
        goldPerSecond: 0,
        popPerSecond: 0,
        sciencePerSecond: 0.0001,
        effect: 'science',
        value: 0.0001,
        description: '+0.0001 KH/giây',
        maxLevel: 3,
        require: 'primary_school'
    },
    'university': {
        id: 'university',
        name: '🏛️ Đại học',
        icon: '🏛️',
        cost: 12000,
        goldPerSecond: 0,
        popPerSecond: 0,
        sciencePerSecond: 0.001,
        effect: 'science',
        value: 0.001,
        description: '+0.001 KH/giây',
        maxLevel: 3,
        require: 'secondary_school'
    },
    'research_lab': {
        id: 'research_lab',
        name: '🔬 Viện nghiên cứu',
        icon: '🔬',
        cost: 10000,
        goldPerSecond: 0,
        popPerSecond: 0,
        sciencePerSecond: 0.001,
        effect: 'science',
        value: 0.001,
        description: '+0.001 KH/giây, +20% thu nhập',
        maxLevel: 3,
        require: 'university'
    },
    'treasury': {
        id: 'treasury',
        name: '💰 Kho bạc',
        icon: '💰',
        cost: 5000,
        goldPerSecond: 5,
        popPerSecond: 0,
        sciencePerSecond: 0,
        effect: 'gold_income',
        value: 5,
        description: '+5 vàng/giây, -0.2% lạm phát',
        maxLevel: 5,
        require: 'headquarters'
    },
    'factory': {
        id: 'factory',
        name: '🏭 Nhà máy',
        icon: '🏭',
        cost: 7000,
        goldPerSecond: 10,
        popPerSecond: 0,
        sciencePerSecond: 0,
        effect: 'gold_income',
        value: 10,
        description: '+10 vàng/giây, -0.5% lạm phát',
        maxLevel: 5,
        require: 'headquarters'
    },
    'farm': {
        id: 'farm',
        name: '🌾 Trang trại',
        icon: '🌾',
        cost: 3500,
        goldPerSecond: 2,
        popPerSecond: 2,
        sciencePerSecond: 0,
        effect: 'population_growth',
        value: 2,
        description: '+2 vàng/giây, +2 dân/giây, -0.3% lạm phát',
        maxLevel: 5,
        require: 'headquarters'
    },
    'barracks': {
        id: 'barracks',
        name: '⚔️ Doanh trại',
        icon: '⚔️',
        cost: 6000,
        goldPerSecond: 0,
        popPerSecond: 0,
        sciencePerSecond: 0,
        effect: 'reduce_recruit_cost',
        value: 0.3,
        description: 'Giảm 30% chi phí tuyển quân',
        maxLevel: 3,
        require: 'headquarters'
    },
    'fortress': {
        id: 'fortress',
        name: '🛡️ Pháo đài',
        icon: '🛡️',
        cost: 8000,
        goldPerSecond: 0,
        popPerSecond: 0,
        sciencePerSecond: 0,
        effect: 'defense_boost',
        value: 0.5,
        description: '+50% phòng thủ cho tỉnh',
        maxLevel: 3,
        require: 'headquarters'
    },
    'hospital': {
        id: 'hospital',
        name: '🏥 Bệnh viện',
        icon: '🏥',
        cost: 6500,
        goldPerSecond: 0,
        popPerSecond: 5,
        sciencePerSecond: 0,
        effect: 'population_growth',
        value: 5,
        description: '+5 dân/giây',
        maxLevel: 3,
        require: 'headquarters'
    }
};

// === FESTIVAL (LỄ HỘI) ===
const FESTIVAL = {
    cost: 500,
    happinessBoost: 10,
    populationBoost: 2,
    inflationIncrease: 0.5
};

// === Lấy danh sách công trình có thể xây ===
function getAvailableBuildings(nationId, provinceId) {
    const available = [];
    const nation = game ? game.nations[nationId] : null;
    const province = game ? game.provinces[provinceId] : null;
    if (!nation || !province) return available;
    
    // Kiểm tra đã có Political Center chưa
    const hasPoliticalCenter = province.buildings.some(b => b === 'political_center');
    const isCapital = province.isCapital || false;
    
    for (const [id, building] of Object.entries(BUILDINGS)) {
        // Political Center chỉ xây ở thủ đô
        if (id === 'political_center') {
            if (!isCapital) continue;
            if (hasPoliticalCenter) continue;
        }
        // Các công trình khác cần Political Center
        if (id !== 'political_center' && !hasPoliticalCenter) continue;
        
        // Kiểm tra điều kiện tiên quyết
        if (building.require && !province.buildings.includes(building.require)) continue;
        
        // Kiểm tra max level
        const existing = province.buildings.filter(b => b === id).length;
        if (existing >= building.maxLevel) continue;
        
        available.push({
            ...building,
            currentLevel: existing,
            canAfford: nation.gold >= building.cost
        });
    }
    return available;
}
