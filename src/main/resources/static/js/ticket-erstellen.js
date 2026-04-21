let cfg = null;
let lastNummer = null;

document.addEventListener('DOMContentLoaded', async () => {
    initPage('Ticket erstellen');
    try {
        cfg = await loadConfig();

        if (cfg.verzehrEnabled) {
            document.getElementById('verzehr-field').style.display = 'block';
            document.getElementById('verzehr-label').textContent = formatEuro(cfg.verzehrPreis);
        }

        const personen = await apiFetch('/api/personen');
        const sel = document.getElementById('person-select');
        (personen || []).forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.vorname + ' ' + p.nachname;
            sel.appendChild(opt);
        });

        updatePreis();
    } catch(e) {
        showToast('Fehler beim Laden: ' + e.message, 'error');
    }

    // Zahlungsart-Feld ein/ausblenden je nach Status
    document.getElementById('zahlungsstatus').addEventListener('change', toggleZahlungsart);
    toggleZahlungsart();
});

function toggleZahlungsart() {
    const status = document.getElementById('zahlungsstatus').value;
    const wrap   = document.getElementById('zahlungsart-wrap');
    wrap.style.display = status === 'BEZAHLT' ? 'block' : 'none';
}

function updatePreis() {
    if (!cfg) return;
    const typ  = document.getElementById('ticket-typ').value;
    const map  = { STANDARD: cfg.preisStandard, VIP: cfg.preisVip, ERMAESSIGT: cfg.preisErmaessigt };
    const basis = parseFloat(map[typ] || 0);
    const mitV  = document.getElementById('verzehr-checkbox')?.checked && cfg.verzehrEnabled;
    document.getElementById('preis-display').value = formatEuro(basis);
    document.getElementById('gesamt-preis').textContent = formatEuro(basis + (mitV ? parseFloat(cfg.verzehrPreis) : 0));
}

async function createTicket() {
    const btn    = document.getElementById('create-btn');
    const status = document.getElementById('zahlungsstatus').value;
    const zart   = document.getElementById('zahlungsart-select').value;

    if (status === 'BEZAHLT' && !zart) {
        showToast('Bitte Zahlungsart angeben.', 'warning'); return;
    }

    btn.classList.add('btn-loading');
    btn.textContent = 'Erstelle…';

    try {
        const ticket = await apiFetch('/api/tickets', {
            method: 'POST',
            body: JSON.stringify({
                ticketTyp:     document.getElementById('ticket-typ').value,
                personId:      document.getElementById('person-select').value || null,
                verzehr:       document.getElementById('verzehr-checkbox')?.checked && cfg?.verzehrEnabled,
                zahlungsstatus: status,
                zahlungsart:   status === 'BEZAHLT' ? zart : null
            })
        });
        lastNummer = ticket.ticketNummer;
        document.getElementById('new-ticket-nr').textContent = ticket.ticketNummer;
        document.getElementById('new-ticket-status').textContent =
            status === 'BEZAHLT' ? '✓ Bereits bezahlt (' + zart + ')' : '⏳ Reserviert – Zahlung an der Kasse';
        document.getElementById('success-box').style.display = 'flex';
        document.getElementById('create-btn').style.display  = 'none';
        // Zur Kasse nur sinnvoll wenn reserviert
        document.getElementById('btn-zur-kasse').style.display = status === 'RESERVIERT' ? 'inline-flex' : 'none';
    } catch(e) {
        showToast('Fehler beim Erstellen: ' + e.message, 'error');
    } finally {
        btn.classList.remove('btn-loading');
        btn.textContent = '🎟️ Ticket erstellen';
    }
}

function goToKasse() {
    window.location.href = '/pages/kasse.html?ticket=' + lastNummer;
}

function resetForm() {
    document.getElementById('success-box').style.display = 'none';
    document.getElementById('create-btn').style.display  = 'block';
    document.getElementById('ticket-typ').value          = 'STANDARD';
    document.getElementById('person-select').value       = '';
    document.getElementById('zahlungsstatus').value      = 'RESERVIERT';
    const cb = document.getElementById('verzehr-checkbox');
    if (cb) cb.checked = false;
    toggleZahlungsart();
    updatePreis();
    lastNummer = null;
}