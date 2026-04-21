package com.partymanager.controller;

import com.partymanager.model.Person;
import com.partymanager.service.PersonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/personen")
public class PersonController {

    @Autowired
    private PersonService personService;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String search) {
        try {
            List<Person> personen = (search != null && !search.isBlank())
                    ? personService.search(search)
                    : personService.findAll();
            return ResponseEntity.ok(personen);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage(), "status", 500));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(personService.findById(id));
        } catch (Exception e) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", e.getMessage(), "status", 404));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Person person) {
        try {
            return ResponseEntity.ok(personService.create(person));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage(), "status", 400));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Person person) {
        try {
            return ResponseEntity.ok(personService.update(id, person));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage(), "status", 400));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            personService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Person gelöscht"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage(), "status", 400));
        }
    }
}
