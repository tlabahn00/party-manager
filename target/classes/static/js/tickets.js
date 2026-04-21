let allTickets = [];

document.addEventListener('DOMContentLoaded', async () => {
    initPage('Tickets');
    await loadTickets();
    document.getElementById('search-input').addEventListener('input', filterTickets);
    document.getElementById('status-filter').addEventListener('change', filterTickets);
});

async function loadTickets() {
    try { allTickets = await apiFetch('/api/tickets'); renderTickets(allTickets); }
    catch(e) { showToast('Fehler: '+e.message, 'error'); }
}

function filterTickets() {
    const q = document.getElementById('search-input').value.toLowerCase();
    const s = document.getElementById('status-filter').value;
    let f = allTickets;
    if (s) f = f.filter(t => t.zahlungsstatus === s);
    if (q) f = f.filter(t =>
        t.ticketNummer.toLowerCase().includes(q) ||
        (t.person && (t.person.vorname+' '+t.person.nachname).toLowerCase().includes(q))
    );
    renderTickets(f);
}

function renderTickets(tickets) {
    const tbody = document.getElementById('tickets-body');
    if (!tickets.length) {
        tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">Keine Tickets gefunden</td></tr>';
        return;
    }
    tbody.innerHTML = tickets.map(t => `<tr>
        <td><code>${t.ticketNummer}</code></td>
        <td>${t.person ? t.person.vorname+' '+t.person.nachname : '<span class="text-muted">–</span>'}</td>
        <td>${typBadge(t.ticketTyp)}</td>
        <td>${formatEuro(t.preis)}</td>
        <td>${zahlungsstatusBadge(t)}</td>
        <td>${t.eingecheckt ? '<span class="badge badge-success">✓ Ja</span>' : '<span class="badge badge-light">Nein</span>'}</td>
        <td>${t.verzehr ? '<span class="badge badge-info">✓ Ja</span>' : '<span class="badge badge-light">Nein</span>'}</td>
        <td>
            <div class="flex gap-1">
                ${!t.eingecheckt && t.zahlungsstatus !== 'STORNIERT'
        ? `<a href="/pages/kasse.html?ticket=${t.ticketNummer}" class="btn btn-primary btn-sm">Kasse</a>` : ''}
                ${t.zahlungsstatus !== 'STORNIERT' && !t.eingecheckt
        ? `<button class="btn btn-warning btn-sm" onclick="doStornieren(${t.id})">Stornieren</button>` : ''}
            </div>
        </td>
    </tr>`).join('');
}

function zahlungsstatusBadge(t) {
    if (t.eingecheckt)                   return '<span class="badge badge-success">✓ Eingecheckt</span>';
    if (t.zahlungsstatus==='BEZAHLT')    return '<span class="badge badge-info">Bezahlt</span>';
    if (t.zahlungsstatus==='RESERVIERT') return '<span class="badge badge-warning">Reserviert</span>';
    if (t.zahlungsstatus==='STORNIERT')  return '<span class="badge badge-danger">Storniert</span>';
    return '<span class="badge badge-light">'+t.zahlungsstatus+'</span>';
}

async function doStornieren(id) {
    if (!confirm('Ticket wirklich stornieren?')) return;
    try {
        await apiFetch('/api/tickets/'+id+'/stornieren', { method:'PATCH' });
        showToast('Ticket storniert.', 'warning');
        await loadTickets();
    } catch(e) { showToast('Fehler: '+e.message, 'error'); }
}