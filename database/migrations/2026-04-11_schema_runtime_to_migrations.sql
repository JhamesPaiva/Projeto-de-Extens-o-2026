-- Migration: move schema guarantees out of runtime code
-- Date: 2026-04-11

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_data MEDIUMTEXT NULL;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS entrada VARCHAR(20) NULL AFTER formato;

ALTER TABLE events
  MODIFY COLUMN imagem_url MEDIUMTEXT NULL;

CREATE TABLE IF NOT EXISTS event_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NOT NULL,
  usuario_id INT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'confirmado',
  payment_reference VARCHAR(120) NULL,
  expires_em DATETIME NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_evento_usuario (evento_id, usuario_id),
  CONSTRAINT fk_sub_evento FOREIGN KEY (evento_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_usuario FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE event_subscriptions
  ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'confirmado' AFTER usuario_id,
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(120) NULL AFTER status,
  ADD COLUMN IF NOT EXISTS expires_em DATETIME NULL AFTER payment_reference;
