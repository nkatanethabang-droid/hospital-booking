-- ============================================
-- HOSPITAL APPOINTMENT BOOKING SYSTEM
-- Database: hospital_booking
-- DBMS: MySQL
-- ============================================

CREATE DATABASE IF NOT EXISTS hospital_booking;

USE hospital_booking;

-- ============================================
-- 1. USERS TABLE
-- Stores patient and administrator accounts
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    role ENUM('patient', 'admin') DEFAULT 'patient',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. PATIENTS TABLE
-- Stores additional patient information
-- ============================================

CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    date_of_birth DATE,
    gender VARCHAR(30),
    address VARCHAR(255),

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- ============================================
-- 3. DEPARTMENTS TABLE
-- Stores hospital departments
-- ============================================

CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- ============================================
-- 4. DOCTORS TABLE
-- Stores doctor information
-- ============================================

CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    specialty VARCHAR(120) NOT NULL,
    department_id INT,
    bio TEXT,
    email VARCHAR(160),
    phone VARCHAR(30),
    consultation_fee DECIMAL(10,2) DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE SET NULL
);

-- ============================================
-- 5. DOCTOR AVAILABILITY TABLE
-- Stores available appointment schedules
-- ============================================

CREATE TABLE IF NOT EXISTS doctor_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_minutes INT DEFAULT 30,
    is_available BOOLEAN DEFAULT TRUE,

    UNIQUE KEY unique_doctor_schedule
    (doctor_id, available_date, start_time, end_time),

    FOREIGN KEY (doctor_id)
    REFERENCES doctors(id)
    ON DELETE CASCADE
);

-- ============================================
-- 6. APPOINTMENTS TABLE
-- Stores patient appointment bookings
-- ============================================

CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    availability_id INT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason VARCHAR(500),

    status ENUM(
        'pending',
        'confirmed',
        'cancelled',
        'completed',
        'rejected'
    ) DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id)
    REFERENCES users(id),

    FOREIGN KEY (doctor_id)
    REFERENCES doctors(id),

    FOREIGN KEY (availability_id)
    REFERENCES doctor_availability(id)
    ON DELETE SET NULL,

    INDEX idx_doctor_slot
    (doctor_id, appointment_date, appointment_time),

    INDEX idx_patient_appointments
    (patient_id, appointment_date)
);

-- ============================================
-- 7. NOTIFICATIONS TABLE
-- Stores patient notifications
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- ============================================
-- INSERT HOSPITAL DEPARTMENTS
-- ============================================

INSERT IGNORE INTO departments (id, name, description)
VALUES
(1, 'Cardiology', 'Heart and blood vessel treatment'),
(2, 'Paediatrics', 'Healthcare for children'),
(3, 'Dermatology', 'Skin, hair and nail treatment'),
(4, 'General Medicine', 'General health consultations'),
(5, 'Orthopaedics', 'Bone, joint and muscle treatment'),
(6, 'Dentistry', 'Dental care and treatment'),
(7, 'Neurology', 'Brain and nervous system treatment');

-- ============================================
-- INSERT SAMPLE DOCTORS
-- ============================================

INSERT INTO doctors
(full_name, specialty, department_id, bio, email, phone, consultation_fee)
VALUES
('Dr. Naledi Mokoena', 'Cardiologist', 1,
'Specialist in heart health and preventive care.',
'naledi.mokoena@hospital.test', '58000001', 350.00),

('Dr. Thabo Rasebelisoa', 'Paediatrician', 2,
'Specialist in child healthcare.',
'thabo.rasebelisoa@hospital.test', '58000002', 300.00),

('Dr. Lerato Ntoi', 'Dermatologist', 3,
'Specialist in skin conditions and treatment.',
'lerato.ntoi@hospital.test', '58000003', 320.00),

('Dr. Kabelo Phafoli', 'General Practitioner', 4,
'Provides general medical consultations.',
'kabelo.phafoli@hospital.test', '58000004', 250.00),

('Dr. Mpho Tšosane', 'Orthopaedic Surgeon', 5,
'Specialist in bones and joint treatment.',
'mpho.tsosane@hospital.test', '58000005', 400.00),

('Dr. Palesa Mokoena', 'Dentist', 6,
'Provides dental care and oral health services.',
'palesa.mokoena@hospital.test', '58000006', 280.00),

('Dr. Neo Letsie', 'Neurologist', 7,
'Specialist in brain and nervous system conditions.',
'neo.letsie@hospital.test', '58000007', 450.00);

-- ============================================
-- INSERT SAMPLE DOCTOR AVAILABILITY
-- Creates schedules for tomorrow and the
-- following day for all active doctors.
-- ============================================

INSERT IGNORE INTO doctor_availability
(doctor_id, available_date, start_time, end_time, slot_minutes, is_available)

SELECT id, CURDATE() + INTERVAL 1 DAY,
'09:00:00', '13:00:00', 30, TRUE
FROM doctors
WHERE active = TRUE;

INSERT IGNORE INTO doctor_availability
(doctor_id, available_date, start_time, end_time, slot_minutes, is_available)

SELECT id, CURDATE() + INTERVAL 2 DAY,
'14:00:00', '17:00:00', 30, TRUE
FROM doctors
WHERE active = TRUE;

-- ============================================
-- DATABASE CREATION COMPLETED
-- ============================================

SELECT 'Hospital Booking Database Created Successfully!'
AS Database_Status;

-- View all tables
SHOW TABLES;

-- View departments
SELECT * FROM departments;

-- View doctors
SELECT * FROM doctors;

-- View doctor availability
SELECT * FROM doctor_availability;