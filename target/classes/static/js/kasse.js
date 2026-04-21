let currentTicket = null;
let cfg = null;
let allTickets = [];

document.addEventListener('DOMContentLoaded', async () => {
    initPage('Kasse');
    try {
        [cfg, allTickets] = await Promise.all([loadConfig(), apiFetch('/api/tickets')]);
        if (cfg.verzehrEnabled) {
            document.getElementById('verzehr-preis-label').textContent = formatEuro(cfg.verzehrPreis);
        }
    } catch(e) { showToast('Fehler beim Laden: ' + e.message, 'error'); }

    const p = new URLSearchParams(window.location.search);
    if (p.get('ticket')) {
        document.getElementById('ticket-search').value = p.get('ticket');
        await searchTicket();
    }
    setupAutocomplete();
});

function setupAutocomplete() {
    const input    = document.getElementById('ticket-search');
    const dropdown = document.getElementById('search-dropdown');

    input.addEventListener('input', () => {
        const raw = input.value.trim();
        if (!raw) { hideDropdown(); return; }
        const q = raw.toLowerCase();
        const matches = allTickets.filter(t => {
            const numMatch = t.ticketNummer.includes(raw) || t.ticketNummer === raw.padStart(3,'0');
            const name = t.person ? (t.person.vorname+' '+t.person.nachname).toLowerCase() : '';
            return numMatch || name.includes(q);
        }).slice(0, 8);

        if (!matches.length) { hideDropdown(); return; }

        dropdown.innerHTML = matches.map(t => {
            const person = t.person ? t.person.vorname+' '+t.person.nachname : '–';
            const sc = { RESERVIERT:'#9a6800', BEZAHLT:'#1a7a44', STORNIERT:'#a02020' }[t.zahlungsstatus]||'#555';
            const icon = t.eingecheckt ? '✓ ' : (t.zahlungsstatus==='RESERVIERT' ? '💰 ' : '');
            return `<div class="dropdown-item" onclick="selectSuggestion('${t.ticketNummer}')">
                <div class="di-left">
                    <span class="di-nr">${t.ticketNummer}</span>
                    <span class="di-name">${person}</span>
                </div>
                <div class="di-right">
                    <span class="di-typ">${t.ticketTyp}</span>
                    <span class="di-status" style="color:${sc};">${icon}${t.zahlungsstatus}${t.eingecheckt?' · Eingecheckt':''}</span>
                </div>
            </div>`;
        }).join('');
        dropdown.style.display = 'block';
    });

    input.addEventListener('keydown', e => {
        if (e.key==='Enter')     { hideDropdown(); searchTicket(); }
        if (e.key==='Escape')    { hideDropdown(); }
        if (e.key==='ArrowDown') { focusItem(0); e.preventDefault(); }
    });
    dropdown.addEventListener('keydown', e => {
        const items = [...dropdown.querySelectorAll('.dropdown-item')];
        const idx   = items.indexOf(document.activeElement);
        if (e.key==='ArrowDown')  { focusItem(idx+1); e.preventDefault(); }
        if (e.key==='ArrowUp')    { idx>0 ? focusItem(idx-1) : input.focus(); e.preventDefault(); }
        if (e.key==='Escape')     { hideDropdown(); input.focus(); }
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.search-autocomplete-wrap')) hideDropdown();
    });
}

function focusItem(idx) {
    const items = document.querySelectorAll('#search-dropdown .dropdown-item');
    if (items[idx]) { items[idx].setAttribute('tabindex','0'); items[idx].focus(); }
}
function hideDropdown() { document.getElementById('search-dropdown').style.display = 'none'; }
function selectSuggestion(nr) { document.getElementById('ticket-search').value = nr; hideDropdown(); searchTicket(); }

async function searchTicket() {
    const raw = document.getElementById('ticket-search').value.trim();
    if (!raw) return;
    hideAll();

    const padded = raw.padStart(3,'0');
    let ticket = allTickets.find(t =>
        t.ticketNummer === raw || t.ticketNummer === padded ||
        t.ticketNummer === String(parseInt(raw,10)||0).padStart(3,'0')
    );

    if (!ticket) {
        const q = raw.toLowerCase();
        const hits = allTickets.filter(t => {
            const name = t.person ? (t.person.vorname+' '+t.person.nachname).toLowerCase() : '';
            return name.includes(q);
        });
        if (hits.length === 1)    { ticket = hits[0]; }
        else if (hits.length > 1) { showResults(hits); return; }
        else { showToast('Kein Ticket gefunden für: '+raw, 'warning'); return; }
    }
    showTicket(ticket);
}

function showResults(tickets) {
    document.getElementById('results-body').innerHTML = tickets.map(t => `<tr>
        <td><code>${t.ticketNummer}</code></td>
        <td>${t.person ? t.person.vorname+' '+t.person.nachname : '–'}</td>
        <td>${typBadge(t.ticketTyp)}</td>
        <td>${formatEuro(t.preis)}</td>
        <td>${zahlungsstatusBadge(t)}</td>
        <td><button class="btn btn-primary btn-sm" onclick="selectById(${t.id})">Auswählen</button></td>
    </tr>`).join('');
    document.getElementById('search-results').style.display = 'block';
}

function selectById(id) {
    const t = allTickets.find(x => x.id===id);
    if (t) { document.getElementById('search-results').style.display='none'; showTicket(t); }
}

function showTicket(ticket) {
    hideAll();
    currentTicket = ticket;

    if (ticket.eingecheckt) {
        document.getElementById('already-checked').style.display = 'flex'; return;
    }
    if (ticket.zahlungsstatus === 'STORNIERT') {
        document.getElementById('is-storniert').style.display = 'flex'; return;
    }

    const istReserviert = ticket.zahlungsstatus === 'RESERVIERT';

    document.getElementById('d-nr').innerHTML       = `<strong>${ticket.ticketNummer}</strong>`;
    document.getElementById('d-typ').innerHTML      = typBadge(ticket.ticketTyp);
    document.getElementById('d-person').textContent = ticket.person
        ? ticket.person.vorname+' '+ticket.person.nachname : '–';
    document.getElementById('d-preis').textContent  = formatEuro(ticket.preis);
    document.getElementById('d-status').innerHTML   = zahlungsstatusBadge(ticket);

    // Hinweisbox: was passiert beim Abschließen
    const hinweis = document.getElementById('kasse-hinweis');
    if (istReserviert) {
        hinweis.className = 'pm-alert pm-alert-warning';
        hinweis.innerHTML = '💰 <strong>Reservierung</strong> – Zahlung jetzt an der Kasse entgegennehmen.';
    } else {
        hinweis.className = 'pm-alert pm-alert-info';
        hinweis.innerHTML = '✓ Bereits bezahlt (' + (ticket.zahlungsart||'–') + ') – nur noch Einchecken.';
    }
    hinweis.style.display = 'flex';

    // Verzehr nur bei Reservierungen anzeigen (bei vorausbezahlten wurde es schon beim Erstellen gewählt)
    const vs = document.getElementById('verzehr-section');
    if (istReserviert && cfg?.verzehrEnabled) {
        vs.style.display = 'block';
        document.getElementById('kasse-verzehr').checked = ticket.verzehr || false;
    } else {
        vs.style.display = 'none';
    }

    // Zahlungsart nur bei Reservierungen
    document.getElementById('zahlungsart-wrap').style.display = istReserviert ? 'block' : 'none';

    updateGesamt();
    document.getElementById('ticket-box').style.display = 'block';

    const payBtn = document.getElementById('pay-btn');
    payBtn.textContent = istReserviert ? '💵 Kassieren & Einchecken' : '✓ Einchecken';
    payBtn.className   = 'btn btn-full btn-lg ' + (istReserviert ? 'btn-success' : 'btn-primary');
}

function zahlungsstatusBadge(t) {
    if (t.eingecheckt)                        return '<span class="badge badge-success">✓ Eingecheckt</span>';
    if (t.zahlungsstatus==='BEZAHLT')         return '<span class="badge badge-info">Bezahlt · wartet auf Einlass</span>';
    if (t.zahlungsstatus==='RESERVIERT')      return '<span class="badge badge-warning">Reserviert</span>';
    if (t.zahlungsstatus==='STORNIERT')       return '<span class="badge badge-danger">Storniert</span>';
    return '<span class="badge badge-light">'+t.zahlungsstatus+'</span>';
}

function updateGesamt() {
    if (!currentTicket) return;
    const istReserviert = currentTicket.zahlungsstatus === 'RESERVIERT';
    const mitVerzehr = istReserviert && document.getElementById('kasse-verzehr')?.checked && cfg?.verzehrEnabled;
    const vp  = mitVerzehr ? parseFloat(cfg.verzehrPreis) : (parseFloat(currentTicket.verzehrPreis)||0);
    document.getElementById('gesamt-betrag').textContent = formatEuro(parseFloat(currentTicket.preis) + vp);
    document.getElementById('gesamt-wrap').style.display = istReserviert ? 'flex' : 'none';
}

async function kassieren() {
    if (!currentTicket) return;
    const btn = document.getElementById('pay-btn');
    btn.classList.add('btn-loading');
    const origText = btn.textContent;
    btn.textContent = 'Verarbeite…';

    const istReserviert = currentTicket.zahlungsstatus === 'RESERVIERT';

    try {
        const result = await apiFetch('/api/kasse/kassieren', {
            method: 'POST',
            body: JSON.stringify({
                ticketId:    currentTicket.id,
                verzehr:     istReserviert && document.getElementById('kasse-verzehr')?.checked && cfg?.verzehrEnabled,
                zahlungsart: istReserviert ? document.getElementById('zahlungsart-select').value : currentTicket.zahlungsart
            })
        });

        // Lokal aktualisieren
        const idx = allTickets.findIndex(t => t.id === currentTicket.id);
        if (idx !== -1) { allTickets[idx].eingecheckt = true; allTickets[idx].zahlungsstatus = 'BEZAHLT'; }

        document.getElementById('success-nr').textContent = currentTicket.ticketNummer;
        document.getElementById('success-msg').textContent = istReserviert
            ? '💵 Zahlung kassiert und Person eingecheckt.'
            : '✓ Person eingecheckt.';
        hideAll();
        document.getElementById('success-box').style.display = 'flex';
        currentTicket = null;
    } catch(e) {
        showToast('Fehler: ' + e.message, 'error');
    } finally {
        btn.classList.remove('btn-loading');
        btn.textContent = origText;
    }
}

function hideAll() {
    ['ticket-box','already-checked','is-storniert','success-box','search-results']
        .forEach(id => document.getElementById(id).style.display='none');
}

function resetKasse() {
    hideAll();
    currentTicket = null;
    document.getElementById('ticket-search').value = '';
    document.getElementById('ticket-search').focus();
}