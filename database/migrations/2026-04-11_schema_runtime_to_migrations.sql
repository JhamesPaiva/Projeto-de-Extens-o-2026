-- Migration: move schema guarantees out of runtime code
-- Date: 2026-04-11
-- Compatível com MySQL padrão (sem extensões exclusivas do MariaDB)
-- e idempotente: pode ser executada mais de uma vez sem erro.

DELIMITER //
DROP PROCEDURE IF EXISTS add_column_if_not_exists //
CREATE PROCEDURE add_column_if_not_exists(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = p_table
          AND column_name = p_column
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN ', p_definition);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

CALL add_column_if_not_exists('users', 'avatar_data', 'avatar_data MEDIUMTEXT NULL');
CALL add_column_if_not_exists('events', 'entrada', 'entrada VARCHAR(20) NULL AFTER formato');

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

CALL add_column_if_not_exists('event_subscriptions', 'status', 'status VARCHAR(32) NOT NULL DEFAULT ''confirmado'' AFTER usuario_id');
CALL add_column_if_not_exists('event_subscriptions', 'payment_reference', 'payment_reference VARCHAR(120) NULL AFTER status');
CALL add_column_if_not_exists('event_subscriptions', 'expires_em', 'expires_em DATETIME NULL AFTER payment_reference');

DROP PROCEDURE IF EXISTS add_column_if_not_exists;