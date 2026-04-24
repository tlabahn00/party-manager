let cfg = null;
let allTickets   = [];   // alle Tickets aus der DB
let allPersonen  = [];   // alle Personen
let warenkorb    = [];   // { ticket, verzehr }

document.addEventListener('DOMContentLoaded', async () => {
    initPage('Kasse');
    try {
        [cfg, allTickets, allPersonen] = await Promise.all([
            loadConfig(),
            apiFetch('/api/tickets'),
            apiFetch('/api/personen')
        ]);
        if (cfg.verzehrEnabled) {
            document.getElementById('verzehr-preis-label') &&
            (document.getElementById('verzehr-preis-label').textContent = formatEuro(cfg.verzehrPreis));
        }
    } catch(e) { showToast('Fehler beim Laden: ' + e.message, 'error'); }

    setupTicketAutocomplete();
    setupPersonAutocomplete();

    // URL-Parameter ?ticket=001 → direkt hinzufügen
    const p = new URLSearchParams(window.location.search);
    if (p.get('ticket')) {
        const nr  = p.get('ticket');
        const t   = findTicketByNr(nr);
        if (t) addToWarenkorb(t);
    }
});

/* ─── Ticket-Autocomplete ─── */
function setupTicketAutocomplete() {
    const input    = document.getElementById('ticket-search');
    const dropdown = document.getElementById('search-dropdown');

    input.addEventListener('input', () => {
        const raw = input.value.trim();
        if (!raw) { hideDd(dropdown); return; }
        const q   = raw.toLowerCase();
        const hits = allTickets.filter(t => {
            if (isInWarenkorb(t.id)) return false;
            if (t.eingecheckt || t.zahlungsstatus === 'STORNIERT') return false;
            return t.ticketNummer.includes(raw) ||
                t.ticketNummer === raw.padStart(3,'0') ||
                (t.person && (t.person.vorname+' '+t.person.nachname).toLowerCase().includes(q));
        }).slice(0,8);

        if (!hits.length) { hideDd(dropdown); return; }
        dropdown.innerHTML = hits.map(t => {
            const person = t.person ? t.person.vorname+' '+t.person.nachname : '–';
            return `<div class="dropdown-item" tabindex="0"
                        onclick="selectTicketSuggestion('${t.ticketNummer}')"
                        onkeydown="ddKey(event,'${t.ticketNummer}')">
                <div class="di-left">
                    <span class="di-nr">${t.ticketNummer}</span>
                    <span class="di-name">${person}</span>
                </div>
                <div class="di-right">
                    <span class="di-typ">${t.ticketTyp}</span>
                    <span class="di-status" style="color:${statusColor(t)};">${t.zahlungsstatus}</span>
                </div>
            </div>`;
        }).join('');
        dropdown.style.display = 'block';
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter')     { hideDd(dropdown); addBySearch(); }
        if (e.key === 'Escape')    { hideDd(dropdown); }
        if (e.key === 'ArrowDown') { focusFirst(dropdown); e.preventDefault(); }
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.search-autocomplete-wrap')) hideDd(dropdown);
    });
}

function selectTicketSuggestion(nr) {
    document.getElementById('ticket-search').value = nr;
    hideDd(document.getElementById('search-dropdown'));
    addBySearch();
}

function addBySearch() {
    const raw = document.getElementById('ticket-search').value.trim();
    if (!raw) return;
    const t = findTicketByNr(raw);
    if (!t) { showToast('Ticket nicht gefunden: ' + raw, 'warning'); return; }
    if (t.eingecheckt)                    { showToast('Bereits eingecheckt.', 'warning'); return; }
    if (t.zahlungsstatus === 'STORNIERT') { showToast('Ticket ist storniert.', 'warning'); return; }
    if (isInWarenkorb(t.id))              { showToast('Ticket bereits im Warenkorb.', 'warning'); return; }
    addToWarenkorb(t);
    document.getElementById('ticket-search').value = '';
}

function findTicketByNr(raw) {
    const padded = raw.padStart(3,'0');
    return allTickets.find(t =>
        t.ticketNummer === raw ||
        t.ticketNummer === padded ||
        t.ticketNummer === String(parseInt(raw,10)||0).padStart(3,'0')
    ) || null;
}

/* ─── Personen-Autocomplete ─── */
function setupPersonAutocomplete() {
    const input    = document.getElementById('person-search');
    const dropdown = document.getElementById('person-dropdown');

    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        if (q.length < 1) { hideDd(dropdown); return; }
        const hits = allPersonen.filter(p =>
            (p.vorname+' '+p.nachname).toLowerCase().includes(q)
        ).slice(0,8);

        if (!hits.length) { hideDd(dropdown); return; }
        dropdown.innerHTML = hits.map(p => {
            const tickets = allTickets.filter(t =>
                t.person?.id === p.id && !t.eingecheckt && t.zahlungsstatus !== 'STORNIERT'
            );
            const label = tickets.length > 0
                ? `${tickets.length} offene(s) Ticket(s)`
                : 'Keine offenen Tickets';
            return `<div class="dropdown-item" tabindex="0"
                        onclick="selectPerson(${p.id})"
                        onkeydown="personDdKey(event,${p.id})">
                <div class="di-left">
                    <span class="di-nr" style="font-size:0.9rem;">${p.vorname} ${p.nachname}</span>
                    <span class="di-name">${label}</span>
                </div>
            </div>`;
        }).join('');
        dropdown.style.display = 'block';
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Escape') hideDd(dropdown);
        if (e.key === 'ArrowDown') { focusFirst(dropdown); e.preventDefault(); }
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.search-autocomplete-wrap')) hideDd(dropdown);
    });
}

function selectPerson(personId) {
    hideDd(document.getElementById('person-dropdown'));
    const person  = allPersonen.find(p => p.id === personId);
    if (!person) return;

    document.getElementById('person-search').value =
        person.vorname + ' ' + person.nachname;

    // Alle offenen, nicht-eingecheckten Tickets dieser Person laden
    const tickets = allTickets.filter(t =>
        t.person?.id === personId &&
        !t.eingecheckt &&
        t.zahlungsstatus !== 'STORNIERT'
    );

    if (!tickets.length) {
        document.getElementById('person-info').textContent =
            'Keine offenen Tickets für diese Person.';
        return;
    }

    let added = 0;
    tickets.forEach(t => {
        if (!isInWarenkorb(t.id)) { addToWarenkorb(t); added++; }
    });

    document.getElementById('person-info').textContent =
        added > 0
            ? `${added} Ticket(s) von ${person.vorname} ${person.nachname} hinzugefügt.`
            : 'Alle Tickets bereits im Warenkorb.';
}

function clearPersonSearch() {
    document.getElementById('person-search').value = '';
    document.getElementById('person-info').textContent = '';
    hideDd(document.getElementById('person-dropdown'));
}

/* ─── Warenkorb ─── */
function isInWarenkorb(id) { return warenkorb.some(w => w.ticket.id === id); }

function addToWarenkorb(ticket) {
    warenkorb.push({ ticket, verzehr: ticket.verzehr || false });
    renderWarenkorb();
}

function removeFromWarenkorb(id) {
    warenkorb = warenkorb.filter(w => w.ticket.id !== id);
    renderWarenkorb();
}

function toggleVerzehr(id) {
    const item = warenkorb.find(w => w.ticket.id === id);
    if (item) { item.verzehr = !item.verzehr; renderWarenkorb(); }
}

function clearWarenkorb() {
    warenkorb = [];
    renderWarenkorb();
}

function renderWarenkorb() {
    const container = document.getElementById('warenkorb-items');
    const btn       = document.getElementById('kassieren-btn');
    const clearBtn  = document.getElementById('clear-btn');

    if (!warenkorb.length) {
        container.innerHTML = '<div class="warenkorb-empty">Noch keine Tickets hinzugefügt</div>';
        btn.disabled = true;
        clearBtn.style.display = 'none';
        updateSummen();
        return;
    }

    btn.disabled = false;
    clearBtn.style.display = 'inline-flex';

    container.innerHTML = warenkorb.map(({ticket, verzehr}) => {
        const person = ticket.person
            ? ticket.person.vorname+' '+ticket.person.nachname : '–';
        const istReserviert = ticket.zahlungsstatus === 'RESERVIERT';
        const vp = cfg?.verzehrEnabled && verzehr && istReserviert ? parseFloat(cfg.verzehrPreis) : 0;
        const itemPreis = istReserviert ? parseFloat(ticket.preis) + vp : 0;

        return `<div class="warenkorb-item">
            <div class="wi-info">
                <div class="wi-nr">${ticket.ticketNummer}
                    ${typBadge(ticket.ticketTyp)}
                    ${istReserviert
            ? '<span class="badge badge-warning" style="font-size:0.65rem;">Zahlung ausstehend</span>'
            : '<span class="badge badge-info" style="font-size:0.65rem;">Vorab bezahlt</span>'}
                </div>
                <div class="wi-meta">${person}</div>
                ${cfg?.verzehrEnabled && istReserviert ? `
                <label class="wi-verzehr" onclick="toggleVerzehr(${ticket.id})">
                    <input type="checkbox" ${verzehr ? 'checked' : ''}
                        onclick="event.stopPropagation();toggleVerzehr(${ticket.id})">
                    🍽️ Verzehr +${formatEuro(cfg.verzehrPreis)}
                </label>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                <span class="wi-preis">${istReserviert ? formatEuro(itemPreis) : '<span style="font-size:0.75rem;color:#1a7a44;font-weight:600;">✓ Nur Eincheck</span>'}</span>
                <button class="wi-remove" onclick="removeFromWarenkorb(${ticket.id})" title="Entfernen">✕</button>
            </div>
        </div>`;
    }).join('');

    updateSummen();
}

function updateSummen() {
    let zuKassieren = 0, verzehr = 0;
    warenkorb.forEach(({ticket, verzehr: mitV}) => {
        const istReserviert = ticket.zahlungsstatus === 'RESERVIERT';
        if (istReserviert) {
            zuKassieren += parseFloat(ticket.preis);
            if (mitV && cfg?.verzehrEnabled) verzehr += parseFloat(cfg.verzehrPreis);
        }
    });

    document.getElementById('wf-tickets').textContent = formatEuro(zuKassieren);
    document.getElementById('wf-gesamt').textContent  = formatEuro(zuKassieren + verzehr);

    const vr = document.getElementById('wf-verzehr-row');
    if (verzehr > 0) {
        vr.style.display = 'flex';
        document.getElementById('wf-verzehr').textContent = formatEuro(verzehr);
    } else {
        vr.style.display = 'none';
    }

    // Alte Vorab-Zeile entfernen falls vorhanden
    const paidRow = document.getElementById('wf-paid-row');
    if (paidRow) paidRow.remove();
}

/* ─── Kassieren ─── */
async function kassiereWarenkorb() {
    if (!warenkorb.length) return;

    const btn = document.getElementById('kassieren-btn');
    btn.classList.add('btn-loading');
    btn.textContent = 'Verarbeite…';

    const zahlungsart = document.getElementById('zahlungsart-select').value;
    const errors = [];
    const success = [];

    for (const {ticket, verzehr} of warenkorb) {
        try {
            await apiFetch('/api/kasse/kassieren', {
                method: 'POST',
                body: JSON.stringify({
                    ticketId:    ticket.id,
                    verzehr:     verzehr && cfg?.verzehrEnabled,
                    zahlungsart: zahlungsart
                })
            });
            // Lokal updaten
            const idx = allTickets.findIndex(t => t.id === ticket.id);
            if (idx !== -1) {
                allTickets[idx].eingecheckt    = true;
                allTickets[idx].zahlungsstatus = 'BEZAHLT';
            }
            success.push(ticket.ticketNummer);
        } catch(e) {
            errors.push(`${ticket.ticketNummer}: ${e.message}`);
        }
    }

    btn.classList.remove('btn-loading');
    btn.textContent = '✓ Kassieren & Einchecken';

    if (success.length) {
        const msg = success.length === 1
            ? `Ticket ${success[0]} kassiert & eingecheckt.`
            : `${success.length} Tickets kassiert & eingecheckt: ${success.join(', ')}`;
        document.getElementById('success-msg').textContent = ' ' + msg;
        document.getElementById('success-box').style.display = 'flex';
    }
    if (errors.length) {
        errors.forEach(e => showToast('Fehler – ' + e, 'error'));
    }

    // Erfolgreich verarbeitete aus Warenkorb entfernen
    warenkorb = warenkorb.filter(w => !success.includes(w.ticket.ticketNummer));
    renderWarenkorb();
}

/* ─── Abendkasse-Shortcut ─── */
async function abendkasse() {
    try {
        const ticket = await apiFetch('/api/tickets', {
            method: 'POST',
            body: JSON.stringify({
                ticketTyp: 'ABENDKASSE', personId: null,
                verzehr: false, zahlungsstatus: 'RESERVIERT', zahlungsart: null
            })
        });
        allTickets.push(ticket);
        addToWarenkorb(ticket);
        showToast('Abendkasse-Ticket ' + ticket.ticketNummer + ' angelegt.', 'success');
    } catch(e) { showToast('Fehler: ' + e.message, 'error'); }
}

/* ─── Reset ─── */
function resetKasse() {
    document.getElementById('success-box').style.display = 'none';
    document.getElementById('ticket-search').value = '';
    clearPersonSearch();
}

/* ─── Hilfsfunktionen ─── */
function statusColor(t) {
    return { RESERVIERT:'#9a6800', BEZAHLT:'#1a7a44', STORNIERT:'#a02020' }[t.zahlungsstatus] || '#555';
}
function hideDd(el) { el.style.display = 'none'; }
function focusFirst(dd) {
    const first = dd.querySelector('.dropdown-item');
    if (first) { first.setAttribute('tabindex','0'); first.focus(); }
}
function ddKey(e, nr) {
    if (e.key === 'Enter' || e.key === ' ') selectTicketSuggestion(nr);
    if (e.key === 'ArrowDown') { e.target.nextElementSibling?.focus(); e.preventDefault(); }
    if (e.key === 'ArrowUp')   { e.target.previousElementSibling?.focus() || document.getElementById('ticket-search').focus(); e.preventDefault(); }
}
function personDdKey(e, id) {
    if (e.key === 'Enter' || e.key === ' ') selectPerson(id);
    if (e.key === 'ArrowDown') { e.target.nextElementSibling?.focus(); e.preventDefault(); }
    if (e.key === 'ArrowUp')   { e.target.previousElementSibling?.focus() || document.getElementById('person-search').focus(); e.preventDefault(); }
}