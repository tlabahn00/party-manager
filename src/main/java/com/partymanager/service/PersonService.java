package com.partymanager.service;

import com.partymanager.model.Person;
import com.partymanager.repository.PersonRepository;
import com.partymanager.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PersonService {

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private TicketRepository ticketRepository;

    public List<Person> findAll() {
        return personRepository.findAll();
    }

    public Person findById(Long id) {
        return personRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Person nicht gefunden: " + id));
    }

    public Person create(Person person) {
        return personRepository.save(person);
    }

    public Person update(Long id, Person updated) {
        Person existing = findById(id);
        existing.setVorname(updated.getVorname());
        existing.setNachname(updated.getNachname());
        existing.setEmail(updated.getEmail());
        existing.setTelefon(updated.getTelefon());
        existing.setNotiz(updated.getNotiz());
        return personRepository.save(existing);
    }

    public void delete(Long id) {
        personRepository.deleteById(id);
    }

    public List<Person> search(String query) {
        return personRepository.findByVornameContainingIgnoreCaseOrNachnameContainingIgnoreCase(query, query);
    }

    public long countTickets(Long personId) {
        return ticketRepository.findByPersonId(personId).size();
    }
}
