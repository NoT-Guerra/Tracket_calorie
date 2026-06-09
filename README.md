# Tracker Calorie e Nutrienti

Applicazione Web per il tracciamento giornaliero di calorie e macronutrienti, con supporto per metodi di cottura, calcolo accurato dell'assorbimento dei grassi (es. frittura/padella) e esportazione del diario in PDF.

## Struttura del Progetto

Il progetto è diviso in due parti principali:
- `/frontend`: Applicazione React creata con Vite, che si occupa della UI.
- `/backend`: API REST in Node.js con Express, che interagisce con un database MariaDB.

## Prerequisiti

Per eseguire questo progetto localmente o su un server, avrai bisogno di:
- Node.js (v16+)
- MariaDB / MySQL
- npm o yarn

## Setup Iniziale

### 1. Database

1. Avvia il tuo server MariaDB locale (es. XAMPP, o server standalone).
2. Crea un database chiamato `calorie_tracker` se non è già presente, oppure importa il file `/backend/database/schema.sql` direttamente nel tuo client SQL preferito (phpMyAdmin, DBeaver, ecc.).
   
   Lo script `schema.sql` creerà in automatico le tabelle richieste e inserirà un set predefinito di **condimenti** e un utente di test con ID 1.

### 2. Backend Configurazione e Avvio

1. Entra nella directory del backend:
   ```bash
   cd backend
   ```
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Configura le credenziali del database aprendo il file `backend/database/db.js` e modificando `user`, `password` e `database` secondo la tua configurazione locale.
4. Avvia il server in modalità sviluppo:
   ```bash
   npm run dev
   ```
   Il server partirà su `http://localhost:3001`.

### 3. Popolamento Dati (Seed)

Per rendere l'applicazione utilizzabile offline, popoleremo il database con un file CSV di Open Food Facts e alcuni alimenti base.

1. Scarica il dump di Open Food Facts (file CSV) per l'Italia da `https://it.openfoodfacts.org/data` e posiziona il file rinominato come `openfoodfacts-products.csv` dentro la cartella `backend/`.
2. Assicurati che il file `alimenti_base.json` sia presente nella stessa cartella.
3. Esegui lo script di seed:
   ```bash
   npm run seed
   ```
   Lo script leggerà il file JSON per i cibi non confezionati e le prime migliaia di righe valide dal CSV, inserendole in MariaDB.

### 4. Frontend Configurazione e Avvio

1. Apri un nuovo terminale ed entra nella directory frontend:
   ```bash
   cd frontend
   ```
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Avvia il server di sviluppo React:
   ```bash
   npm run dev
   ```
   L'applicazione sarà raggiungibile (tipicamente) su `http://localhost:5173`. Il frontend è già configurato per fare il proxy delle richieste API verso `localhost:3001`.

---

## Deploy su Altervista

Hai menzionato di voler caricare il progetto su GitHub e poi hostarlo su Altervista. 

> **ATTENZIONE**: Altervista, nei suoi piani base (Hosting classico), supporta solo l'esecuzione di script **PHP** e fornisce un database MySQL/MariaDB. **Non supporta l'esecuzione nativa di applicazioni Node.js (Express)**.

Hai quindi le seguenti opzioni per l'hosting:

### Opzione 1: Frontend su Altervista, Backend su servizio esterno (es. Render, Heroku)
Questa è la strada consigliata se vuoi mantenere il backend Node.js intatto.
1. Carica il backend (Node.js) su una piattaforma gratuita come Render.com, Fly.io, o Heroku. Dovrai usare un database MySQL remoto (es. PlanetScale, Aiven, o lo stesso DB di Altervista se sblocchi la "Server to Server connection").
2. Nel frontend, fai la **build** per produzione:
   ```bash
   cd frontend
   npm run build
   ```
3. All'interno della cartella `frontend/dist` troverai i file statici compilati (HTML, CSS, JS). 
4. Carica l'intero contenuto della cartella `dist` tramite FTP sul tuo spazio web di Altervista (nella directory principale `htdocs`).
5. Ricorda di aggiornare nel frontend (o tramite Variabili d'Ambiente in fase di build) l'URL base di Axios per puntare al nuovo server backend (es. `https://tuo-backend.render.com/api`).

### Opzione 2: Riscrivere il backend in PHP
Se **devi** hostare l'intera applicazione solo su Altervista, potrai utilizzare il frontend React (compilandolo come al punto precedente), ma dovrai riscrivere le API del backend (i file in `backend/routes/api.js` e la generazione del PDF) usando **PHP**. Le query al database MariaDB rimarranno identiche, cambierà solo il linguaggio del server.

---

## Struttura Database Principale

- `utenti`: Informazioni utente e obiettivi di macronutrienti giornalieri.
- `alimenti`: Database globale dei cibi (da OFF e creati dall'utente). I valori sono sempre calcolati su **100g a crudo**.
- `condimenti`: Grassi/oli aggiuntivi calcolati nelle preparazioni in padella/fritte.
- `pasti`: Raggruppamento per data e tipo (Colazione, Pranzo, Cena, Spuntino).
- `pasto_alimenti`: Tabella ponte che registra i grammi consumati (crudi), la cottura, ed eventuali condimenti usati (compreso lo scolo al 40%).
