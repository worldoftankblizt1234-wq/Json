// === AUTH.JS - ĐĂNG NHẬP ===

let currentPlayer = null;

// === HIỂN THỊ MÀN HÌNH ĐĂNG NHẬP ===
function showLogin() {
    // Kiểm tra đã đăng nhập chưa
    const saved = localStorage.getItem('aoh_player_name');
    if (saved) {
        currentPlayer = saved;
        showLobby();
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'login-modal';
    modal.className = 'fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6';
    modal.innerHTML = `
        <div class="bg-gray-900/90 border border-indigo-500/30 rounded-2xl p-8 max-w-md w-full">
            <div class="text-center mb-6">
                <div class="text-5xl mb-3">🌍</div>
                <h1 class="text-2xl font-bold text-white">AGE OF HISTORY</h1>
                <p class="text-gray-400 text-sm">Đăng nhập để tham gia</p>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="text-gray-300 text-sm font-bold block mb-1">👤 Tên của bạn</label>
                    <input id="login-name" type="text" 
                        placeholder="Nhập tên..." 
                        class="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                        maxlength="20"
                        value="${localStorage.getItem('aoh_player_name') || ''}">
                </div>
                
                <button id="btn-login" 
                    class="w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition active:scale-95">
                    🚀 Vào phòng chờ
                </button>
                
                <p class="text-gray-500 text-[10px] text-center">Tên sẽ được lưu trên Firebase để đồng bộ</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Tự động focus
    document.getElementById('login-name').focus();
    
    // Enter để đăng nhập
    document.getElementById('login-name').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    document.getElementById('btn-login').addEventListener('click', handleLogin);
}

// === XỬ LÝ ĐĂNG NHẬP ===
function handleLogin() {
    const nameInput = document.getElementById('login-name');
    const name = nameInput.value.trim();
    
    if (!name || name.length < 2) {
        showToast('❌ Tên phải có ít nhất 2 ký tự!', 'error');
        nameInput.focus();
        return;
    }
    
    if (name.length > 20) {
        showToast('❌ Tên quá dài! Tối đa 20 ký tự', 'error');
        nameInput.focus();
        return;
    }
    
    // Lưu tên
    currentPlayer = name;
    localStorage.setItem('aoh_player_name', name);
    
    // Xóa modal đăng nhập
    document.getElementById('login-modal')?.remove();
    
    // Vào lobby
    showLobby();
}
