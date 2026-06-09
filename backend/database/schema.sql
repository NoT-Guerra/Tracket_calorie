CREATE DATABASE IF NOT EXISTS calorie_tracker;
USE calorie_tracker;

CREATE TABLE IF NOT EXISTS utenti (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  obiettivo_calorie INT DEFAULT 2000,
  obiettivo_proteine DECIMAL(5,1) DEFAULT 50.0,
  obiettivo_carboidrati DECIMAL(5,1) DEFAULT 250.0,
  obiettivo_grassi DECIMAL(5,1) DEFAULT 65.0,
  obiettivo_fibre DECIMAL(5,1) DEFAULT 25.0
);

CREATE TABLE IF NOT EXISTS alimenti (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  marca VARCHAR(100) DEFAULT '',
  foto_url VARCHAR(500) DEFAULT '',
  calorie_100g SMALLINT NOT NULL,
  proteine_100g DECIMAL(4,1) NOT NULL,
  carboidrati_100g DECIMAL(4,1) NOT NULL,
  grassi_100g DECIMAL(4,1) NOT NULL,
  fibra_100g DECIMAL(4,1) DEFAULT 0,
  creato_da_utente BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS condimenti (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(50) NOT NULL,
  calorie_100g SMALLINT NOT NULL,
  proteine_100g DECIMAL(4,1) DEFAULT 0,
  carboidrati_100g DECIMAL(4,1) DEFAULT 0,
  grassi_100g DECIMAL(4,1) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pasti (
  id INT PRIMARY KEY AUTO_INCREMENT,
  utente_id INT NOT NULL,
  data DATE NOT NULL,
  tipo ENUM('colazione','pranzo','cena','spuntino') NOT NULL,
  FOREIGN KEY (utente_id) REFERENCES utenti(id)
);

CREATE TABLE IF NOT EXISTS pasto_alimenti (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pasto_id INT NOT NULL,
  alimento_id INT NOT NULL,
  quantita_cruda_g SMALLINT NOT NULL COMMENT 'grammi peso crudo',
  cottura VARCHAR(20) DEFAULT 'crudo',
  condimento_id INT NULL,
  quantita_condimento_g SMALLINT NULL,
  condimento_scolato BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (pasto_id) REFERENCES pasti(id) ON DELETE CASCADE,
  FOREIGN KEY (alimento_id) REFERENCES alimenti(id),
  FOREIGN KEY (condimento_id) REFERENCES condimenti(id)
);

-- Popolamento condimenti base
INSERT INTO condimenti (nome, calorie_100g, proteine_100g, carboidrati_100g, grassi_100g) VALUES
('Olio Extravergine d''Oliva', 899, 0, 0, 99.9),
('Olio di Semi di Girasole', 899, 0, 0, 99.9),
('Burro', 717, 0.8, 0.1, 81.1),
ON DUPLICATE KEY UPDATE id=id;

-- Popolamento utente base per test (ID 1)
INSERT INTO utenti (id, username, obiettivo_calorie, obiettivo_proteine, obiettivo_carboidrati, obiettivo_grassi, obiettivo_fibre) VALUES
(1, 'UtenteTest', 2000, 100, 200, 60, 30)
ON DUPLICATE KEY UPDATE username='UtenteTest';
