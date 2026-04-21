package com.partymanager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_nummer", nullable = false, unique = true, length = 50)
    private String ticketNummer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "person_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Person person;

    @Column(name = "ticket_typ", nullable = false, length = 50)
    private String ticketTyp;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preis;

    /**
     * RESERVIERT  = noch nicht bezahlt, Zahlung erfolgt an der Kasse
     * BEZAHLT     = bereits vorab bezahlt (PayPal, Überweisung, Bar)
     * STORNIERT   = storniert
     */
    @Column(name = "zahlungsstatus", nullable = false, length = 50)
    @Builder.Default
    private String zahlungsstatus = "RESERVIERT";

    /**
     * Wie wurde bezahlt: BAR, KARTE, PAYPAL, ÜBERWEISUNG — null wenn noch RESERVIERT
     */
    @Column(name = "zahlungsart", length = 50)
    private String zahlungsart;

    /**
     * true = Person wurde an der Kasse abgehakt / eingecheckt
     */
    @Column
    @Builder.Default
    private Boolean eingecheckt = false;

    @Column
    @Builder.Default
    private Boolean verzehr = false;

    @Column(name = "verzehr_preis", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal verzehrPreis = BigDecimal.ZERO;

    @Column(name = "erstellt_am")
    private LocalDateTime erstelltAm;

    @Column(name = "aktualisiert_am")
    private LocalDateTime aktualisiertAm;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (erstelltAm == null) erstelltAm = now;
        aktualisiertAm = now;
    }

    @PreUpdate
    protected void onUpdate() {
        aktualisiertAm = LocalDateTime.now();
    }
}