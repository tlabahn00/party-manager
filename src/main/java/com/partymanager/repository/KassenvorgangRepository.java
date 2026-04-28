package com.partymanager.repository;

import com.partymanager.model.Kassenvorgang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface KassenvorgangRepository extends JpaRepository<Kassenvorgang, Long> {

    List<Kassenvorgang> findTop10ByOrderByZeitpunktDesc();

    @Query("SELECT COALESCE(SUM(k.gesamtbetrag), 0) FROM Kassenvorgang k")
    BigDecimal sumGesamtbetrag();

    @Query("SELECT COALESCE(SUM(k.verzehrGebuehr), 0) FROM Kassenvorgang k")
    BigDecimal sumVerzehrGebuehr();

    @Query("SELECT COALESCE(SUM(k.gesamtbetrag), 0) FROM Kassenvorgang k WHERE k.zahlungsart = :zahlungsart")
    BigDecimal sumByZahlungsart(@Param("zahlungsart") String zahlungsart);
}