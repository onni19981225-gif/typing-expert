export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

export function updateTimerUI(timeLeft) {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) timerDisplay.innerText = `時間：${m}:${s.toString().padStart(2, '0')}`;
}
