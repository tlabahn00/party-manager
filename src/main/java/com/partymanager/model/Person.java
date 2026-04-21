package com.partymanager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "personen")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String vorname;

    @Column(nullable = false, length = 100)
    private String nachname;

    @Column(length = 255)
    private String email;

    @Column(length = 50)
    private String telefon;

    @Column(columnDefinition = "TEXT")
    private String notiz;

    @Column(name = "erstellt_am")
    private LocalDateTime erstelltAm;

    @PrePersist
    protected void onCreate() {
        if (erstelltAm == null) {
            erstelltAm = LocalDateTime.now();
        }
    }
}
