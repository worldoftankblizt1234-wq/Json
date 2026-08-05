
// === DỮ LIỆU BẢN ĐỒ ===
let mapType = new Uint8Array(CONFIG.COLS * CONFIG.ROWS);
let seaZoneId = new Uint8Array(CONFIG.COLS * CONFIG.ROWS);
let provinceNum = new Uint16Array(CONFIG.COLS * CONFIG.ROWS);
let provinceDetails = new Array(CONFIG.COLS * CONFIG.ROWS);
let provinceCenters = {};
let provinceArmies = {};
let capitalProvinces = {};
let regionLabels = [];

const canvas = document.getElementById('worldMapCanvas');
const ctx = canvas.getContext('2d');
const miniCanvas = document.getElementById('miniMapCanvas');
const miniCtx = miniCanvas.getContext('2d');

let cameraX = 0, cameraY = 0, zoom = 0.6, selectedHexIndex = -1;
let isDragging = false, touchStartX = 0, touchStartY = 0;
let lastTouchDist = 0, initialPinchDist = null;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    clampCamera();
}

function clampCamera() {
    const radius = CONFIG.BASE_HEX_RADIUS * zoom;
    const totalW = Math.sqrt(3) * radius * CONFIG.COLS;
    const totalH = (3/2) * radius * CONFIG.ROWS;
    cameraX = Math.min(0, Math.max(canvas.width - totalW, cameraX));
    cameraY = Math.min(0, Math.max(canvas.height - totalH, cameraY));
}

function getPixelCoords(c, r) {
    const radius = CONFIG.BASE_HEX_RADIUS * zoom;
    const width = Math.sqrt(3) * radius;
    const height = (3/2) * radius;
    let x = c * width + (r % 2 !== 0 ? width / 2 : 0);
    let y = r * height;
    return { x: x + cameraX, y: y + cameraY, radius };
}

function getHexVertices(c, r) {
    const { x, y, radius } = getPixelCoords(c, r);
    const verts = [];
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i - Math.PI / 6;
        verts.push({ x: x + radius * Math.cos(angle), y: y + radius * Math.sin(angle) });
    }
    return verts;
}

function getGridCoords(px, py) {
    const radius = CONFIG.BASE_HEX_RADIUS * zoom;
    const width = Math.sqrt(3) * radius;
    const height = (3/2) * radius;
    const relX = px - cameraX;
    const relY = py - cameraY;
    let r = Math.round(relY / height);
    let c = Math.round(relX / width);
    if (r % 2 !== 0) c = Math.round((relX - width / 2) / width);
    c = Math.max(0, Math.min(CONFIG.COLS - 1, c));
    r = Math.max(0, Math.min(CONFIG.ROWS - 1, r));
    return { col: c, row: r };
}

function getNeighbors(c, r) {
    const dirs = (r % 2 === 0) ?
        [{dc:1,dr:0},{dc:0,dr:-1},{dc:-1,dr:-1},{dc:-1,dr:0},{dc:-1,dr:1},{dc:0,dr:1}] :
        [{dc:1,dr:0},{dc:1,dr:-1},{dc:0,dr:-1},{dc:-1,dr:0},{dc:0,dr:1},{dc:1,dr:1}];
    const nb = [];
    for (const d of dirs) {
        const nc = c + d.dc, nr = r + d.dr;
        if (nc >= 0 && nc < CONFIG.COLS && nr >= 0 && nr < CONFIG.ROWS)
            nb.push({ col: nc, row: nr, index: nr * CONFIG.COLS + nc });
    }
    return nb;
}

function generateMap() {
    mapType.fill(0);
    seaZoneId.fill(0);
    for (let r = 0; r < CONFIG.ROWS; r++) {
        for (let c = 0; c < CONFIG.COLS; c++) {
            const idx = r * CONFIG.COLS + c;
            const sc = Math.floor(c / (CONFIG.COLS / 5));
            const sr = Math.floor(r / (CONFIG.ROWS / 4));
            seaZoneId[idx] = sr * 5 + sc + 1;
        }
    }
    const seeds = [
        { id: 10, c: 40, r: 30 }, { id: 11, c: 140, r: 30 },
        { id: 12, c: 50, r: 60 }, { id: 13, c: 150, r: 60 },
        { id: 14, c: 25, r: 45 }, { id: 15, c: 165, r: 45 },
        { id: 16, c: 80, r: 25 }, { id: 17, c: 110, r: 75 },
        { id: 18, c: 65, r: 75 }, { id: 19, c: 145, r: 20 },
        { id: 1, c: 90, r: 45 }, { id: 1, c: 90, r: 55 }
    ];
    const allPoints = [];
    for (const seed of seeds) {
        const radius = (seed.id >= 10 && NATIONS.find(n => n.id === seed.id)?.isMajor) ? 18 : 14;
        for (let r = 0; r < CONFIG.ROWS; r++) {
            for (let c = 0; c < CONFIG.COLS; c++) {
                const dist = Math.hypot(c - seed.c, r - seed.r);
                if (dist < radius + (Math.sin(c * 0.2 + r * 0.15) * 3)) {
                    allPoints.push({ c, r, id: seed.id });
                }
            }
        }
    }
    const tileMap = new Map();
    for (const p of allPoints) {
        const key = p.r * CONFIG.COLS + p.c;
        if (!tileMap.has(key)) tileMap.set(key, p);
        else {
            const old = tileMap.get(key);
            const distOld = Math.hypot(old.c - seeds.find(s => s.id === old.id)?.c || 0, old.r - seeds.find(s => s.id === old.id)?.r || 0);
            const distNew = Math.hypot(p.c - seeds.find(s => s.id === p.id)?.c || 0, p.r - seeds.find(s => s.id === p.id)?.r || 0);
            if (distNew < distOld) tileMap.set(key, p);
        }
    }
    for (const [key, p] of tileMap) mapType[key] = p.id;
    for (const n of NATIONS) {
        let count = 0;
        for (let i = 0; i < CONFIG.COLS * CONFIG.ROWS; i++) if (mapType[i] === n.id) count++;
        const target = n.isMajor ? Math.floor(Math.random() * 26) + 100 : Math.floor(Math.random() * 26) + 50;
        if (count < target) {
            const borderCells = [];
            for (let i = 0; i < CONFIG.COLS * CONFIG.ROWS; i++) {
                if (mapType[i] === n.id) {
                    const c = i % CONFIG.COLS, r = Math.floor(i / CONFIG.COLS);
                    for (const nb of getNeighbors(c, r)) {
                        if (mapType[nb.index] === 0) borderCells.push(nb.index);
                    }
                }
            }
            let need = target - count;
            while (need > 0 && borderCells.length > 0) {
                const idx = borderCells.splice(Math.floor(Math.random() * borderCells.length), 1)[0];
                if (mapType[idx] === 0) { mapType[idx] = n.id; need--; }
            }
        }
    }
    for (let i = 0; i < CONFIG.COLS * CONFIG.ROWS; i++) {
        if (mapType[i] === 1) {
            let count = 0;
            const stack = [i];
            const visited = new Set();
            while (stack.length > 0) {
                const idx = stack.pop();
                if (visited.has(idx)) continue;
                visited.add(idx);
                count++;
                const c = idx % CONFIG.COLS, r = Math.floor(idx / CONFIG.COLS);
                for (const nb of getNeighbors(c, r)) {
                    if (mapType[nb.index] === 1 && !visited.has(nb.index)) stack.push(nb.index);
                }
            }
            if (count < 10) for (const idx of visited) mapType[idx] = 0;
        }
    }
    for (let i = 0; i < CONFIG.COLS * CONFIG.ROWS; i++) {
        if (mapType[i] === 0) {
            const c = i % CONFIG.COLS, r = Math.floor(i / CONFIG.COLS);
            const sc = Math.floor(c / (CONFIG.COLS / 5));
            const sr = Math.floor(r / (CONFIG.ROWS / 4));
            seaZoneId[i] = sr * 5 + sc + 1;
        }
    }
    clusterProvinces();
    computeRegionLabels();
}

function clusterProvinces() {
    const landIndices = [];
    for (let i = 0; i < CONFIG.COLS * CONFIG.ROWS; i++) if (mapType[i] !== 0) landIndices.push(i);
    const nationGroups = {};
    for (const idx of landIndices) {
        const type = mapType[idx];
        if (!nationGroups[type]) nationGroups[type] = [];
        nationGroups[type].push(idx);
    }
    const provinceAssign = new Uint16Array(CONFIG.COLS * CONFIG.ROWS);
    let provinceCounter = 1;
    for (const [type, indices] of Object.entries(nationGroups)) {
        const remaining = [...indices];
        while (remaining.length > 0) {
            const seed = remaining.pop();
            const queue = [seed];
            const visited = new Set();
            visited.add(seed);
            const cluster = [];
            while (queue.length > 0 && cluster.length < CONFIG.PROVINCE_MAX_TILES) {
                const current = queue.shift();
                cluster.push(current);
                const c = current % CONFIG.COLS;
                const r = Math.floor(current / CONFIG.COLS);
                for (const nb of getNeighbors(c, r)) {
                    const nbIdx = nb.index;
                    if (!visited.has(nbIdx) && mapType[nbIdx] === parseInt(type) && remaining.includes(nbIdx)) {
                        visited.add(nbIdx);
                        const indexInRemaining = remaining.indexOf(nbIdx);
                        if (indexInRemaining !== -1) remaining.splice(indexInRemaining, 1);
                        queue.push(nbIdx);
                    }
                }
            }
            for (const idx of cluster) provinceAssign[idx] = provinceCounter;
            provinceCounter++;
        }
    }
    for (let i = 0; i < CONFIG.COLS * CONFIG.ROWS; i++) provinceNum[i] = provinceAssign[i];
    provinceCenters = {};
    const provinceIndices = {};
    for (let i = 0; i < CONFIG.COLS * CONFIG.ROWS; i++) {
        const pNum = provinceNum[i];
        if (pNum !== 0) {
            if (!provinceIndices[pNum]) provinceIndices[pNum] = [];
            provinceIndices[pNum].push(i);
        }
    }
    for (const [pNum, indices] of Object.entries(provinceIndices)) {
        let sumC = 0, sumR = 0;
        for (const idx of indices) {
            sumC += idx % CONFIG.COLS;
            sumR += Math.floor(idx / CONFIG.COLS);
        }
        provinceCenters[pNum] = { c: Math.round(sumC / indices.length), r: Math.round(sumR / indices.length) };
    }
    // Chọn thủ đô ngẫu nhiên
    for (const [nationId, capital] of Object.entries(CAPITALS)) {
        const id = parseInt(nationId);
        const nationProvinces = [];
        for (const [pNum, indices] of Object.entries(provinceIndices)) {
            const idx = indices[0];
            if (mapType[idx] === id) nationProvinces.push(parseInt(pNum));
        }
        if (nationProvinces.length > 0) {
            const randomIndex = Math.floor(Math.random() * nationProvinces.length);
            const selectedProvince = nationProvinces[randomIndex];
            capital.provinceNum = selectedProvince;
            capitalProvinces[id] = selectedProvince;
        }
    }
}

function computeRegionLabels() {
    const groups = {};
    for (let i = 0; i < CONFIG.COLS * CONFIG.ROWS; i++) {
        const type = mapType[i];
        if (type === 0) {
            const sId = seaZoneId[i];
            const key = 'sea_' + sId;
            if (!groups[key]) groups[key] = { sumC: 0, sumR: 0, count: 0 };
            const c = i % CONFIG.COLS, r = Math.floor(i / CONFIG.COLS);
            groups[key].sumC += c; groups[key].sumR += r; groups[key].count++;
        } else if (type === 1) {
            const key = 'neutral';
            if (!groups[key]) groups[key] = { sumC: 0, sumR: 0, count: 0 };
            const c = i % CONFIG.COLS, r = Math.floor(i / CONFIG.COLS);
            groups[key].sumC += c; groups[key].sumR += r; groups[key].count++;
        } else {
            const key = 'nation_' + type;
            if (!groups[key]) groups[key] = { sumC: 0, sumR: 0, count: 0 };
            const c = i % CONFIG.COLS, r = Math.floor(i / CONFIG.COLS);
            groups[key].sumC += c; groups[key].sumR += r; groups[key].count++;
        }
    }
    regionLabels = [];
    for (const [key, data] of Object.entries(groups)) {
        const cAvg = data.sumC / data.count;
        const rAvg = data.sumR / data.count;
        const c = Math.round(cAvg), r = Math.round(rAvg);
        let name = '';
        if (key.startsWith('nation_')) {
            const id = parseInt(key.split('_')[1]);
            const nat = NATIONS.find(n => n.id === id);
            if (nat) name = nat.prefix;
        } else if (key.startsWith('sea_')) {
            const sId = parseInt(key.split('_')[1]);
            const sea = SEA_ZONES.find(s => s.id === sId);
            if (sea) name = sea.name;
        } else if (key === 'neutral') name = 'Trung Lập';
        if (name) regionLabels.push({ name, c, r });
    }
}

function renderMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const radius = CONFIG.BASE_HEX_RADIUS * zoom;
    const width = Math.sqrt(3) * radius;
    const height = (3/2) * radius;
    const minRow = Math.max(0, Math.floor((-cameraY - 30) / height));
    const maxRow = Math.min(CONFIG.ROWS - 1, Math.ceil((canvas.height - cameraY + 30) / height));
    const minCol = Math.max(0, Math.floor((-cameraX - 30) / width));
    const maxCol = Math.min(CONFIG.COLS - 1, Math.ceil((canvas.width - cameraX + 30) / width));
    const isZoomedOut = zoom < CONFIG.ZOOM_THRESHOLD;

    if (isZoomedOut) {
        // Vẽ vùng
        const regionMap = {};
        for (let i = 0; i < CONFIG.COLS * CONFIG.ROWS; i++) {
            const type = mapType[i];
            let key = type === 0 ? 'sea_' + seaZoneId[i] : type === 1 ? 'neutral' : 'nation_' + type;
            if (!regionMap[key]) {
                regionMap[key] = { color: '#333', tiles: [] };
                if (type === 0) { const sea = SEA_ZONES[seaZoneId[i] - 1]; regionMap[key].color = sea ? sea.color : '#0a1d33'; }
                else if (type === 1) regionMap[key].color = '#2d3748';
                else { const nat = NATIONS.find(n => n.id === type); regionMap[key].color = nat ? nat.color : '#fff'; }
            }
            regionMap[key].tiles.push(i);
        }
        for (const [key, region] of Object.entries(regionMap)) {
            if (region.tiles.length < 3) continue;
            const edgeSegments = [];
            const tileSet = new Set(region.tiles);
            for (const idx of region.tiles) {
                const c = idx % CONFIG.COLS, r = Math.floor(idx / CONFIG.COLS);
                const verts = getHexVertices(c, r);
                for (const nb of getNeighbors(c, r)) {
                    if (!tileSet.has(nb.index)) {
                        const nbCenter = getPixelCoords(nb.col, nb.row);
                        const distances = verts.map((v, i) => ({ i, dist: Math.hypot(v.x - nbCenter.x, v.y - nbCenter.y) }));
                        distances.sort((a, b) => a.dist - b.dist);
                        const v1 = verts[distances[0].i], v2 = verts[distances[1].i];
                        edgeSegments.push({ x1: v1.x, y1: v1.y, x2: v2.x, y2: v2.y });
                    }
                }
            }
            if (edgeSegments.length > 2) {
                ctx.beginPath();
                ctx.moveTo(edgeSegments[0].x1, edgeSegments[0].y1);
                for (const edge of edgeSegments) ctx.lineTo(edge.x2, edge.y2);
                ctx.closePath();
                ctx.fillStyle = region.color;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        // Tên vùng
        for (const label of regionLabels) {
            const { x, y } = getPixelCoords(label.c, label.r);
            if (x > -50 && x < canvas.width + 50 && y > -50 && y < canvas.height + 50) {
                ctx.shadowColor = 'rgba(0,0,0,0.9)';
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${Math.floor(10 * zoom + 12)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label.name, x, y);
                ctx.shadowBlur = 0;
            }
        }
    } else {
        // Vẽ ô lục giác
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const idx = r * CONFIG.COLS + c;
                const type = mapType[idx];
                const isSelected = (idx === selectedHexIndex);
                const { x, y } = getPixelCoords(c, r);
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = Math.PI / 3 * i - Math.PI / 6;
                    const hx = x + radius * Math.cos(angle);
                    const hy = y + radius * Math.sin(angle);
                    i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                if (type === 0) { const sea = SEA_ZONES[seaZoneId[idx] - 1] || SEA_ZONES[0]; ctx.fillStyle = sea.color; }
                else if (type === 1) ctx.fillStyle = "#2d3748";
                else { const nat = NATIONS.find(n => n.id === type); ctx.fillStyle = nat ? nat.color : '#fff'; }
                ctx.fill();
                if (isSelected) { ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 3; ctx.stroke(); }
            }
        }
        // Biên giới
        ctx.lineWidth = 1.5;
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const idx = r * CONFIG.COLS + c;
                const type = mapType[idx];
                if (type === 0) continue;
                const pNum = provinceNum[idx];
                const nat = NATIONS.find(n => n.id === type);
                if (!nat) continue;
                ctx.strokeStyle = nat.borderHex;
                const verts = getHexVertices(c, r);
                for (const nb of getNeighbors(c, r)) {
                    const nbIdx = nb.index;
                    const nbType = mapType[nbIdx];
                    const nbPNum = provinceNum[nbIdx];
                    if (nbType !== type || nbPNum !== pNum) {
                        const nbCenter = getPixelCoords(nb.col, nb.row);
                        const distances = verts.map((v, i) => ({ i, dist: Math.hypot(v.x - nbCenter.x, v.y - nbCenter.y) }));
                        distances.sort((a, b) => a.dist - b.dist);
                        const v1 = verts[distances[0].i], v2 = verts[distances[1].i];
                        ctx.beginPath();
                        ctx.moveTo(v1.x, v1.y);
                        ctx.lineTo(v2.x, v2.y);
                        ctx.stroke();
                    }
                }
            }
        }
        // Vẽ ngôi sao thủ đô
        for (const [nationId, pNum] of Object.entries(capitalProvinces)) {
            const center = provinceCenters[pNum];
            if (center) {
                const { x, y } = getPixelCoords(center.c, center.r);
                const starSize = Math.max(8, radius * 0.4);
                drawStar(x, y, starSize, starSize * 0.4, 5, '#ffd700');
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, starSize * 2);
                gradient.addColorStop(0, 'rgba(255,215,0,0.2)');
                gradient.addColorStop(1, 'rgba(255,215,0,0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, starSize * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    renderMiniMap();
}

function drawStar(cx, cy, outerRadius, innerRadius, points, color) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function renderMiniMap() {
    const mW = miniCanvas.width, mH = miniCanvas.height;
    miniCtx.clearRect(0, 0, mW, mH);
    const cellW = mW / CONFIG.COLS, cellH = mH / CONFIG.ROWS;
    for (let r = 0; r < CONFIG.ROWS; r += 2) {
        for (let c = 0; c < CONFIG.COLS; c += 2) {
            const idx = r * CONFIG.COLS + c;
            const type = mapType[idx];
            if (type === 0) miniCtx.fillStyle = "#0d1b2a";
            else if (type === 1) miniCtx.fillStyle = "#374151";
            else { const nat = NATIONS.find(n => n.id === type); miniCtx.fillStyle = nat ? nat.color : "#ffffff"; }
            miniCtx.fillRect(c * cellW, r * cellH, cellW * 2, cellH * 2);
        }
    }
    // Sao trên mini map
    for (const [nationId, pNum] of Object.entries(capitalProvinces)) {
        const center = provinceCenters[pNum];
        if (center) {
            const x = center.c * cellW + cellW, y = center.r * cellH + cellH;
            miniCtx.fillStyle = '#ffd700';
            miniCtx.font = '8px sans-serif';
            miniCtx.textAlign = 'center';
            miniCtx.textBaseline = 'middle';
            miniCtx.fillText('⭐', x, y);
        }
    }
    // Khung viewport
    const radius = CONFIG.BASE_HEX_RADIUS * zoom;
    const totalW = Math.sqrt(3) * radius * CONFIG.COLS;
    const totalH = (3/2) * radius * CONFIG.ROWS;
    const vw = canvas.width / totalW, vh = canvas.height / totalH;
    const boxW = Math.max(8, mW * vw), boxH = Math.max(6, mH * vh);
    const boxX = Math.max(0, Math.min(mW - boxW, (-cameraX / totalW) * mW));
    const boxY = Math.max(0, Math.min(mH - boxH, (-cameraY / totalH) * mH));
    miniCtx.strokeStyle = "#fbbf24";
    miniCtx.lineWidth = 1;
    miniCtx.strokeRect(boxX, boxY, boxW, boxH);
}
