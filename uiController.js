export function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

export function showModal(id) {
    document.getElementById(id).style.display = 'flex';
}

export function hideModal(id) {
    document.getElementById(id).style.display = 'none';
}
