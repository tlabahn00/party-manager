package com.partymanager.controller;

import com.partymanager.service.KasseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class KasseController {

    @Autowired private KasseService kasseService;

    @PostMapping("/api/kasse/kassieren")
    public ResponseEntity<?> kassieren(@RequestBody Map<String, Object> body) {
        try {
            Long    ticketId   = Long.valueOf(body.get("ticketId").toString());
            boolean verzehr    = Boolean.TRUE.equals(body.get("verzehr"));
            String  zahlungsart= (String) body.getOrDefault("zahlungsart", "BAR");
            return ResponseEntity.ok(kasseService.kassieren(ticketId, verzehr, zahlungsart));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/kasse/vorgaenge")
    public ResponseEntity<?> getVorgaenge() {
        try { return ResponseEntity.ok(kasseService.findAllVorgaenge()); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/api/kasse/statistik")
    public ResponseEntity<?> getStatistik() {
        try { return ResponseEntity.ok(kasseService.getStatistik()); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/api/kasse/config")
    public ResponseEntity<?> getConfig() {
        try { return ResponseEntity.ok(kasseService.getConfig()); }
        catch (Exception e) { return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/api/config")
    public ResponseEntity<?> getConfigAlias() { return getConfig(); }
}