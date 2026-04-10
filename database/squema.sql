CREATE DATABASE IF NOT EXISTS eventocom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eventocom;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    tipo ENUM('pf', 'pj') NOT NULL,
    cpf VARCHAR(20),
    cnpj VARCHAR(20),
    telefone VARCHAR(30),
    cep VARCHAR(20),
    cidade VARCHAR(100),
    estado VARCHAR(50),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizador_id INT NOT NULL,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    data_inicio DATE,
    hora_inicio TIME,
    hora_fim TIME,
    formato ENUM('presencial', 'online', 'híbrido') DEFAULT 'presencial',
    local_nome VARCHAR(200),
    cidade VARCHAR(100),
    estado VARCHAR(50),
    idade VARCHAR(50),
    imagem_url VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizador_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS event_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    tipo VARCHAR(100),
    preco DECIMAL(10,2) DEFAULT 0.00,
    quantidade INT DEFAULT 0,
    gratuito BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (evento_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
