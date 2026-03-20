export function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

export function hideAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

export function showModal(id) {
    document.getElementById(id).style.display = 'flex';
}

export function updateTimerUI(timeLeft) {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timer-display').innerText = `時間：${m}:${s.toString().padStart(2, '0')}`;
}

export function renderSavedLists(customData, onSelect, onDelete) {
    const display = document.getElementById('saved-lists-display');
    display.innerHTML = "";
    for(let name in customData) {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `<span>📂 ${name}</span> <button class="delete-btn" style="color:red;border:none;background:none;cursor:pointer;">🗑️</button>`;
        item.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); onDelete(name); };
        item.onclick = () => onSelect(name);
        display.appendChild(item);
    }
}
