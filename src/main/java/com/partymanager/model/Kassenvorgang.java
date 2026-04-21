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
@Table(name = "kassenvorgaenge")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Kassenvorgang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ticket_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Ticket ticket;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal betrag;

    @Column(name = "verzehr_gebuehr", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal verzehrGebuehr = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal gesamtbetrag;

    @Column(length = 50)
    @Builder.Default
    private String zahlungsart = "BAR";

    @Column
    private LocalDateTime zeitpunkt;

    @PrePersist
    protected void onCreate() {
        if (zeitpunkt == null) zeitpunkt = LocalDateTime.now();
    }
}
