// === CẤU HÌNH TOÀN CỤC ===
const CONFIG = {
    COLS: 180,
    ROWS: 100,
    BASE_HEX_RADIUS: 35,
    ZOOM_THRESHOLD: 0.65,
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 2.5,
    PROVINCE_MIN_TILES: 10,
    PROVINCE_MAX_TILES: 15,
    DEFAULT_TAX: 20,
    
    // Chi phí tuyển quân (đã tăng)
    RECRUIT_COST_GOLD: 50,
    RECRUIT_COST_POP: 5,
    
    // Tiền ban đầu
    START_GOLD_MIN: 15000,
    START_GOLD_MAX: 25000,
    
    // Thua trận
    DEFEAT_GOLD_RETAIN: 0.7,
    
    // KH
    SCIENCE_START: 0.00001,
    SCIENCE_MAX: 2.0,
};

// === 10 QUỐC GIA ===
const NATIONS = [
    { id: 10, name: "Red Empire", prefix: "Red", color: "#dc2626", borderHex: "#f87171", isMajor: true, gdp: 2450, happiness: 84, welfare: 24 },
    { id: 11, name: "Blue Kingdom", prefix: "Blue", color: "#2563eb", borderHex: "#60a5fa", isMajor: true, gdp: 2180, happiness: 81, welfare: 22 },
    { id: 12, name: "Green Republic", prefix: "Green", color: "#059669", borderHex: "#34d399", isMajor: true, gdp: 1950, happiness: 88, welfare: 28 },
    { id: 13, name: "Yellow Federation", prefix: "Yellow", color: "#d97706", borderHex: "#fbbf24", isMajor: true, gdp: 2300, happiness: 79, welfare: 19 },
    { id: 14, name: "Lime Principality", prefix: "Lime", color: "#65a30d", borderHex: "#a3e635", isMajor: false, gdp: 540, happiness: 80, welfare: 20 },
    { id: 15, name: "Cyan Duchy", prefix: "Cyan", color: "#0891b2", borderHex: "#22d3ee", isMajor: false, gdp: 720, happiness: 86, welfare: 25 },
    { id: 16, name: "Purple State", prefix: "Purple", color: "#7c3aed", borderHex: "#a78bfa", isMajor: false, gdp: 680, happiness: 82, welfare: 21 },
    { id: 17, name: "Rose Island", prefix: "Rose", color: "#e11d48", borderHex: "#fb7185", isMajor: false, gdp: 890, happiness: 91, welfare: 30 },
    { id: 18, name: "Orange Domain", prefix: "Orange", color: "#ea580c", borderHex: "#fb923c", isMajor: false, gdp: 610, happiness: 77, welfare: 18 },
    { id: 19, name: "Violet Realm", prefix: "Violet", color: "#9333ea", borderHex: "#c084fc", isMajor: false, gdp: 790, happiness: 85, welfare: 23 }
];

// === 20 VÙNG BIỂN ===
const SEA_ZONES = [
    { id: 1, name: "Bắc Thái Bình Dương", color: "#0c1e36" },
    { id: 2, name: "Tây Bắc Thái Bình Dương", color: "#0d223a" },
    { id: 3, name: "Đông Bắc Thái Bình Dương", color: "#0b253c" },
    { id: 4, name: "Bắc Đại Tây Dương", color: "#0a1d33" },
    { id: 5, name: "Tây Bắc Đại Tây Dương", color: "#102a45" },
    { id: 6, name: "Đông Bắc Đại Tây Dương", color: "#0e243d" },
    { id: 7, name: "Bắc Ấn Độ Dương", color: "#0a2138" },
    { id: 8, name: "Tây Ấn Độ Dương", color: "#0c1e36" },
    { id: 9, name: "Đông Ấn Độ Dương", color: "#0d223a" },
    { id: 10, name: "Nam Ấn Độ Dương", color: "#0b253c" },
    { id: 11, name: "Bắc Băng Dương", color: "#0a1d33" },
    { id: 12, name: "Nam Băng Dương", color: "#102a45" },
    { id: 13, name: "Biển Đông", color: "#0e243d" },
    { id: 14, name: "Biển Nhật Bản", color: "#0a2138" },
    { id: 15, name: "Biển Đen", color: "#0c1e36" },
    { id: 16, name: "Biển Địa Trung Hải", color: "#0d223a" },
    { id: 17, name: "Vịnh Mexico", color: "#0b253c" },
    { id: 18, name: "Biển Caribe", color: "#0a1d33" },
    { id: 19, name: "Biển Bắc", color: "#102a45" },
    { id: 20, name: "Biển Baltic", color: "#0e243d" }
];

// === THỦ ĐÔ ===
const CAPITALS = {
    10: { name: "Red City", provinceNum: null },
    11: { name: "Blue Citadel", provinceNum: null },
    12: { name: "Green Haven", provinceNum: null },
    13: { name: "Yellow Palace", provinceNum: null },
    14: { name: "Lime Keep", provinceNum: null },
    15: { name: "Cyan Port", provinceNum: null },
    16: { name: "Purple Spire", provinceNum: null },
    17: { name: "Rose Garden", provinceNum: null },
    18: { name: "Orange Citadel", provinceNum: null },
    19: { name: "Violet Tower", provinceNum: null }
};
