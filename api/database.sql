CREATE DATABASE IF NOT EXISTS ministerio_db;
USE ministerio_db;

CREATE TABLE IF NOT EXISTS hermanos (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    localidad VARCHAR(100),
    grupo_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS familias (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    localidad VARCHAR(100),
    hermano_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grupos (
    id INT PRIMARY KEY,
    hermanos TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);