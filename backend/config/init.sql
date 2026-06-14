-- Animal Shelter Platform Database Schema
CREATE DATABASE IF NOT EXISTS animal_shelter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE animal_shelter;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user', 'shelter_owner') DEFAULT 'user',
  phone VARCHAR(20),
  avatar VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Shelters table
CREATE TABLE IF NOT EXISTS shelters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  address VARCHAR(255),
  city VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(255),
  logo VARCHAR(255),
  capacity INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Animals table
CREATE TABLE IF NOT EXISTS animals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shelter_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  species ENUM('dog', 'cat', 'bird', 'rabbit', 'other') NOT NULL,
  breed VARCHAR(100),
  age_years INT DEFAULT 0,
  age_months INT DEFAULT 0,
  gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown',
  size ENUM('small', 'medium', 'large') DEFAULT 'medium',
  color VARCHAR(100),
  description TEXT,
  health_status TEXT,
  vaccinated BOOLEAN DEFAULT FALSE,
  sterilized BOOLEAN DEFAULT FALSE,
  microchipped BOOLEAN DEFAULT FALSE,
  status ENUM('available', 'pending', 'adopted', 'medical_care', 'reserved') DEFAULT 'available',
  photo VARCHAR(255),
  additional_photos JSON,
  weight DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE CASCADE
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  animal_id INT NOT NULL,
  shelter_id INT NOT NULL,
  type ENUM('adopt', 'foster', 'volunteer', 'donate_supplies') DEFAULT 'adopt',
  status ENUM('pending', 'reviewing', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  message TEXT,
  admin_notes TEXT,
  living_situation VARCHAR(255),
  has_other_pets BOOLEAN DEFAULT FALSE,
  has_children BOOLEAN DEFAULT FALSE,
  experience TEXT,
  contact_preferred ENUM('phone', 'email', 'any') DEFAULT 'any',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
  FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE CASCADE
);

-- News/Posts table
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_id INT NOT NULL,
  shelter_id INT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image VARCHAR(255),
  category ENUM('news', 'success_story', 'event', 'urgent') DEFAULT 'news',
  is_published BOOLEAN DEFAULT TRUE,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE SET NULL
);

-- Messages/Chat AI logs
CREATE TABLE IF NOT EXISTS ai_chats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  session_id VARCHAR(100),
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Donations tracking
CREATE TABLE IF NOT EXISTS donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  shelter_id INT,
  amount DECIMAL(10,2),
  type ENUM('money', 'supplies', 'food', 'medicine') DEFAULT 'money',
  description TEXT,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE CASCADE
);

INSERT INTO users (name, email, password, role) VALUES 
('Адміністратор', 'admin@shelter.ua', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO users (name, email, password, role) VALUES 
('Власник Притулку', 'owner@shelter.ua', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'shelter_owner')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO users (name, email, password, role) VALUES 
('Іван Петренко', 'user@shelter.ua', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user')
ON DUPLICATE KEY UPDATE id=id;
INSERT INTO users (name, email, password, role) 
VALUES (
  'Ваше Імʼя',
  'diana@email.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
);

