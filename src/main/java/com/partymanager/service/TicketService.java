package com.partymanager.service;

import com.partymanager.model.Person;
import com.partymanager.model.Ticket;
import com.partymanager.repository.PersonRepository;
import com.partymanager.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TicketService {

    @Autowired private TicketRepository ticketRepository;
    @Autowired private PersonRepository  personRepository;

    @Value("${ticket.preis.standard}")  private BigDecimal preisStandard;
    @Value("${ticket.preis.abendkasse}")       private BigDecimal preisAbendkasse;
    @Value("${ticket.preis.mitglied}")private BigDecimal preisMitglied;
    @Value("${kasse.verzehr.preis}")    private BigDecimal verzehrPreis;

    public List<Ticket> findAll() { return ticketRepository.findAllSorted(); }

    public Ticket findById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket nicht gefunden: " + id));
    }

    public List<Ticket> findByZahlungsstatus(String status) {
        return ticketRepository.findByZahlungsstatus(status);
    }

    public List<Ticket> search(String query) {
        return ticketRepository.searchTickets(query);
    }

    /**
     * Ticket anlegen.
     * zahlungsstatus = RESERVIERT | BEZAHLT
     * zahlungsart    = BAR | KARTE | PAYPAL | UEBERWEISUNG | null (wenn reserviert)
     */
    public Ticket create(String ticketTyp, Long personId, boolean mitVerzehr,
                         String zahlungsstatus, String zahlungsart) {

        BigDecimal preis = preisForTyp(ticketTyp);
        BigDecimal vp    = mitVerzehr ? verzehrPreis : BigDecimal.ZERO;

        // Wenn bereits bezahlt, zahlungsart muss gesetzt sein
        String status = (zahlungsstatus != null && !zahlungsstatus.isBlank())
                ? zahlungsstatus.toUpperCase() : "RESERVIERT";
        String zart = "BEZAHLT".equals(status) ? zahlungsart : null;

        Ticket ticket = Ticket.builder()
                .ticketNummer(generateTicketNummer())
                .ticketTyp(ticketTyp)
                .preis(preis)
                .zahlungsstatus(status)
                .zahlungsart(zart)
                .verzehr(mitVerzehr)
                .verzehrPreis(vp)
                .eingecheckt(false)
                .build();

        if (personId != null) {
            Person person = personRepository.findById(personId)
                    .orElseThrow(() -> new RuntimeException("Person nicht gefunden: " + personId));
            ticket.setPerson(person);
        }

        return ticketRepository.save(ticket);
    }

    public Ticket update(Long id, Ticket updated) {
        Ticket t = findById(id);
        t.setTicketTyp(updated.getTicketTyp());
        t.setPreis(updated.getPreis());
        t.setZahlungsstatus(updated.getZahlungsstatus());
        t.setZahlungsart(updated.getZahlungsart());
        t.setEingecheckt(updated.getEingecheckt());
        t.setVerzehr(updated.getVerzehr());
        t.setVerzehrPreis(updated.getVerzehrPreis());
        if (updated.getPerson() != null && updated.getPerson().getId() != null) {
            Person p = personRepository.findById(updated.getPerson().getId())
                    .orElseThrow(() -> new RuntimeException("Person nicht gefunden"));
            t.setPerson(p);
        }
        return ticketRepository.save(t);
    }

    public void delete(Long id) { ticketRepository.deleteById(id); }

    /**
     * Kassen-Vorgang: Person einchecken.
     * - War RESERVIERT → Zahlung jetzt entgegennehmen, zahlungsart setzen, eingecheckt = true
     * - War BEZAHLT    → nur noch einchecken (eingecheckt = true)
     * - War STORNIERT  → Fehler
     */
    public Ticket einchecken(Long id, String zahlungsart, boolean mitVerzehr) {
        Ticket ticket = findById(id);

        if ("STORNIERT".equals(ticket.getZahlungsstatus())) {
            throw new RuntimeException("Stornierte Tickets können nicht eingecheckt werden.");
        }
        if (ticket.getEingecheckt()) {
            throw new RuntimeException("Diese Person wurde bereits eingecheckt.");
        }

        if ("RESERVIERT".equals(ticket.getZahlungsstatus())) {
            // Jetzt an der Kasse bezahlt
            ticket.setZahlungsstatus("BEZAHLT");
            ticket.setZahlungsart(zahlungsart);
            if (mitVerzehr) {
                ticket.setVerzehr(true);
                ticket.setVerzehrPreis(verzehrPreis);
            }
        }
        // Bei bereits BEZAHLT: einfach nur einchecken

        ticket.setEingecheckt(true);
        return ticketRepository.save(ticket);
    }

    public Ticket stornieren(Long id) {
        Ticket ticket = findById(id);
        if (ticket.getEingecheckt()) {
            throw new RuntimeException("Bereits eingecheckte Tickets können nicht storniert werden.");
        }
        ticket.setZahlungsstatus("STORNIERT");
        return ticketRepository.save(ticket);
    }

    private BigDecimal preisForTyp(String typ) {
        return switch (typ.toUpperCase()) {
            case "ABENDKASSE"        -> preisAbendkasse;
            case "MITGLIED" -> preisMitglied;
            default           -> preisStandard;
        };
    }

    private String generateTicketNummer() {
        long next = ticketRepository.findMaxSequenceNumber().orElse(0L) + 1;
        return String.format("%03d", next);
    }
}