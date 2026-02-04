---
trigger: always_on
---

please base on nthis information please create a complete descktop app for this base on allthe context i will provide :

FULL CURSOR MASTER PRD

Project: CARDIO-EBOGO

Organization: CardioMed 

Type: Secure Web Medical Cardiology Software

GLOBAL PRODUCT GOAL
Build a secure web application for private cardiology clinics to:

✅ Manage patients ✅ Conduct structured cardiology consultations ✅ Automatically compute clinical scores ✅ Generate smart prescriptions ✅ Archive ECG & ETT exams ✅ Secure medical data

Accessible on:

• Desktop • Tablet

USER ROLES
Doctor

Full medical access

Consultations

Scores

Prescriptions

ECG/ETT

Secretary

Patient creation

Appointments

Administrative data only

MODULE 1 — PATIENT MANAGEMENT
Purpose

Centralized electronic medical records.

Features

Patient Profile

Fields:

ID

Full name

Gender

Date of birth

Contact info

Address

Medical history

Risk factors

Functions

Create patient

Edit patient

Search patient

Archive patient

View consultation history

UX

Simple form

Fast search bar

Patient list table

Security

Only doctor sees medical data

Secretary limited access

MODULE 2 — CONSULTATION MODULE
Purpose

Guide doctor through a structured cardiology consultation.

Steps Flow

Interrogatoire

Clinical Examination

ECG

ETT

Scores

Diagnosis

Treatment

Interrogatoire
Inputs:

Symptoms

Past illnesses

Family history

Lifestyle

Clinical Examination
Inputs:

Blood pressure

Heart rate

Weight

Physical notes

ECG Section
Upload ECG file/image

Add interpretation

ETT Section
Upload echocardiography files

Enter key measures

Scores Section
Auto-calculated (see Scores Engine)

Diagnosis
Free text

Predefined diagnosis list

Treatment
Links to Prescription Module

MODULE 3 — SCORES ENGINE
Purpose

Automatically calculate cardiology risk scores.

Supported Scores

ScoreDescriptionCHA₂DS₂-VAScStroke riskHAS-BLEDBleeding riskSCORE CVCardiovascular riskNYHAHeart failure class

Behavior

Inputs taken from consultation data

Real-time calculation

Display risk level

Save in patient record

UX

Visual color indicators (low/medium/high risk)

MODULE 4 — PRESCRIPTION SYSTEM
Purpose

Generate intelligent medical prescriptions.

Features

Prescription Screen

Includes:

Patient info

Diagnosis

Suggested treatment templates

Editable fields

Smart Templates

For:

Hypertension (HTA)

Atrial fibrillation (FA)

Heart failure (IC)

Coronary disease

Functions

Create prescription

Edit

Save

Export PDF/Word

MODULE 5 — ECG & ETT ARCHIVE
Purpose

Secure storage of cardiology exams.

ECG Archive

Upload images/files

Link to consultation

View history

ETT Archive

Upload echo reports/images

Store measurements

Features

Secure storage

Fast retrieval

Filter by patient/date

MODULE 6 — SECURITY & AUTHENTICATION
Purpose

Protect medical data.

Authentication

Username/password login

Encrypted passwords

Session expiration

Authorization

Role-based access:

FeatureDoctorSecretaryPatient medical data✅❌Consultations✅❌Scores✅❌Prescriptions✅❌Patient creation✅✅

Data Security

Encrypted database

HTTPS only

Daily backups

DATA STRUCTURE (HIGH LEVEL)
Main Tables

users

patients

consultations

clinical_exams

ecg_files

ett_files

scores

prescriptions

appointments

PERFORMANCE REQUIREMENTS
Page load < 3 seconds

Upload stability

Real-time dashboard updates

COMPLIANCE & PRIVACY
Medical confidentiality

Secure access

Data backups

USER FLOWS
Doctor Flow

Login → Dashboard → Select patient → New consultation → Interrogatoire → Exam → ECG → ETT → Scores → Diagnosis → Prescription → Export

Secretary Flow

Login → Dashboard → Create patient → Schedule RDV

FUTURE EXTENSIONS
(Optional)

Billing & invoices (using tariff grid)

SMS reminders

Telemedicine

Analytics

DEFINITION OF DONE
The system is complete when:

✅ All modules functional ✅ Secure login ✅ PDF exports work ✅ Scores auto-calc correctly ✅ ECG/ETT stored securely

CAHIER DES CHARGES OFFICIEL LOGICIEL DE CARDIOLOGIE CardioMed  Nom du logiciel : CARDIO-EBOGO Structure : CardioMed  Spécialité : Cardiologie OBJECTIF GÉNÉRAL Développer un logiciel médical sécurisé permettant la gestion complète des consultations cardiologiques : dossier patient, consultation structurée, scores cardiologiques automatiques, ordonnances, ECG, ETT et comptes rendus. MODULES FONCTIONNELS 1. Authentification sécurisée et gestion des utilisateurs 2. Dossier patient informatisé 3. Consultation cardiologique guidée 4. Scores cardiologiques automatiques (CHA2DS2-VASc, HAS-BLED, SCORE CV, NYHA) 5. Ordonnances intelligentes 6. Génération automatique de documents PDF/Word 7. Archivage ECG et ETT CONTRAINTES TECHNIQUES - Application web sécurisée - Base de données chiffrée - Utilisation PC et tablette - Sauvegarde automatique LIVRABLES ATTENDUS - Application fonctionnelle - Code source - Documentation utilisateur

please usea more moderne and simple color

please alswas use reusable component and please make every this moderne 


PLEASE LET THE APP BE HEADER LIKE THAT OF DESKTOP WITH A CUSTOMIZE TOOL BAR PLEASE WE ARE BUILDING A DESCKTOP APP