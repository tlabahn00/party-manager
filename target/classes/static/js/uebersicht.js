document.addEventListener('DOMContentLoaded', async () => {
    initPage('Übersicht');
    try {
        const [stats, vorgaenge] = await Promise.all([
            apiFetch('/api/kasse/statistik'),
            apiFetch('/api/kasse/vorgaenge')
        ]);

        document.getElementById('s-einnahmen-gesamt').textContent = formatEuro(stats.einnahmenGesamt);
        document.getElementById('s-einnahmen-bar').textContent    = formatEuro(stats.einnahmenBar);
        document.getElementById('s-bezahlt').textContent          = stats.ticketsBezahlt   ?? 0;
        document.getElementById('s-offen').textContent            = stats.ticketsReserviert ?? 0;
        document.getElementById('s-storniert').textContent        = stats.ticketsStorniert  ?? 0;
        document.getElementById('s-frei').textContent             = stats.freiePlaetze      ?? 0;

        // Kapazitätsbalken
        const max     = stats.maxTeilnehmer || 0;
        const bezahlt = stats.ticketsBezahlt || 0;
        const pct     = max > 0 ? Math.min(100, Math.round(bezahlt / max * 100)) : 0;
        document.getElementById('cap-text').textContent = `${bezahlt} / ${max} Gäste`;
        document.getElementById('cap-sub').textContent  = `${pct}% ausgelastet · ${stats.freiePlaetze} Plätze frei`;
        const bar = document.getElementById('cap-bar');
        bar.style.width = pct + '%';
        if (pct >= 100) bar.classList.add('bar-full');
        else if (pct >= 75) bar.classList.add('bar-warn');

        // Letzte Vorgänge
        const tbody = document.getElementById('vorgaenge-body');
        const last10 = [...(vorgaenge||[])].sort((a,b) => new Date(b.zeitpunkt)-new Date(a.zeitpunkt)).slice(0,10);
        if (!last10.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">Noch keine Kassenvorgänge</td></tr>';
            return;
        }
        tbody.innerHTML = last10.map(v => `<tr>
            <td>${formatDate(v.zeitpunkt)}</td>
            <td><code>${v.ticket?.ticketNummer ?? '–'}</code></td>
            <td>${formatEuro(v.betrag)}</td>
            <td><strong>${formatEuro(v.gesamtbetrag)}</strong></td>
            <td><span class="badge badge-light">${v.zahlungsart}</span></td>
        </tr>`).join('');
    } catch(e) {
        showToast('Fehler beim Laden: ' + e.message, 'error');
    }
});