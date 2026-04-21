# Party Manager

Ticketverwaltungssoftware für private Veranstaltungen.
Spring Boot 3.4.1 + Java 21 + PostgreSQL + Vanilla JS (kein npm nötig).

## Schnellstart

### 1. Datenbank anlegen
```sql
CREATE DATABASE partymanager;
```

### 2. application.properties anpassen
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/partymanager
spring.datasource.username=postgres
spring.datasource.password=postgres
jwt.secret=DEIN-EIGENES-SECRET-MINDESTENS-32-ZEICHEN-LANG
veranstaltung.max-teilnehmer=200
```

### 3. Starten
```bash
mvn spring-boot:run
```
Beim ersten Start werden Tabellen angelegt und Admin-Account erstellt.

### 4. Browser öffnen
```
http://localhost:8080
Login: admin / admin
```
> Passwort nach dem ersten Login ändern!

## REST-API

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/change-password` | Passwort ändern |
| GET/POST | `/api/personen` | Personen |
| PUT/DELETE | `/api/personen/{id}` | Person bearbeiten/löschen |
| GET/POST | `/api/tickets` | Tickets (GET: ?search=, ?status=) |
| PATCH | `/api/tickets/{id}/checkin` | Check-in |
| PATCH | `/api/tickets/{id}/stornieren` | Stornieren |
| POST | `/api/kasse/bezahlen` | Bezahlen |
| GET | `/api/kasse/statistik` | Statistiken + Kapazität |
| GET | `/api/kasse/config` | Preise + Verzehr-Konfiguration |

## Ticketnummern
Format: `001`, `002`, `003` ...
Suche in der Kasse: `1`, `01`, `001` finden alle dasselbe Ticket.

## Konfigurierbare Werte (application.properties)
| Key | Standard | Beschreibung |
|-----|----------|--------------|
| `ticket.preis.standard` | 15.00 | Preis Standard-Ticket |
| `ticket.preis.vip` | 35.00 | Preis VIP-Ticket |
| `ticket.preis.ermaessigt` | 8.00 | Preis Ermäßigt-Ticket |
| `kasse.verzehr.enabled` | true | Verzehrgebühr aktiv? |
| `kasse.verzehr.preis` | 5.00 | Preis Verzehrgebühr |
| `veranstaltung.max-teilnehmer` | 200 | Maximale Teilnehmerzahl |
| `jwt.expiration-hours` | 8 | Token-Gültigkeit in Stunden |
