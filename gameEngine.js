import { dictionary, dict } from './words.js';
import { updateTimerUI, toggleSidebar } from './uiController.js';

export let state = {
    active: false, currentList: [], currentIndex: 0, score: 0
};

export function initEngine() {
    const input = document.getElementById('input-box');
    if (!input) return;

    input.addEventListener('input', () => {
        if (!state.active) return;
        input.value = input.value.replace(/[^a-zA-Z0-9\s\-\'\.\,]/g, '');
        renderWord();
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && state.active) validateWord();
    });
}

export function startMode(diff) {
    toggleSidebar();
    state.active = true;
    state.currentIndex = 0;
    state.score = 0;
    state.currentList = [...dict[diff]].sort(() => Math.random() - 0.5);
    
    document.getElementById('home-logo').style.display = 'none';
    document.getElementById('word-area').style.display = 'block';
    document.getElementById('input-box').value = "";
    renderWord();
    setTimeout(() => document.getElementById('input-box').focus(), 200);
}

function renderWord() {
    const word = state.currentList[state.currentIndex] || "";
    const userIn = document.getElementById('input-box').value;
    const wordDisplay = document.getElementById('word-display');
    const transDisplay = document.getElementById('translation-display');

    let html = "";
    for (let i = 0; i < word.length; i++) {
        let className = userIn[i] === undefined ? "" : (userIn[i] === word[i] ? "char-correct" : "char-wrong");
        html += `<div class="char-box"><span class="${className}">${userIn[i] || word[i]}</span></div>`;
    }
    if (wordDisplay) wordDisplay.innerHTML = html;
    if (transDisplay) transDisplay.innerText = dictionary[word] || dictionary[word.toLowerCase()] || "";
}

function validateWord() {
    const input = document.getElementById('input-box');
    if (input.value.trim() === state.currentList[state.currentIndex]) {
        state.score++;
        state.currentIndex++;
        input.value = "";
        if (state.currentIndex < state.currentList.length) renderWord();
        else alert("挑戰完成！正確數：" + state.score);
    } else {
        const el = document.getElementById('word-display');
        el.classList.add('shake-error');
        setTimeout(() => el.classList.remove('shake-error'), 300);
    }
}
