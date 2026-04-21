CREATE TABLE IF NOT EXISTS users (
                                     id         BIGSERIAL PRIMARY KEY,
                                     username   VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS personen (
                                        id          BIGSERIAL PRIMARY KEY,
                                        vorname     VARCHAR(100) NOT NULL,
    nachname    VARCHAR(100) NOT NULL,
    email       VARCHAR(255),
    telefon     VARCHAR(50),
    notiz       TEXT,
    erstellt_am TIMESTAMP DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS tickets (
                                       id              BIGSERIAL PRIMARY KEY,
                                       ticket_nummer   VARCHAR(50)    NOT NULL UNIQUE,
    person_id       BIGINT REFERENCES personen(id) ON DELETE SET NULL,
    ticket_typ      VARCHAR(50)    NOT NULL,
    preis           NUMERIC(10,2)  NOT NULL,
    zahlungsstatus  VARCHAR(50)    NOT NULL DEFAULT 'RESERVIERT',
    zahlungsart     VARCHAR(50),
    eingecheckt     BOOLEAN        DEFAULT FALSE,
    verzehr         BOOLEAN        DEFAULT FALSE,
    verzehr_preis   NUMERIC(10,2)  DEFAULT 0.00,
    erstellt_am     TIMESTAMP      DEFAULT NOW(),
    aktualisiert_am TIMESTAMP      DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS kassenvorgaenge (
                                               id              BIGSERIAL PRIMARY KEY,
                                               ticket_id       BIGINT REFERENCES tickets(id) ON DELETE SET NULL,
    betrag          NUMERIC(10,2)  NOT NULL,
    verzehr_gebuehr NUMERIC(10,2)  DEFAULT 0.00,
    gesamtbetrag    NUMERIC(10,2)  NOT NULL,
    zahlungsart     VARCHAR(50)    DEFAULT 'BAR',
    zeitpunkt       TIMESTAMP      DEFAULT NOW()
    );