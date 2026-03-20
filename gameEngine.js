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

// 初始載入
const savedData = localStorage.getItem('user_custom_lists');
if(savedData) gameState.customData = JSON.parse(savedData);

// 介面綁定 (模組化寫法：改為監聽器以確保穩定)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('beginnerBtn').addEventListener('click', prepareBeginnerMode);
    document.getElementById('easyBtn').addEventListener('click', () => openRandomModal('easy'));
    document.getElementById('normalBtn').addEventListener('click', () => openRandomModal('normal'));
    document.getElementById('hardBtn').addEventListener('click', () => openRandomModal('hard'));
    document.getElementById('customModalBtn').addEventListener('click', showCustomModal);
    document.getElementById('actualStartBtn').addEventListener('click', actualStartGame);
    document.getElementById('confirmRandomBtn').addEventListener('click', confirmRandomChallenge);
    document.getElementById('hideRandomBtn').addEventListener('click', () => UI.hideModal('random-modal'));
    document.getElementById('addRowBtn').addEventListener('click', addNewWordRow);
    document.getElementById('saveListBtn').addEventListener('click', saveCustomList);
    document.getElementById('hideCustomBtn').addEventListener('click', () => UI.hideModal('custom-modal'));
    document.getElementById('closeModeSelectBtn').addEventListener('click', () => UI.hideModal('mode-select-modal'));
    document.getElementById('customPracticeBtn').addEventListener('click', () => launchCustomMode('practice'));
    document.getElementById('customTestBtn').addEventListener('click', () => launchCustomMode('test'));
    document.getElementById('customExamBtn').addEventListener('click', () => launchCustomMode('exam'));
    document.getElementById('retryBtn').addEventListener('click', actualStartGame);
    document.getElementById('re-test-errors-btn').addEventListener('click', startErrorReTest);
    document.getElementById('speakBtn').addEventListener('click', speakCurrent);
    document.getElementById('input-box').addEventListener('input', handleInput);
    document.getElementById('input-box').addEventListener('keydown', handleKeydown);
    document.getElementById('input-box').addEventListener('keypress', handleEnter);
    window.addEventListener('keydown', handleGlobalKeydown);
});

// 輔助函式
function speak(text) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.8; window.speechSynthesis.speak(u); }
function speakCurrent() { if(gameState.currentList[gameState.currentIndex]) speak(gameState.currentList[gameState.currentIndex]); }
function playErrorSound() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); osc.frequency.setValueAtTime(100, ctx.currentTime);
    const g = ctx.createGain(); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
}

// 邏輯實作
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
            const kDiv = document.createElement('div'); 
            kDiv.className = 'key' + (key === 'F' ? ' f-key' : '') + (key === 'J' ? ' j-key' : '');
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
    let newChar; do { newChar = chars[Math.floor(Math.random()*26)]; } while (newChar === lastChar); 
    lastChar = newChar; gameState.targetChar = newChar;
    document.getElementById('kb-target').innerText = gameState.targetChar;
    const targetEl = document.getElementById(`key-${gameState.targetChar}`);
    if(targetEl) targetEl.classList.add('highlight');
}

function addNewWordRow() {
    const container = document.getElementById('custom-rows-container');
    const row = document.createElement('div'); row.className = 'word-row';
    row.innerHTML = `<input type="text" class="eng-in" placeholder="英文"> <input type="text" class="chi-in" placeholder="中文"> <button class="row-del" style="border:none; background:none; cursor:pointer; color:#999;">❌</button>`;
    row.querySelector('.row-del').onclick = () => row.remove();
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
    document.getElementById('custom-rows-container').innerHTML = `<div class="word-row"><input type="text" class="eng-in" placeholder="英文"><input type="text" class="chi-in" placeholder="中文"></div>`;
    renderSavedLists(); alert("清單已儲存！");
}

function renderSavedLists() {
    const display = document.getElementById('saved-lists-display'); display.innerHTML = "";
    for(let name in gameState.customData) {
        const item = document.createElement('div'); item.className = 'list-item';
        item.innerHTML = `<span>📂 ${name}</span> <button class="del-list" style="color:#e74c3c;border:none;background:none;font-size:1.2rem;cursor:pointer;">🗑️</button>`;
        item.onclick = () => openModeSelect(name);
        item.querySelector('.del-list').onclick = (e) => {
            e.stopPropagation(); if(confirm(`確定刪除「${name}」？`)) { delete gameState.customData[name]; localStorage.setItem('user_custom_lists', JSON.stringify(gameState.customData)); renderSavedLists(); }
        };
        display.appendChild(item);
    }
}

function openRandomModal(diff) { gameState.currentDifficulty = diff; document.getElementById('random-title').innerText = diff.toUpperCase() + " 挑戰模式"; UI.showModal('random-modal'); }
function showCustomModal() { renderSavedLists(); UI.showModal('custom-modal'); }
function openModeSelect(name) { gameState.activeListName = name; document.getElementById('selected-list-title').innerText = name; UI.showModal('mode-select-modal'); }

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
    document.getElementById('pre-title').innerText = type.toUpperCase() + " 模式";
    document.getElementById('pre-game-start').style.display = 'block';
}

function actualStartGame() {
    UI.hideModal('pre-game-start'); UI.hideModal('result-layer');
    gameState.active = true; gameState.score = 0; gameState.currentIndex = 0;
    if (gameState.mode === 'beginner') {
        document.getElementById('keyboard-area').style.display = 'block'; document.getElementById('timer-display').style.display = 'block';
        document.getElementById('counter-display').style.display = 'block'; initKeyboard(); nextChar(); startTimer();
    } else {
        document.getElementById('word-area').style.display = 'block';
        if(gameState.subMode === 'random') {
            document.getElementById('timer-display').style.display = 'block'; document.getElementById('counter-display').style.display = 'block';
            gameState.currentList = [...dict[gameState.currentDifficulty]].sort(()=>Math.random()-0.5); startTimer();
        } else { document.getElementById('total-progress-container').style.display = 'block'; document.getElementById('progress-text').style.display = 'block'; }
        renderWord(); speakCurrent();
        setTimeout(() => document.getElementById('input-box').focus(), 300);
    }
}

function startTimer() {
    if(gameState.timer) clearInterval(gameState.timer);
    gameState.timer = setInterval(() => { gameState.timeLeft--; UI.updateTimerDisplay(gameState.timeLeft); if (gameState.timeLeft <= 0) endGame(); }, 1000);
}

function renderWord() {
    const word = gameState.currentList[gameState.currentIndex] || "";
    const userIn = document.getElementById('input-box').value;
    let html = "";
    for (let i = 0; i < word.length; i++) {
        const char = word[i]; const userInputChar = userIn[i];
        if (char === ' ') html += `<div class="char-box space">&nbsp;</div>`;
        else {
            let content = userInputChar !== undefined ? userInputChar : (gameState.testMode ? "&nbsp;" : char);
            let className = userInputChar !== undefined ? (gameState.examMode ? "" : (userInputChar === char ? "char-correct" : "char-wrong")) : "";
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

function handleInput() { if (gameState.mode === 'word' && gameState.active) { document.getElementById('input-box').value = document.getElementById('input-box').value.replace(/[^a-zA-Z0-9\s\-\'\.\,]/g, ''); renderWord(); } }

function handleKeydown(e) {
    if (gameState.mode !== 'word' || !gameState.active || gameState.examMode || e.key === 'Backspace' || e.key === 'Enter') return;
    const word = gameState.currentList[gameState.currentIndex] || "";
    const currentIn = document.getElementById('input-box').value;
    if (e.key.length === 1) {
        if (/^[a-zA-Z0-9\s\-\'\.\,]$/.test(e.key)) {
            if (e.key !== word[currentIn.length]) {
                e.preventDefault(); playErrorSound(); 
                document.getElementById('word-display').classList.add('shake-error');
                setTimeout(() => document.getElementById('word-display').classList.remove('shake-error'), 300);
            }
        } else e.preventDefault();
    }
}

function handleEnter(e) {
    if (e.key === 'Enter' && gameState.active) {
        const target = gameState.currentList[gameState.currentIndex];
        const val = document.getElementById('input-box').value.trim();
        if(gameState.examMode) { if(val === target) gameState.score++; else gameState.examErrors.push(target); nextItem(); }
        else if (val === target) { gameState.score++; nextItem(); }
        else { playErrorSound(); document.getElementById('word-display').classList.add('shake-error'); setTimeout(() => document.getElementById('word-display').classList.remove('shake-error'), 300); }
    }
}

function nextItem() { gameState.currentIndex++; document.getElementById('input-box').value = ""; if (gameState.currentIndex < gameState.currentList.length) { renderWord(); speakCurrent(); } else endGame(); }

function handleGlobalKeydown(e) {
    if (gameState.mode !== 'beginner' || !gameState.active || e.target.tagName === 'INPUT') return;
    if (e.key.toUpperCase() === gameState.targetChar) { gameState.score++; document.getElementById('counter-display').innerText = `得分：${gameState.score}`; nextChar(); }
    else if (!['SHIFT','CONTROL','ALT','CAPSLOCK','TAB','META','ENTER'].includes(e.key.toUpperCase())) {
        playErrorSound(); document.getElementById('keyboard-area').classList.add('shake-kb');
        setTimeout(() => document.getElementById('keyboard-area').classList.remove('shake-kb'), 300);
    }
}

function endGame() {
    gameState.active = false; if(gameState.timer) clearInterval(gameState.timer); UI.showModal('result-layer');
    const detail = document.getElementById('result-detail');
    if (gameState.mode === 'beginner') detail.innerHTML = `抓到字母：${gameState.score} 個`;
    else detail.innerHTML = `完成單字：${gameState.score} / ${gameState.currentList.length}`;
}

function confirmRandomChallenge() {
    const mins = parseInt(document.getElementById('random-minutes').value) || 1; UI.hideModal('random-modal');
    UI.toggleSidebar(); UI.clearUI(gameState); gameState.mode = 'word'; gameState.subMode = 'random'; gameState.timeLeft = mins * 60;
    actualStartGame();
}

function startErrorReTest() {
    gameState.currentList = [...new Set(gameState.examErrors)]; UI.clearUI(gameState);
    gameState.mode = 'word'; gameState.subMode = 'custom'; gameState.testMode = true; gameState.examMode = true; gameState.examErrors = [];
    document.getElementById('pre-game-start').style.display = 'block';
}
