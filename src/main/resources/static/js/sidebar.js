function renderSidebar(active) {
    const nav = [
        { href: '/pages/uebersicht.html',      icon: '📊', label: 'Übersicht' },
        { href: '/pages/tickets.html',          icon: '🎟️', label: 'Tickets' },
        { href: '/pages/personen.html',         icon: '👥', label: 'Personen' },
        { href: '/pages/kasse.html',            icon: '💰', label: 'Kasse' },
        { href: '/pages/ticket-erstellen.html', icon: '➕', label: 'Ticket erstellen' },
    ];
    const links = nav.map(n => `
        <a href="${n.href}" class="${active === n.label ? 'active' : ''}">
            <span class="nav-icon">${n.icon}</span>${n.label}
        </a>`).join('');

    document.getElementById('sidebar-container').innerHTML = `
    <aside class="pm-sidebar">
        <div class="pm-sidebar-logo">
            <div class="logo-title">🎉 Party Manager</div>
            <div class="logo-sub">Veranstaltungsverwaltung</div>
        </div>
        <nav class="pm-nav">${links}</nav>
        <div class="pm-sidebar-footer">
            <div>Angemeldet</div>
            <button class="logout-btn" onclick="logout()">🚪 Abmelden</button>
        </div>
    </aside>`;
}

function initPage(active) {
    requireAuth();
    renderSidebar(active);
}
