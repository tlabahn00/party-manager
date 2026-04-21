package com.partymanager.controller;

import com.partymanager.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String token = authService.login(body.get("username"), body.get("password"));
            return ResponseEntity.ok(Map.of("token", token));
        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Ungültige Anmeldedaten", "status", 401));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        try {
            authService.changePassword(
                    userDetails.getUsername(),
                    body.get("oldPassword"),
                    body.get("newPassword")
            );
            return ResponseEntity.ok(Map.of("message", "Passwort erfolgreich geändert"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage(), "status", 400));
        }
    }
}
