package com.partymanager.service;

import com.partymanager.model.Kassenvorgang;
import com.partymanager.model.Ticket;
import com.partymanager.repository.KassenvorgangRepository;
import com.partymanager.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class KasseService {

    @Autowired private KassenvorgangRepository kassenvorgangRepository;
    @Autowired private TicketRepository        ticketRepository;
    @Autowired private TicketService           ticketService;

    @Value("${kasse.verzehr.enabled}")    private boolean    verzehrEnabled;
    @Value("${kasse.verzehr.preis}")      private BigDecimal verzehrPreis;
    @Value("${ticket.preis.standard}")    private BigDecimal preisStandard;
    @Value("${ticket.preis.abendkasse}")         private BigDecimal preisAbendkasse;
    @Value("${ticket.preis.mitglied}")  private BigDecimal preisMitglied;
    @Value("${veranstaltung.max-teilnehmer}") private int    maxTeilnehmer;

    /**
     * Kassen-Vorgang:
     * 1. Ticket einchecken (ggf. Zahlung entgegennehmen wenn RESERVIERT)
     * 2. Kassenvorgang anlegen (nur wenn Geld geflossen ist, d.h. war RESERVIERT)
     */
    @Transactional
    public Map<String, Object> kassieren(Long ticketId, boolean mitVerzehr, String zahlungsart) {
        Ticket vorher = ticketService.findById(ticketId);
        boolean warReserviert = "RESERVIERT".equals(vorher.getZahlungsstatus());

        // Einchecken (und ggf. bezahlen)
        Ticket ticket = ticketService.einchecken(ticketId,
                zahlungsart != null ? zahlungsart : "BAR",
                mitVerzehr && verzehrEnabled);

        Kassenvorgang vorgang = null;
        if (warReserviert) {
            // Kassenvorgang nur anlegen wenn jetzt gerade Geld kassiert wurde
            BigDecimal vg     = (mitVerzehr && verzehrEnabled) ? verzehrPreis : BigDecimal.ZERO;
            BigDecimal gesamt = ticket.getPreis().add(vg);
            vorgang = kassenvorgangRepository.save(Kassenvorgang.builder()
                    .ticket(ticket)
                    .betrag(ticket.getPreis())
                    .verzehrGebuehr(vg)
                    .gesamtbetrag(gesamt)
                    .zahlungsart(zahlungsart != null ? zahlungsart : "BAR")
                    .build());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("ticket",  ticket);
        result.put("vorgang", vorgang);
        result.put("warReserviert", warReserviert);
        return result;
    }

    public List<Kassenvorgang> findAllVorgaenge() { return kassenvorgangRepository.findAll(); }

    public Map<String, Object> getStatistik() {
        long bezahlt   = ticketRepository.countByZahlungsstatus("BEZAHLT");
        long reserviert= ticketRepository.countByZahlungsstatus("RESERVIERT");
        long storniert = ticketRepository.countByZahlungsstatus("STORNIERT");
        long eingecheckt = ticketRepository.countEingecheckt();

        Map<String, Object> s = new HashMap<>();
        s.put("gesamtEinnahmen",  kassenvorgangRepository.sumGesamtbetrag());
        s.put("ticketsGesamt",    ticketRepository.count());
        s.put("ticketsBezahlt",   bezahlt);
        s.put("ticketsReserviert",reserviert);
        s.put("ticketsStorniert", storniert);
        s.put("ticketsEingecheckt", eingecheckt);
        s.put("maxTeilnehmer",    maxTeilnehmer);
        s.put("freiePlaetze",     Math.max(0, maxTeilnehmer - eingecheckt));
        return s;
    }

    public Map<String, Object> getConfig() {
        Map<String, Object> c = new HashMap<>();
        c.put("verzehrEnabled",  verzehrEnabled);
        c.put("verzehrPreis",    verzehrPreis);
        c.put("preisStandard",   preisStandard);
        c.put("preisAbendkasse",        preisAbendkasse);
        c.put("preisMitglied", preisMitglied);
        c.put("maxTeilnehmer",   maxTeilnehmer);
        return c;
    }
}