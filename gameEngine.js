import { dictionary, dict } from './words.js';
import * as UI from './uiController.js';

export let state = {
    active: false, mode: '', subMode: '', currentList: [], currentIndex: 0, score: 0,
    testMode: false, examMode: false, tempDictionary: {}
};

export function init() {
    setupInputListeners();
    // 將啟動函式掛載到 window，解決 HTML 無法讀取 import 函式的問題
    window.startMode = startMode; 
}

function setupInputListeners() {
    const input = document.getElementById('input-box');
    input.addEventListener('input', () => {
        if(!state.active) return;
        input.value = input.value.replace(/[^a-zA-Z0-9\s\-\'\.\,]/g, '');
        render();
    });
    input.addEventListener('keypress', (e) => {
        if(e.key === 'Enter' && state.active) validate();
    });
}

export function startMode(diff) {
    UI.toggleSidebar();
    state.active = true;
    state.currentIndex = 0;
    state.score = 0;
    state.currentList = [...dict[diff]].sort(() => Math.random() - 0.5);
    document.getElementById('home-logo').style.display = 'none';
    document.getElementById('word-area').style.display = 'block';
    render();
    document.getElementById('input-box').focus();
}

function render() {
    const word = state.currentList[state.currentIndex] || "";
    const userIn = document.getElementById('input-box').value;
    let html = "";
    for(let i=0; i<word.length; i++) {
        let className = userIn[i] === undefined ? "" : (userIn[i] === word[i] ? "char-correct" : "char-wrong");
        html += `<div class="char-box"><span class="${className}">${userIn[i] || word[i]}</span></div>`;
    }
    document.getElementById('word-display').innerHTML = html;
    document.getElementById('translation-display').innerText = dictionary[word] || dictionary[word.toLowerCase()] || "";
}

function validate() {
    if(document.getElementById('input-box').value.trim() === state.currentList[state.currentIndex]) {
        state.score++;
        state.currentIndex++;
        document.getElementById('input-box').value = "";
        if(state.currentIndex < state.currentList.length) render();
        else alert("挑戰完成！正確數：" + state.score);
    }
}
