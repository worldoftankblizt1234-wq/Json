// === MULTIPLAYER - FIREBASE ===
class MultiplayerManager {
    constructor() {
        this.roomId = 'aoh_game_room';
        this.playerId = this.getPlayerId();
        this.isConnected = false;
        this.db = null;
        this.gameDataRef = null;
    }

    getPlayerId() {
        let id = localStorage.getItem('aoh_player_id');
        if (!id) {
            id = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            localStorage.setItem('aoh_player_id', id);
        }
        return id;
    }

    connect() {
        console.log('🔄 Đang kết nối Firebase...');
        try {
            // Firebase đã được import từ firebase-config.js
            if (typeof firebase !== 'undefined' && firebase.database) {
                this.db = firebase.database();
                this.gameDataRef = this.db.ref(`games/${this.roomId}`);
                this.isConnected = true;
                this.listenGameData();
                console.log('✅ Đã kết nối Firebase!');
            } else {
                console.warn('⚠️ Firebase chưa được cấu hình, chuyển sang offline mode');
                this.isConnected = false;
            }
        } catch (e) {
            console.warn('⚠️ Lỗi kết nối Firebase:', e);
            this.isConnected = false;
        }
    }

    listenGameData() {
        if (!this.gameDataRef) return;
        this.gameDataRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && game) {
                this.onGameDataUpdate(data);
            }
        });
    }

    syncGameData(data) {
        if (!this.isConnected || !this.gameDataRef) return;
        this.gameDataRef.set({
            ...data,
            lastUpdated: Date.now(),
            updatedBy: this.playerId
        }).catch(err => console.error('❌ Lỗi sync:', err));
    }

    onGameDataUpdate(data) {
        console.log('📥 Nhận dữ liệu từ server');
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
            }
        }
        
        // Đồng bộ provinces
        for (const [id, provinceData] of Object.entries(data.provinces || {})) {
            if (game.provinces[id]) {
                game.provinces[id].nationId = provinceData.nationId || 0;
                game.provinces[id].population = provinceData.population || 0;
                game.provinces[id].army = provinceData.army || 0;
                game.provinces[id].buildings = provinceData.buildings || [];
            }
        }
        
        if (data.gameTime) game.gameTime = data.gameTime;
        updateUI();
        renderMap();
    }

    disconnect() {
        if (this.gameDataRef) {
            this.gameDataRef.off();
        }
        this.isConnected = false;
        console.log('🔌 Đã ngắt kết nối Firebase');
    }
}

const multiplayer = new MultiplayerManager();
