// === MULTIPLAYER.JS - FIREBASE ===

class MultiplayerManager {
    constructor() {
        this.roomId = 'aoh_global_lobby';
        this.playerId = this.getPlayerId();
        this.isConnected = false;
        this.db = null;
        this.gameDataRef = null;
        this.lobbyRef = null;
        this.isOffline = false;
    }

    getPlayerId() {
        let id = localStorage.getItem('aoh_player_id');
        if (!id) {
            id = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            localStorage.setItem('aoh_player_id', id);
        }
        return id;
    }

    // === KẾT NỐI ===
    connect() {
        try {
            if (typeof firebase !== 'undefined' && firebase.database) {
                this.db = firebase.database();
                this.gameDataRef = this.db.ref(`games/${this.roomId}`);
                this.lobbyRef = this.db.ref(`lobby/${this.roomId}`);
                this.isConnected = true;
                this.listenGameData();
                this.listenLobby();
                console.log('✅ Đã kết nối Firebase!');
                return true;
            } else {
                console.warn('⚠️ Firebase chưa sẵn sàng, chạy offline mode');
                this.isOffline = true;
                this.isConnected = false;
                return true;
            }
        } catch (e) {
            console.warn('⚠️ Lỗi kết nối Firebase:', e);
            this.isOffline = true;
            this.isConnected = false;
            return true;
        }
    }

    // === LẮNG NGHE GAME DATA ===
    listenGameData() {
        if (!this.gameDataRef) return;
        this.gameDataRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && game) {
                this.onGameDataUpdate(data);
            }
        });
    }

    // === LẮNG NGHE LOBBY ===
    listenLobby() {
        if (!this.lobbyRef) return;
        this.lobbyRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && lobby) {
                lobby.onLobbyUpdate(data);
            }
        });
    }

    // === ĐỒNG BỘ GAME DATA ===
    syncGameData(data) {
        if (!this.isConnected || !this.gameDataRef) return;
        this.gameDataRef.set({
            ...data,
            lastUpdated: Date.now(),
            updatedBy: this.playerId
        }).catch(err => console.error('❌ Lỗi sync:', err));
    }

    // === NHẬN GAME DATA ===
    onGameDataUpdate(data) {
        if (!game) return;
        // Đồng bộ nations
        for (const [id, nationData] of Object.entries(data.nations || {})) {
            if (game.nations[id]) {
                game.nations[id].gold = nationData.gold || 0;
                game.nations[id].population = nationData.population || 0;
                game.nations[id].army = nationData.army || 0;
                game.nations[id].provinces = nationData.provinces || [];
                game.nations[id].buildings = nationData.buildings || [];
                game.nations[id].isAlive = nationData.isAlive !== false;
                game.nations[id].scienceLevel = nationData.scienceLevel || 0;
                game.nations[id].happiness = nationData.happiness || 75;
                game.nations[id].inflation = nationData.inflation || 0;
                game.nations[id].policies = nationData.policies || {};
            }
        }
        // Đồng bộ provinces
        for (const [id, provinceData] of Object.entries(data.provinces || {})) {
            if (game.provinces[id]) {
                game.provinces[id].nationId = provinceData.nationId || 0;
                game.provinces[id].population = provinceData.population || 0;
                game.provinces[id].army = provinceData.army || 0;
                game.provinces[id].buildings = provinceData.buildings || [];
                game.provinces[id].development = provinceData.development || 0;
            }
        }
        if (data.gameTime) game.gameTime = data.gameTime;
        if (data.gameDate) game.gameDate = data.gameDate;
        updateUI();
        renderMap();
    }

    // === NGẮT KẾT NỐI ===
    disconnect() {
        if (this.gameDataRef) this.gameDataRef.off();
        if (this.lobbyRef) this.lobbyRef.off();
        this.isConnected = false;
        console.log('🔌 Đã ngắt kết nối Firebase');
    }
}

const multiplayer = new MultiplayerManager();
