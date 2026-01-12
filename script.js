// ========================================
// グローバル変数とゲームデータ
// ========================================

let gameData = {
    player: {
        level: 1,
        exp: 0,
        coins: 0
    },
    studyLogs: [],
    inventory: []
};

// タイマー関連
let timerInterval = null;
let elapsedSeconds = 0;
let currentSubject = "数学";

// レベルテーブル（レベルアップに必要な累積EXP）
const LEVEL_TABLE = {
    1: 0,
    2: 100,
    3: 250,
    4: 450,
    5: 700,
    6: 1000,
    7: 1350,
    8: 1750,
    9: 2200,
    10: 2700
};

// ガチャアイテムデータ
const GACHA_ITEMS = [
    // ★1 (60%) - 6種類
    { id: 1, name: "木の剣", icon: "🗡️", rarity: 1 },
    { id: 2, name: "布の服", icon: "👕", rarity: 1 },
    { id: 3, name: "革の靴", icon: "👞", rarity: 1 },
    { id: 4, name: "小さな盾", icon: "🛡️", rarity: 1 },
    { id: 5, name: "ポーション", icon: "🧪", rarity: 1 },
    { id: 6, name: "パン", icon: "🍞", rarity: 1 },
    // ★2 (30%) - 4種類
    { id: 7, name: "鋼の剣", icon: "⚔️", rarity: 2 },
    { id: 8, name: "鎖の鎧", icon: "🦺", rarity: 2 },
    { id: 9, name: "魔法の杖", icon: "🪄", rarity: 2 },
    { id: 10, name: "魔法の本", icon: "📖", rarity: 2 },
    // ★3 (10%) - 2種類
    { id: 11, name: "伝説の剣", icon: "⚡", rarity: 3 },
    { id: 12, name: "ドラゴンの盾", icon: "🐉", rarity: 3 }
];

// ========================================
// 初期化とデータ読み込み
// ========================================

function initGame() {
    loadGameData();
    updateHomeScreen();
    calculateTodayStats();
    console.log("Game initialized!");
}

function loadGameData() {
    const savedData = localStorage.getItem('studyQuestData');
    if (savedData) {
        gameData = JSON.parse(savedData);
        console.log("Game data loaded:", gameData);
    } else {
        console.log("No saved data, using default");
    }
}

function saveGameData() {
    localStorage.setItem('studyQuestData', JSON.stringify(gameData));
    console.log("Game data saved");
}

// ========================================
// 画面切り替え
// ========================================

function showScreen(screenId) {
    // 全ての画面を非表示
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 指定された画面を表示
    document.getElementById(screenId).classList.add('active');
    
    // 画面ごとの初期化処理
    if (screenId === 'home-screen') {
        updateHomeScreen();
    } else if (screenId === 'gacha-screen') {
        updateGachaScreen();
    } else if (screenId === 'menu-screen') {
        updateInventoryScreen();
    } else if (screenId === 'log-screen') {
        updateLogScreen();
    } else if (screenId === 'study-screen') {
        calculateTodayStats();
    }
}

// ========================================
// ホーム画面の更新
// ========================================

function updateHomeScreen() {
    const player = gameData.player;
    
    // レベル表示
    document.getElementById('player-level').textContent = player.level;
    
    // EXP表示
    const currentLevelExp = LEVEL_TABLE[player.level] || 0;
    const nextLevelExp = LEVEL_TABLE[player.level + 1] || currentLevelExp;
    const expInLevel = player.exp - currentLevelExp;
    const expNeeded = nextLevelExp - currentLevelExp;
    
    document.getElementById('current-exp').textContent = expInLevel;
    document.getElementById('max-exp').textContent = expNeeded;
    
    // EXPバーの幅
    const expPercentage = (expInLevel / expNeeded) * 100;
    document.getElementById('exp-bar').style.width = expPercentage + '%';
    
    // コイン表示
    document.getElementById('coin-count').textContent = player.coins;
}

// ========================================
// 勉強タイマー機能
// ========================================

function selectSubject(button) {
    // 全ての科目ボタンからactiveクラスを削除
    document.querySelectorAll('.subject-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // クリックされたボタンにactiveクラスを追加
    button.classList.add('active');
    currentSubject = button.dataset.subject;
}

function startTimer() {
    if (timerInterval) return; // 既に動いている場合は何もしない
    
    document.getElementById('start-button').classList.add('hidden');
    document.getElementById('stop-button').classList.remove('hidden');
    
    timerInterval = setInterval(() => {
        elapsedSeconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (!timerInterval) return;
    
    clearInterval(timerInterval);
    timerInterval = null;
    
    document.getElementById('start-button').classList.remove('hidden');
    document.getElementById('stop-button').classList.add('hidden');
    
    // 勉強記録を保存（1秒以上経過している場合のみ）
    if (elapsedSeconds > 0) {
        saveStudySession();
    }
    
    // タイマーリセット
    elapsedSeconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    
    const display = 
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');
    
    document.getElementById('timer-display').textContent = display;
}

function saveStudySession() {
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes === 0) return; // 1分未満は記録しない
    
    const earnedExp = minutes * 10;
    const earnedCoins = minutes * 5;
    
    // 勉強ログに追加
    const log = {
        date: new Date().toISOString(),
        subject: currentSubject,
        minutes: minutes,
        exp: earnedExp,
        coins: earnedCoins
    };
    gameData.studyLogs.push(log);
    
    // プレイヤーデータ更新
    const oldLevel = gameData.player.level;
    gameData.player.exp += earnedExp;
    gameData.player.coins += earnedCoins;
    
    // レベルアップチェック
    checkLevelUp(oldLevel);
    
    // データ保存
    saveGameData();
    
    // 画面更新
    updateHomeScreen();
    calculateTodayStats();
    
    // 確認メッセージ
    alert(`勉強お疲れ様！\n${minutes}分勉強しました\n\n+${earnedExp} EXP\n+${earnedCoins} コイン`);
}

function checkLevelUp(oldLevel) {
    let newLevel = oldLevel;
    
    // レベルアップ判定
    for (let level = oldLevel + 1; level <= 10; level++) {
        if (gameData.player.exp >= LEVEL_TABLE[level]) {
            newLevel = level;
        } else {
            break;
        }
    }
    
    if (newLevel > oldLevel) {
        gameData.player.level = newLevel;
        showLevelUpModal(oldLevel, newLevel);
    }
}

function showLevelUpModal(oldLevel, newLevel) {
    document.getElementById('old-level').textContent = oldLevel;
    document.getElementById('new-level').textContent = newLevel;
    document.getElementById('levelup-modal').classList.remove('hidden');
}

function closeLevelUpModal() {
    document.getElementById('levelup-modal').classList.add('hidden');
}

function calculateTodayStats() {
    const today = new Date().toDateString();
    let todayMinutes = 0;
    
    gameData.studyLogs.forEach(log => {
        const logDate = new Date(log.date).toDateString();
        if (logDate === today) {
            todayMinutes += log.minutes;
        }
    });
    
    document.getElementById('today-time').textContent = todayMinutes;
}

// ========================================
// ガチャ機能
// ========================================

function updateGachaScreen() {
    document.getElementById('gacha-coin-count').textContent = gameData.player.coins;
}

function pullGacha() {
    if (gameData.player.coins < 100) {
        alert('コインが足りません！\n勉強してコインを集めましょう');
        return;
    }
    
    // コイン消費
    gameData.player.coins -= 100;
    
    // ガチャ抽選
    const item = drawGachaItem();
    
    // インベントリに追加
    addItemToInventory(item);
    
    // データ保存
    saveGameData();
    
    // 結果表示
    showGachaResult(item);
    
    // コイン表示更新
    updateGachaScreen();
    updateHomeScreen();
}

function drawGachaItem() {
    const rand = Math.random() * 100;
    let rarity;
    
    if (rand < 60) {
        rarity = 1; // ★1 (60%)
    } else if (rand < 90) {
        rarity = 2; // ★2 (30%)
    } else {
        rarity = 3; // ★3 (10%)
    }
    
    // 指定レアリティのアイテムからランダム選択
    const itemsOfRarity = GACHA_ITEMS.filter(item => item.rarity === rarity);
    const randomItem = itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
    
    return randomItem;
}

function addItemToInventory(item) {
    const existing = gameData.inventory.find(inv => inv.id === item.id);
    
    if (existing) {
        existing.count++;
    } else {
        gameData.inventory.push({
            id: item.id,
            name: item.name,
            icon: item.icon,
            rarity: item.rarity,
            count: 1
        });
    }
}

function showGachaResult(item) {
    document.getElementById('result-icon').textContent = item.icon;
    document.getElementById('result-name').textContent = item.name;
    document.getElementById('result-rarity').textContent = '★'.repeat(item.rarity);
    document.getElementById('gacha-result').classList.remove('hidden');
}

function closeGachaResult() {
    document.getElementById('gacha-result').classList.add('hidden');
}

// ========================================
// メニュー画面（インベントリ）
// ========================================

function updateInventoryScreen() {
    const container = document.getElementById('inventory-container');
    
    if (gameData.inventory.length === 0) {
        container.innerHTML = '<p class="empty-message">まだアイテムを持っていません</p>';
        return;
    }
    
    container.innerHTML = '';
    
    gameData.inventory.forEach(item => {
        const card = document.createElement('div');
        card.className = `item-card rarity-${item.rarity}`;
        card.innerHTML = `
            <div class="item-card-icon">${item.icon}</div>
            <div class="item-card-name">${item.name}</div>
            <div class="item-card-rarity">${'★'.repeat(item.rarity)}</div>
            <div class="item-card-count">×${item.count}</div>
        `;
        container.appendChild(card);
    });
}

function confirmReset() {
    const confirmed = confirm('本当にデータをリセットしますか？\nこの操作は取り消せません。');
    
    if (confirmed) {
        localStorage.removeItem('studyQuestData');
        gameData = {
            player: { level: 1, exp: 0, coins: 0 },
            studyLogs: [],
            inventory: []
        };
        saveGameData();
        showScreen('home-screen');
        alert('データをリセットしました');
    }
}

// ========================================
// ログ画面
// ========================================

function updateLogScreen() {
    // 統計情報の計算
    let totalMinutes = 0;
    let totalExp = 0;
    
    gameData.studyLogs.forEach(log => {
        totalMinutes += log.minutes;
        totalExp += log.exp;
    });
    
    document.getElementById('total-time').textContent = totalMinutes;
    document.getElementById('total-exp').textContent = totalExp;
    
    // ログリストの表示
    const container = document.getElementById('log-container');
    
    if (gameData.studyLogs.length === 0) {
        container.innerHTML = '<p class="empty-message">まだ勉強記録がありません</p>';
        return;
    }
    
    container.innerHTML = '';
    
    // 新しい順に表示
    const sortedLogs = [...gameData.studyLogs].reverse();
    
    sortedLogs.forEach(log => {
        const date = new Date(log.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        logItem.innerHTML = `
            <div class="log-header">
                <span class="log-date">${dateStr}</span>
                <span class="log-subject">${log.subject}</span>
            </div>
            <div class="log-details">
                <span class="log-time">${log.minutes}分</span>
                <span class="log-reward">+${log.exp} EXP / +${log.coins} コイン</span>
            </div>
        `;
        container.appendChild(logItem);
    });
}

// ========================================
// ページ読み込み時に初期化
// ========================================

window.addEventListener('DOMContentLoaded', initGame);
