-- SmartFoodAid / food-waste-system-2 schema
-- Reverse-engineered from backend/controllers SQL queries.

CREATE DATABASE IF NOT EXISTS food_waste_system
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE food_waste_system;

-- ── roles ──
CREATE TABLE roles (
  role_id   INT PRIMARY KEY,
  role_name VARCHAR(20) NOT NULL UNIQUE
);

INSERT INTO roles (role_id, role_name) VALUES
  (1, 'ADMIN'),
  (2, 'PROVIDER'),
  (3, 'CHARITY'),
  (4, 'VOLUNTEER');

-- ── users ──
CREATE TABLE users (
  user_id         INT AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(150) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  phone           VARCHAR(30) NULL,
  role_id         INT NOT NULL,
  status          ENUM('PENDING','ACTIVE','SUSPENDED') NOT NULL DEFAULT 'PENDING',
  capacity_status ENUM('ACCEPTING','FULL') NOT NULL DEFAULT 'ACCEPTING',
  average_rating  DECIMAL(3,2) NOT NULL DEFAULT 0,
  rating_count    INT NOT NULL DEFAULT 0,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- ── food_listings ──
CREATE TABLE food_listings (
  listing_id         INT AUTO_INCREMENT PRIMARY KEY,
  provider_id        INT NOT NULL,
  title              VARCHAR(200) NOT NULL,
  description         TEXT NULL,
  total_quantity     INT NOT NULL,
  remaining_quantity INT NOT NULL,
  expiry_date        DATETIME NOT NULL,
  pickup_location    POINT NOT NULL,
  status             ENUM('AVAILABLE','PARTIAL','COMPLETED','EXPIRED') NOT NULL DEFAULT 'AVAILABLE',
  is_deleted         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES users(user_id)
);

-- ── requests ──
CREATE TABLE requests (
  request_id         INT AUTO_INCREMENT PRIMARY KEY,
  listing_id         INT NOT NULL,
  charity_id         INT NOT NULL,
  requested_quantity INT NOT NULL,
  charity_location   POINT NULL,
  status             ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  tracking_status    ENUM('WAITING','ON_THE_WAY','DELIVERED') NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES food_listings(listing_id),
  FOREIGN KEY (charity_id) REFERENCES users(user_id)
);

-- ── deliveries ──
CREATE TABLE deliveries (
  delivery_id                 INT AUTO_INCREMENT PRIMARY KEY,
  request_id                  INT NOT NULL,
  volunteer_id                INT NOT NULL,
  status                      ENUM('ASSIGNED','PICKED_UP','DELIVERED','FAILED') NOT NULL DEFAULT 'ASSIGNED',
  pickup_time                 DATETIME NULL,
  delivery_time                DATETIME NULL,
  volunteer_current_location  POINT NULL,
  current_lat                 DECIMAL(10,7) NULL,
  current_lng                 DECIMAL(10,7) NULL,
  notify_pickup_approaching   TINYINT(1) NOT NULL DEFAULT 0,
  notify_delivery_approaching TINYINT(1) NOT NULL DEFAULT 0,
  created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(request_id),
  FOREIGN KEY (volunteer_id) REFERENCES users(user_id)
);

-- ── ratings ──
CREATE TABLE ratings (
  rating_id      INT AUTO_INCREMENT PRIMARY KEY,
  delivery_id    INT NOT NULL,
  rated_user_id  INT NOT NULL,
  rater_user_id  INT NOT NULL,
  rating         TINYINT NOT NULL,
  comment        TEXT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(delivery_id),
  FOREIGN KEY (rated_user_id) REFERENCES users(user_id),
  FOREIGN KEY (rater_user_id) REFERENCES users(user_id)
);

-- ── notifications ──
CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  message         TEXT NOT NULL,
  type            VARCHAR(30) NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ── logs ──
CREATE TABLE logs (
  log_id      INT AUTO_INCREMENT PRIMARY KEY,
  actor_id    INT NULL,
  entity_type VARCHAR(30) NOT NULL,
  entity_id   INT NULL,
  action      VARCHAR(30) NOT NULL,
  description TEXT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(user_id)
);

-- ── refresh_tokens ──
CREATE TABLE refresh_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(500) NOT NULL,
  revoked    TINYINT(1) NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ── password_resets ──
CREATE TABLE password_resets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(150) NOT NULL,
  token      VARCHAR(255) NOT NULL,
  used       TINYINT(1) NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Seed: first admin (login can't self-register as admin, so seed one) ──
-- email: admin@smartfoodaid.local  password: Admin123!
INSERT INTO users (full_name, email, password_hash, phone, role_id, status)
VALUES (
  'System Admin',
  'admin@smartfoodaid.local',
  '$2b$12$X00sQmeELYQtG6idKF3ZbulmBaQu3ODOE8HoLNpSypiIOxC4dFAhO',
  NULL,
  1,
  'ACTIVE'
);
