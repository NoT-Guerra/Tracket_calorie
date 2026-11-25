# Tracker Calorie e Nutrienti

Applicazione Web locale per il tracciamento giornaliero di calorie, macronutrienti e fibre, con supporto per metodi di cottura, calcolo dell'assorbimento dei grassi/condimenti (es. in padella o frittura, con opzione scolo -40%), ricerca integrata con Open Food Facts e generazione del diario in PDF.

## Struttura del Progetto

Il progetto è diviso in due parti:
- `/backend`: API REST in Node.js + Express collegata a un database locale MySQL / MariaDB.
- `/frontend`: Applicazione React + Vite (con supporto PWA e proxy configurato verso il backend locale).

## Prerequisiti

Per eseguire il progetto in locale:
- **Node.js** (v18+ consigliato)
- **MariaDB** o **MySQL** in esecuzione in locale (es. XAMPP, MariaDB standalone, MySQL Server)
- **npm**

---

## Setup Rapido in Locale

### 1. Configurazione Backend e Database

1. Entra nella cartella `backend` e installa le dipendenze:
   ```bash
   cd backend
   npm install
   ```
2. Crea il file `.env` copiando `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Modifica `.env` con le credenziali del tuo database locale (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

3. Inizializza il database e popola gli alimenti base con un unico comando:
   ```bash
   npm run db:init
   ```
   Questo comando esegue in sequenza:
   - `temp_import.js`: crea il database `calorie_tracker`, tutte le tabelle (con vincolo `UNIQUE(nome, marca)` su `alimenti`), i condimenti predefiniti e l'utente iniziale.
   - `seed.js`: importa ~200 alimenti generici italiani (`alimenti_base.json`, basati sui valori nutrizionali CREA per 100g a crudo) e, se presente nella cartella `backend/`, importa anche i prodotti italiani (`countries_tags` contenente `italy`) da `openfoodfacts-products.csv`.

   > **Nota su Open Food Facts**: Non è necessario scaricare il dump CSV da diversi GB. Quando cerchi un prodotto nell'app che non è presente nel DB locale (oppure clicchi su *"Cerca su Open Food Facts"*), il backend interroga automaticamente l'API online di Open Food Facts Italia e salva i risultati in cache nel database locale.

4. Avvia il server backend:
   ```bash
   npm run dev
   ```
   Il backend sarà attivo su `http://localhost:3001`.

### 2. Avvio Frontend

1. In un nuovo terminale, entra nella cartella `frontend` e installa le dipendenze:
   ```bash
   cd frontend
   npm install
   ```
2. Avvia il server di sviluppo Vite:
   ```bash
   npm run dev
   ```
3. Apri il browser all'indirizzo `http://localhost:5173`.
   Tutte le chiamate a `/api` e alle immagini caricate in `/public` passano automaticamente dal proxy di Vite.

---

## Funzionalità Principali

- **Diario Giornaliero con Navigazione Date**: scorri tra i giorni precedenti/successivi o seleziona una data dal calendario.
- **Barra di Progresso Completa**: visualizza calorie, proteine, carboidrati, grassi e fibre rispetto agli obiettivi giornalieri.
- **Modifica Quantità ed Eliminazione**: modifica direttamente dal diario i grammi a crudo (e i grammi di condimento) di un alimento già inserito oppure rimuovilo.
- **Gestione Obiettivi e Profili Utente (`/obiettivi`)**: personalizza il fabbisogno giornaliero di calorie, proteine, carboidrati, grassi e fibre, o crea nuovi profili utente selezionabili dalla barra di navigazione.
- **Database Alimenti + Ricerca Open Food Facts**: oltre 195 alimenti base generici pronti all'uso più ricerca e caching automatico da Open Food Facts e creazione di alimenti personalizzati con foto.
- **Esportazione PDF**: scarica il riepilogo giornaliero in PDF con il calcolo condiviso dei macronutrienti (inclusi i condimenti).
