export function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
export function hideModal(id) { document.getElementById(id).style.display = 'none'; }
export function showModal(id) { document.getElementById(id).style.display = 'flex'; }

export function clearUI(gameState) {
    gameState.active = false;
    if(gameState.timer) clearInterval(gameState.timer);
    gameState.timer = null;
    document.getElementById('home-logo').style.display = 'none';
    document.getElementById('pre-game-start').style.display = 'none';
    document.getElementById('word-area').style.display = 'none';
    document.getElementById('keyboard-area').style.display = 'none';
    document.getElementById('timer-display').style.display = 'none';
    document.getElementById('counter-display').style.display = 'none';
    document.getElementById('total-progress-container').style.display = 'none';
    document.getElementById('progress-text').style.display = 'none';
    document.getElementById('result-layer').style.display = 'none';
    document.getElementById('exam-results-box').style.display = 'none';
    document.getElementById('re-test-errors-btn').style.display = 'none';
    document.getElementById('word-display').classList.remove('shake-error');
}

export function updateTimerDisplay(timeLeft) {
    const m = Math.floor(timeLeft / 60); 
    const s = timeLeft % 60;
    document.getElementById('timer-display').innerText = `時間：${m}:${s.toString().padStart(2, '0')}`;
}
