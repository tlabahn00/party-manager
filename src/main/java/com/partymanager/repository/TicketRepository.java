package com.partymanager.repository;

import com.partymanager.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketNummer(String ticketNummer);

    List<Ticket> findByZahlungsstatus(String zahlungsstatus);

    List<Ticket> findByPersonId(Long personId);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.zahlungsstatus = :status")
    long countByZahlungsstatus(@Param("status") String status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.eingecheckt = true")
    long countEingecheckt();

    @Query("SELECT t FROM Ticket t LEFT JOIN t.person p WHERE " +
            "t.ticketNummer LIKE CONCAT('%', :q, '%') OR " +
            "LOWER(COALESCE(p.vorname,'')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(COALESCE(p.nachname,'')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(CONCAT(COALESCE(p.vorname,''), ' ', COALESCE(p.nachname,''))) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Ticket> searchTickets(@Param("q") String query);

    @Query(value = "SELECT COALESCE(MAX(CAST(ticket_nummer AS INTEGER)), 0) FROM tickets WHERE ticket_nummer ~ '^[0-9]+$'",
            nativeQuery = true)
    Optional<Long> findMaxSequenceNumber();
}