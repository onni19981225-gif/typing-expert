import { dictionary, dict } from './words.js';
import * as UI from './uiController.js';

let gameState = { 
    mode: '', subMode: '', currentDifficulty: '', currentList: [], currentIndex: 0, score: 0, 
    timeLeft: 0, timer: null, repeatCount: 1, targetChar: '', active: false,
    customData: {}, tempDictionary: {}, testMode: false, examMode: false,
    examErrors: [], activeListName: ""
};

const kbRows = [["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],["A", "S", "D", "F", "G", "H", "J", "K", "L"],["Z", "X", "C", "V", "B", "N", "M"]];
const fingerMap = {"Q": "l4", "A": "l4", "Z": "l4","W": "l3", "S": "l3", "X": "l3","E": "l2", "D": "l2", "C": "l2","R": "l1", "F": "l1", "V": "l1", "T": "l1", "G": "l1", "B": "l1","Y": "r1", "H": "r1", "N": "r1", "U": "r1", "J": "r1", "M": "r1","I": "r2", "K": "r2","O": "r3", "L": "r3","P": "r4"};
let lastChar = '';
let isCoolingDown = false;

// 初始化
if(localStorage.getItem('user_custom_lists')) {
    gameState.customData = JSON.parse(localStorage.getItem('user_custom_lists'));
}

// 事件綁定
document.getElementById('menuBtn').onclick = UI.toggleSidebar;
document.getElementById('beginnerBtn').onclick = prepareBeginnerMode;
document.getElementById('easyBtn').onclick = () => openRandomModal('easy');
document.getElementById('normalBtn').onclick = () => openRandomModal('normal');
document.getElementById('hardBtn').onclick = () => openRandomModal('hard');
document.getElementById('customModalBtn').onclick = showCustomModal;
document.getElementById('actualStartBtn').onclick = actualStartGame;
document.getElementById('confirmRandomBtn').onclick = confirmRandomChallenge;
document.getElementById('hideRandomBtn').onclick = () => UI.hideModal('random-modal');
document.getElementById('addRowBtn').onclick = addNewWordRow;
document.getElementById('saveListBtn').onclick = saveCustomList;
document.getElementById('hideCustomBtn').onclick = () => UI.hideModal('custom-modal');
document.getElementById('closeModeSelectBtn').onclick = () => UI.hideModal('mode-select-modal');
document.getElementById('customPracticeBtn').onclick = () => launchCustomMode('practice');
document.getElementById('customTestBtn').onclick = () => launchCustomMode('test');
document.getElementById('customExamBtn').onclick = () => launchCustomMode('exam');
document.getElementById('retryBtn').onclick = actualStartGame;
document.getElementById('re-test-errors-btn').onclick = startErrorReTest;
document.getElementById('speakBtn').onclick = speakCurrent;

function speak(text) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.8; window.speechSynthesis.speak(u); }
function speakCurrent() { if(gameState.currentList[gameState.currentIndex]) speak(gameState.currentList[gameState.currentIndex]); }

function playErrorSound() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); osc.frequency.setValueAtTime(100, ctx.currentTime);
    const g = ctx.createGain(); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
}

function triggerKeyboardShake() {
    if (isCoolingDown) return;
    isCoolingDown = true;
    playErrorSound();
    const kbArea = document.getElementById('keyboard-area');
    kbArea.classList.remove('shake-kb');
    void kbArea.offsetWidth; 
    kbArea.classList.add('shake-kb');
    setTimeout(() => { kbArea.classList.remove('shake-kb'); isCoolingDown = false; }, 370);
}

function prepareBeginnerMode() {
    UI.toggleSidebar(); UI.clearUI(gameState);
    gameState.mode = 'beginner'; gameState.timeLeft = 60; 
    document.getElementById('pre-title').innerText = "⌨️ 找字母挑戰";
    document.getElementById('pre-desc').innerText = "練習正確指法，亮紅色的按鍵要放大按下去喔！";
    document.getElementById('pre-game-start').style.display = 'block';
    lastChar = '';
}

function initKeyboard() {
    const kb = document.getElementById('virtual-keyboard'); kb.innerHTML = '';
    kbRows.forEach(row => {
        const rowDiv = document.createElement('div'); rowDiv.className = 'kb-row';
        row.forEach(key => {
            const kDiv = document.createElement('div'); kDiv.className = 'key' + (key === 'F' ? ' f-key' : '') + (key === 'J' ? ' j-key' : '');
            kDiv.id = `key-${key}`; kDiv.innerText = key; 
            const finger = fingerMap[key];
            if(finger) kDiv.style.backgroundColor = `var(--finger-${finger})`;
            rowDiv.appendChild(kDiv);
        });
        kb.appendChild(rowDiv);
    });
}

function nextChar() {
    document.querySelectorAll('.key').forEach(k => k.classList.remove('highlight'));
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let newChar;
    do { newChar = chars[Math.floor(Math.random()*26)]; } while (newChar === lastChar); 
    lastChar = newChar; gameState.targetChar = newChar;
    document.getElementById('kb-target').innerText = gameState.targetChar;
    const targetEl = document.getElementById(`key-${gameState.targetChar}`);
    if(targetEl) targetEl.classList.add('highlight');
}

function addNewWordRow() {
    const container = document.getElementById('custom-rows-container');
    const row = document.createElement('div'); row.className = 'word-row';
    row.innerHTML = `<input type="text" class="eng-in" placeholder="英文"> <input type="text" class="chi-in" placeholder="中文"> <button class="row-del-btn" style="border:none; background:none; cursor:pointer; color:#999;">❌</button>`;
    row.querySelector('.row-del-btn').onclick = () => row.remove();
    container.appendChild(row);
}

function saveCustomList() {
    const name = document.getElementById('new-list-name').value.trim();
    if(!name) return alert("請輸入清單名稱！");
    const rows = document.querySelectorAll('.word-row');
    let data = [];
    rows.forEach(r => {
        const eng = r.querySelector('.eng-in').value.trim();
        const chi = r.querySelector('.chi-in').value.trim();
        if(eng && chi) data.push({ eng, chi });
    });
    if(data.length === 0) return alert("請輸入至少一組單字！");
    gameState.customData[name] = data;
    localStorage.setItem('user_custom_lists', JSON.stringify(gameState.customData));
    document.getElementById('new-list-name').value = "";
    document.getElementById('custom-rows-container').innerHTML = `<div class="word-row"><input type="text" class="eng-in" placeholder="英文"> <input type="text" class="chi-in" placeholder="中文"> <button class="row-del-btn" style="border:none; background:none; cursor:pointer; color:#999;">❌</button></div>`;
    renderSavedLists(); alert("清單已儲存！");
}

function renderSavedLists() {
    const display = document.getElementById('saved-lists-display'); display.innerHTML = "";
    for(let name in gameState.customData) {
        const item = document.createElement('div'); item.className = 'list-item';
        item.innerHTML = `<span>📂 ${name}</span> <button class="delete-btn">🗑️</button>`;
        item.querySelector('.delete-btn').onclick = (e) => {
            e.stopPropagation();
            if(confirm(`確定要刪除「${name}」嗎？`)) {
                delete gameState.customData[name];
                localStorage.setItem('user_custom_lists', JSON.stringify(gameState.customData));
                renderSavedLists();
            }
        };
        item.onclick = () => openModeSelect(name);
        display.appendChild(item);
    }
}

function openRandomModal(diff) { 
    gameState.currentDifficulty = diff; 
    const titleMap = { easy: "🌱 簡單模式", normal: "🌿 基礎模式", hard: "🌳 困難模式" };
    document.getElementById('random-title').innerText = titleMap[diff]; 
    UI.showModal('random-modal');
}

function showCustomModal() { renderSavedLists(); UI.showModal('custom-modal'); }

function openModeSelect(name) {
    gameState.activeListName = name;
    document.getElementById('selected-list-title').innerText = name;
    UI.showModal('mode-select-modal');
}

function launchCustomMode(type) {
    const repeat = parseInt(document.getElementById('custom-repeat-count').value) || 1;
    const data = gameState.customData[gameState.activeListName];
    gameState.testMode = (type === 'test' || type === 'exam');
    gameState.examMode = (type === 'exam');
    gameState.repeatCount = repeat; gameState.currentList = []; gameState.tempDictionary = {}; gameState.examErrors = [];
    data.forEach(item => {
        gameState.tempDictionary[item.eng] = item.chi;
        for(let i=0; i<repeat; i++) gameState.currentList.push(item.eng);
    });
    UI.hideModal('mode-select-modal'); UI.hideModal('custom-modal'); UI.toggleSidebar(); UI.clearUI(gameState);
    gameState.mode = 'word'; gameState.subMode = 'custom';
    const titles = { practice: "📖 基礎練習", test: "📝 拼字練習", exam: "🎓 考試模式" };
    document.getElementById('pre-title').innerText = titles[type];
    document.getElementById('pre-desc').innerText = `清單：${gameState.activeListName}，共 ${gameState.currentList.length} 個單字。`;
    document.getElementById('pre-game-start').style.display = 'block';
}

function startErrorReTest() {
    const errorWords = [...new Set(gameState.examErrors)];
    gameState.currentList = errorWords;
    UI.clearUI(gameState);
    gameState.mode = 'word'; gameState.subMode = 'custom'; gameState.testMode = true; gameState.examMode = true; gameState.examErrors = [];
    document.getElementById('pre-title').innerText = "🎓 錯題加強測驗";
    document.getElementById('pre-desc').innerText = `針對打錯的 ${errorWords.length} 個單字練習。`;
    document.getElementById('pre-game-start').style.display = 'block';
}

function actualStartGame() {
    UI.hideModal('pre-game-start'); UI.hideModal('result-layer'); UI.updateTimerDisplay(gameState.timeLeft);
    gameState.active = true; gameState.score = 0; gameState.currentIndex = 0;
    if (gameState.mode === 'beginner') {
        document.getElementById('keyboard-area').style.display = 'block';
        document.getElementById('timer-display').style.display = 'block';
        document.getElementById('counter-display').style.display = 'block';
        document.getElementById('counter-display').innerText = "得分：0";
        initKeyboard(); nextChar(); startTimer();
    } else {
        document.getElementById('word-area').style.display = 'block';
        document.getElementById('input-box').value = "";
        if(gameState.subMode === 'random') {
            document.getElementById('timer-display').style.display = 'block';
            document.getElementById('counter-display').style.display = 'block';
            document.getElementById('counter-display').innerText = "正確：0";
            gameState.currentList = [...dict[gameState.currentDifficulty]].sort(()=>Math.random()-0.5);
            startTimer();
        } else {
            document.getElementById('total-progress-container').style.display = 'block';
            document.getElementById('progress-text').style.display = 'block';
        }
        renderWord(); speakCurrent();
        setTimeout(() => document.getElementById('input-box').focus(), 300);
    }
}

function startTimer() {
    if(gameState.timer) clearInterval(gameState.timer);
    gameState.timer = setInterval(() => {
        gameState.timeLeft--; UI.updateTimerDisplay(gameState.timeLeft);
        if (gameState.timeLeft <= 0) endGame();
    }, 1000);
}

function renderWord() {
    const word = gameState.currentList[gameState.currentIndex] || "";
    const userIn = document.getElementById('input-box').value;
    let html = "";
    for (let i = 0; i < word.length; i++) {
        const char = word[i]; const userInputChar = userIn[i];
        if (char === ' ') html += `<div class="char-box space">&nbsp;</div>`;
        else {
            let content = "", className = "";
            if (userInputChar !== undefined) {
                content = userInputChar;
                if (!gameState.examMode) className = (userInputChar === char) ? "char-correct" : "char-wrong";
            } else { content = gameState.testMode ? "&nbsp;" : char; }
            html += `<div class="char-box"><span class="${className}">${content}</span></div>`;
        }
    }
    document.getElementById('word-display').innerHTML = html;
    const trans = gameState.tempDictionary[word] || dictionary[word] || dictionary[word.toLowerCase()] || "(自定義)";
    document.getElementById('translation-display').innerText = trans;
    if (gameState.subMode === 'custom') {
        const total = gameState.currentList.length;
        document.getElementById('total-progress-bar').style.width = (gameState.currentIndex / total * 100) + "%";
        document.getElementById('progress-text').innerText = `進度：${gameState.currentIndex + 1} / ${total}`;
    }
}

const inputObj = document.getElementById('input-box');
inputObj.addEventListener('input', () => {
    if (gameState.mode !== 'word' || !gameState.active) return;
    const validValue = inputObj.value.replace(/[^a-zA-Z0-9\s\-\'\.\,]/g, '');
    if (inputObj.value !== validValue) inputObj.value = validValue;
    renderWord();
});

inputObj.addEventListener('keydown', (e) => {
    if (gameState.mode !== 'word' || !gameState.active || gameState.examMode) return;
    const word = gameState.currentList[gameState.currentIndex] || "";
    const currentIn = inputObj.value;
    if (e.key === 'Backspace' || e.key === 'Enter') return;
    if (e.key.length === 1) {
        if (/^[a-zA-Z0-9\s\-\'\.\,]$/.test(e.key)) {
            const targetChar = word[currentIn.length];
            if (!targetChar || e.key !== targetChar) {
                e.preventDefault(); 
                const wordDisp = document.getElementById('word-display');
                wordDisp.classList.remove('shake-error'); void wordDisp.offsetWidth; wordDisp.classList.add('shake-error');
                playErrorSound(); updateErrorVisual(currentIn.length);
            }
        } else e.preventDefault();
    }
});

function updateErrorVisual(errorIndex) {
    const word = gameState.currentList[gameState.currentIndex] || "";
    const userIn = document.getElementById('input-box').value;
    let html = "";
    for (let i = 0; i < word.length; i++) {
        const char = word[i]; const userInputChar = userIn[i];
        if (char === ' ') html += `<div class="char-box space">&nbsp;</div>`;
        else {
            let content = "", className = "";
            if (i === errorIndex) { content = char; className = "char-wrong"; }
            else if (userInputChar !== undefined) { content = userInputChar; className = (userInputChar === char) ? "char-correct" : "char-wrong"; }
            else { content = gameState.testMode ? "&nbsp;" : char; }
            html += `<div class="char-box"><span class="${className}">${content}</span></div>`;
        }
    }
    document.getElementById('word-display').innerHTML = html;
}

inputObj.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && gameState.mode === 'word' && gameState.active) {
        const target = gameState.currentList[gameState.currentIndex];
        const userVal = inputObj.value.trim();
        if(gameState.examMode) {
            if(userVal === target) gameState.score++;
            else gameState.examErrors.push(gameState.currentList[gameState.currentIndex]);
            nextItem();
        } else {
            if (userVal === target) { gameState.score++; nextItem(); }
            else {
                const wordDisp = document.getElementById('word-display');
                wordDisp.classList.remove('shake-error'); void wordDisp.offsetWidth; wordDisp.classList.add('shake-error');
                playErrorSound();
            }
        }
    }
});

function nextItem() {
    document.getElementById('word-display').classList.remove('shake-error');
    gameState.currentIndex++; inputObj.value = "";
    if (gameState.subMode === 'random') {
        if (gameState.currentIndex >= gameState.currentList.length) { 
            gameState.currentList = [...dict[gameState.currentDifficulty]].sort(()=>Math.random()-0.5); 
            gameState.currentIndex = 0; 
        }
        document.getElementById('counter-display').innerText = `正確：${gameState.score}`;
        renderWord(); speakCurrent();
    } else {
        if (gameState.currentIndex < gameState.currentList.length) { renderWord(); speakCurrent(); }
        else endGame();
    }
}

window.addEventListener('keydown', (e) => {
    if (!gameState.active || gameState.mode !== 'beginner' || e.target.tagName === 'INPUT') return;
    if (isCoolingDown) return;
    if (e.key.toUpperCase() === gameState.targetChar) {
        gameState.score++; document.getElementById('counter-display').innerText = `得分：${gameState.score}`;
        nextChar();
    } else if (!['SHIFT','CONTROL','ALT','CAPSLOCK','TAB','META','ENTER'].includes(e.key.toUpperCase())) {
        triggerKeyboardShake();
    }
});

function endGame() {
    gameState.active = false; if(gameState.timer) clearInterval(gameState.timer);
    const detail = document.getElementById('result-detail');
    const layer = document.getElementById('result-layer');
    const examBox = document.getElementById('exam-results-box');
    const reTestBtn = document.getElementById('re-test-errors-btn');
    examBox.style.display = 'none'; reTestBtn.style.display = 'none';

    if (gameState.mode === 'beginner') detail.innerHTML = `抓到字母：<span style="color:var(--primary); font-size:2.5rem;">${gameState.score}</span> 個`;
    else if (gameState.subMode === 'random') detail.innerHTML = `完成單字：${gameState.score} 個`;
    else {
        if (gameState.examMode) {
            detail.innerHTML = `🎓 考試模式結束！<br>答對率：${Math.round(gameState.score / gameState.currentList.length * 100)}% (${gameState.score}/${gameState.currentList.length})`;
            if(gameState.examErrors.length > 0) {
                examBox.style.display = 'block'; reTestBtn.style.display = 'block';
                let errorHtml = `<h4 style="margin:0 0 10px 0; color:var(--wrong);">❌ 需要加強的單字：</h4>`;
                gameState.examErrors.forEach(eng => {
                    const chi = gameState.tempDictionary[eng] || dictionary[eng] || dictionary[eng.toLowerCase()] || "";
                    errorHtml += `<div class="error-item"><span class="error-eng">${eng}</span><span class="error-chi">${chi}</span></div>`;
                });
                examBox.innerHTML = errorHtml;
            } else detail.innerHTML += `<br><span style="color:var(--correct);">太棒了！全對！滿分！💯</span>`;
        } else detail.innerHTML = `🎉 恭喜完成這份清單！<br><span style="color:var(--correct);">表現得非常出色喔！</span>`;
    }
    layer.style.display = 'flex';
}

function confirmRandomChallenge() {
    const mins = parseInt(document.getElementById('random-minutes').value) || 1;
    UI.hideModal('random-modal'); UI.toggleSidebar(); UI.clearUI(gameState);
    gameState.mode = 'word'; gameState.subMode = 'random'; gameState.timeLeft = mins * 60;
    const titleMap = { easy: "🌱 簡單模式", normal: "🌿 基礎模式", hard: "🌳 困難模式" };
    document.getElementById('pre-title').innerText = titleMap[gameState.currentDifficulty];
    document.getElementById('pre-desc').innerText = `設定：${mins} 分鐘，準備好了嗎？`;
    document.getElementById('pre-game-start').style.display = 'block';
}
