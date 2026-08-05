// === LOBBY.JS - PHÒNG CHỜ ===

class LobbyManager {
    constructor() {
        this.roomId = 'aoh_global_lobby';
        this.players = {};
        this.nationStatus = {};
        this.isGameStarted = false;
        this.db = null;
        this.playerId = this.getPlayerId();
        this.isHost = false;
        this.hostId = null;
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
            } else {
                // Fallback: chạy offline với AI
                console.warn('⚠️ Firebase chưa sẵn sàng, chạy offline mode');
                this.isOffline = true;
                return true;
            }
        } catch (e) {
            console.warn('⚠️ Không thể kết nối Firebase:', e);
            this.isOffline = true;
            return true;
        }
    }

    // === LẮNG NGHE PHÒNG ===
    listenLobby() {
        if (!this.db) return;
        const lobbyRef = this.db.ref(`lobby/${this.roomId}`);
        lobbyRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.players = data.players || {};
                this.nationStatus = data.nationStatus || {};
                this.hostId = data.hostId || null;
                this.isHost = (this.hostId === this.playerId);
                this.updateLobbyUI();
            } else {
                // Nếu chưa có lobby, tạo mới
                this.createLobby();
            }
        });
    }

    // === TẠO LOBBY MỚI ===
    createLobby() {
        if (!this.db) return;
        const lobbyRef = this.db.ref(`lobby/${this.roomId}`);
        lobbyRef.set({
            hostId: this.playerId,
            players: {},
            nationStatus: {},
            createdAt: Date.now(),
            status: 'waiting'
        });
    }

    // === LẮNG NGHE TRẠNG THÁI GAME ===
    listenGameStatus() {
        if (!this.db) return;
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
    joinLobby(nationId) {
        if (!this.db) return false;
        
        const playerName = currentPlayer || localStorage.getItem('aoh_player_name') || 'Player';
        
        // Kiểm tra nước đã có người chơi chưa
        const nationRef = this.db.ref(`lobby/${this.roomId}/nationStatus/${nationId}`);
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
            const playerRef = this.db.ref(`lobby/${this.roomId}/players/${this.playerId}`);
            playerRef.set({
                playerId: this.playerId,
                playerName: playerName,
                nationId: nationId,
                isReady: false,
                timestamp: Date.now()
            });
            
            showToast(`✅ Đã chọn ${NATIONS.find(n => n.id === nationId)?.name}`, 'success');
            return true;
        });
    }

    // === RỜI PHÒNG ===
    leaveLobby() {
        if (!this.db) return;
        
        // Xóa người chơi
        const playerRef = this.db.ref(`lobby/${this.roomId}/players/${this.playerId}`);
        playerRef.remove();
        
        // Xóa nation đã chọn
        for (const [id, status] of Object.entries(this.nationStatus || {})) {
            if (status.playerId === this.playerId) {
                this.db.ref(`lobby/${this.roomId}/nationStatus/${id}`).remove();
            }
        }
    }

    // === CẬP NHẬT UI PHÒNG ===
    updateLobbyUI() {
        const container = document.getElementById('lobby-container');
        if (!container) return;
        
        const players = Object.values(this.players || {});
        const playerCount = players.length;
        
        // Kiểm tra tất cả người chơi đã chọn nước chưa
        const allReady = players.every(p => p.nationId !== undefined && p.nationId !== null);
        const canStart = playerCount >= 2 && allReady && this.isHost;
        
        // Danh sách nước
        const nations = NATIONS.map(n => {
            const status = this.nationStatus[n.id];
            const isTaken = status?.taken || false;
            const isMine = status?.playerId === this.playerId;
            const playerName = status?.playerName || 'AI';
            return { ...n, isTaken, isMine, playerName };
        });
        
        container.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <div>
                    <h3 class="text-white font-bold text-sm">👥 Phòng chờ</h3>
                    <p class="text-gray-400 text-[10px]">${playerCount}/10 người chơi</p>
                </div>
                <div class="flex items-center gap-2">
                    ${this.isHost ? '<span class="text-yellow-400 text-[10px] bg-yellow-500/20 px-2 py-0.5 rounded-full">👑 Host</span>' : ''}
                    <button onclick="leaveLobby()" class="text-gray-400 hover:text-red-400 text-xs">✕ Rời</button>
                </div>
            </div>
            
            <!-- Danh sách người chơi -->
            <div class="bg-gray-800/30 rounded-xl p-3 mb-3">
                <div class="flex flex-wrap gap-2">
                    ${players.length === 0 ? '<span class="text-gray-500 text-xs">Chưa có người chơi</span>' : ''}
                    ${players.map(p => `
                        <div class="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full">
                            <span class="w-2 h-2 rounded-full ${p.nationId ? 'bg-green-500' : 'bg-yellow-500'}"></span>
                            <span class="text-white text-xs font-bold">${p.playerName}</span>
                            ${p.nationId ? `<span class="text-gray-400 text-[10px]">(${NATIONS.find(n => n.id === p.nationId)?.name || '?'})</span>` : '<span class="text-yellow-400 text-[10px]">⏳ Đang chọn...</span>'}
                            ${p.playerId === this.playerId ? '<span class="text-indigo-400 text-[10px]">(Bạn)</span>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Chọn quốc gia -->
            <div>
                <h4 class="text-gray-300 text-xs font-bold mb-2">🏛️ Chọn quốc gia (click vào nước để chọn)</h4>
                <div class="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                    ${nations.map(n => `
                        <button onclick="selectNationLobby(${n.id})" 
                            class="px-2 py-1.5 rounded-lg border-2 text-[10px] font-bold transition flex items-center justify-between
                                ${n.isMine ? 'border-green-500 bg-green-500/20' : ''}
                                ${n.isTaken && !n.isMine ? 'border-red-500/30 bg-red-500/10 opacity-50 cursor-not-allowed' : 'border-gray-700 hover:border-indigo-500 hover:bg-indigo-500/10'}
                            "
                            ${n.isTaken && !n.isMine ? 'disabled' : ''}>
                            <span class="flex items-center gap-1.5">
                                <span class="w-2.5 h-2.5 rounded-full" style="background:${n.color}"></span>
                                <span class="text-white">${n.name}</span>
                            </span>
                            <span class="text-[8px]">
                                ${n.isMine ? '✅ Bạn' : n.isTaken ? `👤 ${n.playerName}` : '🤖 AI'}
                            </span>
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <!-- Nút bắt đầu -->
            <button id="btn-start-game" 
                class="mt-3 w-full px-4 py-2.5 rounded-xl font-bold text-sm transition ${canStart ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}"
                ${canStart ? '' : 'disabled'}>
                ${this.isHost ? '🚀 Bắt đầu game' : '⏳ Chờ host bắt đầu...'}
            </button>
            ${canStart ? `<p class="text-green-400 text-[8px] text-center mt-1">✅ Tất cả đã sẵn sàng! Host bấm bắt đầu</p>` : ''}
            ${!this.isHost && playerCount >= 2 ? `<p class="text-yellow-400 text-[8px] text-center mt-1">⏳ Đang chờ host...</p>` : ''}
        `;
        
        // Gắn sự kiện start game
        document.getElementById('btn-start-game')?.addEventListener('click', () => {
            if (canStart) this.startGame();
        });
    }

    // === BẮT ĐẦU GAME ===
    startGame() {
        if (this.isGameStarted) return;
        if (!this.isHost) {
            showToast('❌ Chỉ host mới có thể bắt đầu!', 'error');
            return;
        }
        
        const players = Object.values(this.players || {});
        if (players.length < 2) {
            showToast('❌ Cần ít nhất 2 người chơi!', 'error');
            return;
        }
        
        // Kiểm tra tất cả đã chọn nước chưa
        const allReady = players.every(p => p.nationId !== undefined && p.nationId !== null);
        if (!allReady) {
            showToast('❌ Tất cả người chơi phải chọn nước!', 'error');
            return;
        }
        
        // Cập nhật trạng thái game
        if (this.db) {
            this.db.ref(`games/${this.roomId}/status`).set('started');
            this.db.ref(`games/${this.roomId}/players`).set(this.players);
            this.db.ref(`games/${this.roomId}/nationStatus`).set(this.nationStatus);
            this.db.ref(`games/${this.roomId}/startTime`).set(Date.now());
        }
        
        this.isGameStarted = true;
        
        // Lưu danh sách người chơi vào localStorage
        const playerNations = players.map(p => p.nationId);
        const aiNations = NATIONS.filter(n => !playerNations.includes(n.id)).map(n => n.id);
        
        localStorage.setItem('aoh_player_nations', JSON.stringify(playerNations));
        localStorage.setItem('aoh_ai_nations', JSON.stringify(aiNations));
        localStorage.setItem('aoh_players', JSON.stringify(players));
        
        // Đóng lobby
        document.getElementById('lobby-modal')?.remove();
        
        // Bắt đầu game
        startGame();
    }
}

// === KHỞI TẠO LOBBY ===
const lobby = new LobbyManager();

// === HÀM CHỌN NƯỚC ===
window.selectNationLobby = function(nationId) {
    if (lobby.isGameStarted) {
        showToast('❌ Game đã bắt đầu!', 'error');
        return;
    }
    lobby.joinLobby(nationId);
};

// === RỜI PHÒNG ===
window.leaveLobby = function() {
    if (confirm('Bạn có chắc muốn rời phòng chờ?')) {
        lobby.leaveLobby();
        document.getElementById('lobby-modal')?.remove();
        showLogin();
    }
};

// === HIỂN THỊ LOBBY ===
function showLobby() {
    // Xóa modal cũ
    document.getElementById('lobby-modal')?.remove();
    
    const modal = document.createElement('div');
    modal.id = 'lobby-modal';
    modal.className = 'fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-gray-900 border border-indigo-500/30 rounded-2xl p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div class="text-center mb-3">
                <h1 class="text-xl font-bold text-white">🌍 AGE OF HISTORY</h1>
                <p class="text-gray-400 text-xs">Phòng chờ - Chọn quốc gia của bạn</p>
            </div>
            <div id="lobby-container"></div>
            <p class="text-gray-500 text-[8px] text-center mt-3">Các nước không có người chơi sẽ do AI điều khiển</p>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Kết nối Firebase
    lobby.connect();
}
