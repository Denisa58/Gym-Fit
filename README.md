# GymFit

Aplicație web completă pentru managementul unei săli de fitness, destinată eficientizării rezervărilor, gestionării abonamentelor și administrării activităților în timp real.

## Functionalități Principale

- **Membri (Users):**
  - Creare cont și personalizare profil (ex. poză de profil).
  - Vizualizare sesiuni active de antrenament în timp real (aerobic, karate etc.).
  - Înscriere la clase în limita locurilor disponibile, cu afișarea locurilor libere/ocupate.
  - Eliminare automată a sesiunilor expirate de pe pagina principală odată ce data și ora de start au trecut.
  - Alegere abonament personalizat (în funcție de zile, intervale orare sau echipamente accesibile) și urmărire zile rămase direct din profil.
- **Antrenori (Trainers):**
  - Creare și adăugare de noi sesiuni de antrenament vizibile pe pagina principală.
- **Administratori (Admins):**
  - Adăugare de noi antrenori și săli de antrenament.
  - Creare și gestionare antrenamente și abonamente.
  - Monitorizare și evidență completă a utilizatorilor înscriși.

## Tehnologii Utilizate

- **Backend:** C# (.NET / OData)
- **Frontend:** React, TypeScript
- **Bază de Date:** PostgreSQL
- **Tooling:** Git, GitHub
