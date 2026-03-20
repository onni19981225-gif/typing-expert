import { dictionary, dict } from './words.js';
import * as UI from './uiController.js';

export let state = {
    active: false, mode: '', subMode: '', currentList: [], currentIndex: 0, score: 0,
    timeLeft: 0, timer: null, testMode: false, examMode: false, examErrors: [], customData: {}
};

export function init() {
    const saved = localStorage.getItem('user_custom_lists');
    if(saved) state.customData = JSON.parse(saved);
    setupListeners();
}

function setupListeners() {
    const input = document.getElementById('input-box');
    input.addEventListener('input', () => {
        if(!state.active) return;
        input.value = input.value.replace(/[^a-zA-Z0-9\s\-\'\.\,]/g, '');
        render();
    });

    input.addEventListener('keydown', (e) => {
        if(!state.active || state.examMode || e.key === 'Backspace' || e.key === 'Enter') return;
        if(e.key.length === 1) {
            const target = state.currentList[state.currentIndex][input.value.length];
            if(e.key !== target) {
                e.preventDefault();
                playErrorEffect();
            }
        }
    });

    input.addEventListener('keypress', (e) => {
        if(e.key === 'Enter' && state.active) validate();
    });
}

function render() {
    const word = state.currentList[state.currentIndex] || "";
    const userIn = document.getElementById('input-box').value;
    let html = "";
    for(let i=0; i<word.length; i++) {
        let className = userIn[i] === undefined ? "" : (userIn[i] === word[i] ? "char-correct" : "char-wrong");
        let content = userIn[i] !== undefined ? userIn[i] : (state.testMode ? "&nbsp;" : word[i]);
        html += `<div class="char-box"><span class="${className}">${content}</span></div>`;
    }
    document.getElementById('word-display').innerHTML = html;
    document.getElementById('translation-display').innerText = dictionary[word] || dictionary[word.toLowerCase()] || "(自定義)";
}

function validate() {
    const target = state.currentList[state.currentIndex];
    const val = document.getElementById('input-box').value.trim();
    if(val === target) {
        state.score++; state.currentIndex++;
        document.getElementById('input-box').value = "";
        if(state.currentIndex < state.currentList.length) render();
        else finish();
    } else {
        playErrorEffect();
    }
}

function playErrorEffect() {
    const el = document.getElementById('word-display');
    el.classList.remove('shake-error');
    void el.offsetWidth;
    el.classList.add('shake-error');
}

function finish() {
    state.active = false; clearInterval(state.timer);
    document.getElementById('result-layer').style.display = 'flex';
    document.getElementById('result-detail').innerText = `完成！正確數：${state.score}`;
}

export function startRandom(diff, mins) {
    state.mode = 'word'; state.subMode = 'random';
    state.currentList = [...dict[diff]].sort(()=>Math.random()-0.5);
    state.timeLeft = mins * 60;
    actualStart();
}

function actualStart() {
    UI.hideAllModals();
    state.active = true; state.currentIndex = 0; state.score = 0;
    document.getElementById('word-area').style.display = 'block';
    render();
    document.getElementById('input-box').focus();
}
