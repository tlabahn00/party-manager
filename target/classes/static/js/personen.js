let allPersonen = [];
let ticketCounts = {};

document.addEventListener('DOMContentLoaded', async () => {
    initPage('Personen');
    await loadPersonen();
    document.getElementById('search-input').addEventListener('input', filterPersonen);
});

async function loadPersonen() {
    try {
        const [personen, tickets] = await Promise.all([
            apiFetch('/api/personen'),
            apiFetch('/api/tickets')
        ]);
        allPersonen = personen || [];
        ticketCounts = {};
        (tickets || []).forEach(t => {
            if (t.person?.id) ticketCounts[t.person.id] = (ticketCounts[t.person.id] || 0) + 1;
        });
        renderPersonen(allPersonen);
    } catch(e) { showToast('Fehler beim Laden: ' + e.message, 'error'); }
}

function filterPersonen() {
    const q = document.getElementById('search-input').value.toLowerCase();
    renderPersonen(q
        ? allPersonen.filter(p => (p.vorname + ' ' + p.nachname).toLowerCase().includes(q))
        : allPersonen
    );
}

function renderPersonen(list) {
    const tbody = document.getElementById('personen-body');
    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">Keine Personen gefunden</td></tr>';
        return;
    }
    tbody.innerHTML = list.map(p => `<tr>
        <td>${p.vorname}</td>
        <td>${p.nachname}</td>
        <td>${p.email || '<span class="text-muted">–</span>'}</td>
        <td>${p.telefon || '<span class="text-muted">–</span>'}</td>
        <td><span class="badge badge-info">${ticketCounts[p.id] || 0}</span></td>
        <td>
            <div class="flex gap-1">
                <button class="btn btn-light btn-sm" onclick="openModal(${p.id})">✏️ Bearbeiten</button>
                <button class="btn btn-danger btn-sm" onclick="deletePerson(${p.id})">🗑️ Löschen</button>
            </div>
        </td>
    </tr>`).join('');
}

function openModal(id) {
    document.getElementById('person-modal').classList.add('open');
    if (id) {
        const p = allPersonen.find(x => x.id === id);
        document.getElementById('modal-title').textContent = 'Person bearbeiten';
        document.getElementById('person-id').value    = p.id;
        document.getElementById('p-vorname').value   = p.vorname || '';
        document.getElementById('p-nachname').value  = p.nachname || '';
        document.getElementById('p-email').value     = p.email || '';
        document.getElementById('p-telefon').value   = p.telefon || '';
        document.getElementById('p-notiz').value     = p.notiz || '';
    } else {
        document.getElementById('modal-title').textContent = 'Neue Person anlegen';
        document.getElementById('person-id').value = '';
        ['p-vorname','p-nachname','p-email','p-telefon','p-notiz']
            .forEach(id => document.getElementById(id).value = '');
    }
}

function closeModal() {
    document.getElementById('person-modal').classList.remove('open');
}

async function savePerson() {
    const id   = document.getElementById('person-id').value;
    const body = {
        vorname:  document.getElementById('p-vorname').value.trim(),
        nachname: document.getElementById('p-nachname').value.trim(),
        email:    document.getElementById('p-email').value.trim(),
        telefon:  document.getElementById('p-telefon').value.trim(),
        notiz:    document.getElementById('p-notiz').value.trim(),
    };
    if (!body.vorname || !body.nachname) {
        showToast('Vorname und Nachname sind Pflichtfelder.', 'warning'); return;
    }
    try {
        if (id) {
            await apiFetch('/api/personen/' + id, { method: 'PUT', body: JSON.stringify(body) });
            showToast('Person aktualisiert.', 'success');
        } else {
            await apiFetch('/api/personen', { method: 'POST', body: JSON.stringify(body) });
            showToast('Person angelegt.', 'success');
        }
        closeModal();
        await loadPersonen();
    } catch(e) { showToast('Fehler: ' + e.message, 'error'); }
}

async function deletePerson(id) {
    const count = ticketCounts[id] || 0;
    const msg = count > 0
        ? `Diese Person hat ${count} verknüpfte Ticket(s). Die Tickets bleiben erhalten. Trotzdem löschen?`
        : 'Person wirklich löschen?';
    if (!confirm(msg)) return;
    try {
        await apiFetch('/api/personen/' + id, { method: 'DELETE' });
        showToast('Person gelöscht.', 'warning');
        await loadPersonen();
    } catch(e) { showToast('Fehler: ' + e.message, 'error'); }
}
