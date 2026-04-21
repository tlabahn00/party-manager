package com.partymanager.controller;

import com.partymanager.model.Ticket;
import com.partymanager.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    @Autowired private TicketService ticketService;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String search,
                                    @RequestParam(required = false) String status) {
        try {
            List<Ticket> tickets;
            if (search != null && !search.isBlank()) tickets = ticketService.search(search);
            else if (status != null && !status.isBlank()) tickets = ticketService.findByZahlungsstatus(status);
            else tickets = ticketService.findAll();
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try { return ResponseEntity.ok(ticketService.findById(id)); }
        catch (Exception e) { return ResponseEntity.status(404).body(Map.of("error", e.getMessage())); }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            String ticketTyp      = (String) body.get("ticketTyp");
            Long   personId       = body.get("personId") != null ? Long.valueOf(body.get("personId").toString()) : null;
            boolean mitVerzehr    = Boolean.TRUE.equals(body.get("verzehr"));
            String zahlungsstatus = (String) body.getOrDefault("zahlungsstatus", "RESERVIERT");
            String zahlungsart    = (String) body.get("zahlungsart");
            return ResponseEntity.ok(ticketService.create(ticketTyp, personId, mitVerzehr, zahlungsstatus, zahlungsart));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Ticket ticket) {
        try { return ResponseEntity.ok(ticketService.update(id, ticket)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try { ticketService.delete(id); return ResponseEntity.ok(Map.of("message", "Ticket gelöscht")); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PatchMapping("/{id}/stornieren")
    public ResponseEntity<?> stornieren(@PathVariable Long id) {
        try { return ResponseEntity.ok(ticketService.stornieren(id)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }
}