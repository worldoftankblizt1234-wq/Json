// === LOBBY.JS - QUẢN LÝ PHÒNG CHỜ ===

class LobbyManager {
    constructor() {
        this.roomId = 'aoh_game_room';
        this.players = {};
        this.nationStatus = {};
        this.isGameStarted = false;
        this.db = null;
        this.playerId = this.getPlayerId();
    }

    getPlayerId() {
        let id = localStorage.getItem('aoh_player_id');
        if (!id) {
            id = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            localStorage.setItem('aoh_player_id', id);
        }
        return id;
    }

    // === KẾT NỐI FIREBASE ===
    connect() {
        try {
            if (typeof firebase !== 'undefined' && firebase.database) {
                this.db = firebase.database();
                this.listenLobby();
                this.listenGameStatus();
                console.log('✅ Đã kết nối Lobby!');
                return true;
            }
        } catch (e) {
            console.warn('⚠️ Không thể kết nối Firebase:', e);
        }
        return false;
    }

    // === LẮNG NGHE PHÒNG ===
    listenLobby() {
        const lobbyRef = this.db.ref(`lobby/${this.roomId}`);
        lobbyRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.players = data.players || {};
                this.nationStatus = data.nationStatus || {};
                this.updateLobbyUI();
            }
        });
    }

    // === LẮNG NGHE TRẠNG THÁI GAME ===
    listenGameStatus() {
        const gameRef = this.db.ref(`games/${this.roomId}/status`);
        gameRef.on('value', (snapshot) => {
            const status = snapshot.val();
            if (status === 'started' && !this.isGameStarted) {
                this.isGameStarted = true;
                this.startGame();
            }
        });
    }

    // === THAM GIA PHÒNG ===
    joinLobby(nationId, playerName = 'Player') {
        if (!this.db) return false;
        
        const lobbyRef = this.db.ref(`lobby/${this.roomId}`);
        const playerRef = this.db.ref(`lobby/${this.roomId}/players/${this.playerId}`);
        const nationRef = this.db.ref(`lobby/${this.roomId}/nationStatus/${nationId}`);
        
        // Kiểm tra nước đã có người chơi chưa
        nationRef.once('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.taken) {
                showToast('❌ Nước này đã có người chơi!', 'error');
                return false;
            }
            
            // Đánh dấu nước đã được chọn
            nationRef.set({
                taken: true,
                playerId: this.playerId,
                playerName: playerName,
                timestamp: Date.now()
            });
            
            // Thêm người chơi vào danh sách
            playerRef.set({
                playerId: this.playerId,
                playerName: playerName,
                nationId: nationId,
                isReady: false,
                timestamp: Date.now()
            });
            
            showToast(`✅ Đã tham gia với ${NATIONS.find(n => n.id === nationId)?.name}`, 'success');
            return true;
        });
    }

    // === CẬP NHẬT UI PHÒNG ===
    updateLobbyUI() {
        const container = document.getElementById('lobby-container');
        if (!container) return;
        
        const players = Object.values(this.players || {});
        const nations = NATIONS.map(n => {
            const status = this.nationStatus[n.id];
            return {
                ...n,
                taken: status?.taken || false,
                playerName: status?.playerName || 'AI',
                isPlayer: status?.playerId === this.playerId
            };
        });
        
        container.innerHTML = `
            <div class="mb-4">
                <h3 class="text-white font-bold text-sm">👥 Người chơi (${players.length}/10)</h3>
                <div class="flex flex-wrap gap-2 mt-2">
                    ${players.map(p => `
                        <div class="bg-gray-800/50 px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-green-500"></span>
                            ${p.playerName} 
                            <span class="text-gray-400">(${NATIONS.find(n => n.id === p.nationId)?.name || '?'})</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div>
                <h3 class="text-white font-bold text-sm mb-2">🏛️ Chọn quốc gia</h3>
                <div class="grid grid-cols-2 gap-2">
                    ${nations.map(n => `
                        <button onclick="selectNationLobby(${n.id})" 
                            class="px-3 py-2 rounded-xl border-2 text-xs font-bold transition flex items-center justify-between
                                ${n.isPlayer ? 'border-green-500 bg-green-500/20' : ''}
                                ${n.taken && !n.isPlayer ? 'border-red-500/50 bg-red-500/10 opacity-50 cursor-not-allowed' : 'border-gray-700 hover:border-indigo-500'}
                            "
                            ${n.taken && !n.isPlayer ? 'disabled' : ''}>
                            <span class="flex items-center gap-2">
                                <span class="w-3 h-3 rounded-full" style="background:${n.color}"></span>
                                ${n.name}
                            </span>
                            <span class="text-[8px]">
                                ${n.isPlayer ? '✅ Bạn' : n.taken ? `👤 ${n.playerName}` : '🤖 AI'}
                            </span>
                        </button>
                    `).join('')}
                </div>
            </div>
            <button id="btn-start-game" class="mt-4 w-full px-4 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition disabled:opacity-50">
                🚀 Bắt đầu game
            </button>
        `;
        
        // Gắn sự kiện start game
        document.getElementById('btn-start-game')?.addEventListener('click', () => {
            this.startGame();
        });
    }

    // === BẮT ĐẦU GAME ===
    startGame() {
        if (this.isGameStarted) return;
        
        // Kiểm tra có ít nhất 2 người chơi
        const players = Object.values(this.players || {});
        if (players.length < 2) {
            showToast('❌ Cần ít nhất 2 người chơi để bắt đầu!', 'error');
            return;
        }
        
        // Cập nhật trạng thái game trên server
        this.db.ref(`games/${this.roomId}/status`).set('started');
        this.isGameStarted = true;
        
        // Đóng lobby
        document.getElementById('lobby-modal')?.remove();
        
        // Bắt đầu game
        startGameFromLobby(players);
    }
}

// === KHỞI TẠO LOBBY ===
const lobby = new LobbyManager();

// === HÀM CHỌN NƯỚC TRONG LOBBY ===
window.selectNationLobby = function(nationId) {
    const playerName = prompt('Nhập tên của bạn:', 'Player_' + Math.floor(Math.random() * 1000));
    if (playerName) {
        lobby.joinLobby(nationId, playerName);
    }
};

// === HIỂN THỊ LOBBY ===
function showLobby() {
    const modal = document.createElement('div');
    modal.id = 'lobby-modal';
    modal.className = 'fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-gray-900 border border-indigo-500/40 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h1 class="text-2xl font-bold text-white text-center mb-2">🌍 AGE OF HISTORY</h1>
            <p class="text-gray-400 text-center text-sm mb-4">🌐 Phòng chờ - Chọn quốc gia của bạn</p>
            <div id="lobby-container"></div>
            <p class="text-gray-500 text-[10px] text-center mt-4">Các nước không có người chơi sẽ do AI điều khiển</p>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Kết nối Firebase
    lobby.connect();
}

// === BẮT ĐẦU GAME TỪ LOBBY ===
function startGameFromLobby(players) {
    console.log('🚀 Bắt đầu game với', players.length, 'người chơi');
    
    // Xác định người chơi và AI
    const playerNations = players.map(p => p.nationId);
    const aiNations = NATIONS.filter(n => !playerNations.includes(n.id)).map(n => n.id);
    
    console.log('👑 Người chơi:', playerNations.map(id => NATIONS.find(n => n.id === id)?.name));
    console.log('🤖 AI:', aiNations.map(id => NATIONS.find(n => n.id === id)?.name));
    
    // Lưu thông tin vào localStorage
    localStorage.setItem('aoh_player_nations', JSON.stringify(playerNations));
    localStorage.setItem('aoh_ai_nations', JSON.stringify(aiNations));
    
    // Khởi tạo game
    startGame();
}
