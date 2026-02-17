// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod backup;
mod version;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        tauri_plugin_sql::Migration {
            version: 1,
            description: "initial_schema",
            sql: "
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255) NOT NULL,
                    role ENUM('Doctor', 'Secretary') NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS patients (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    patient_id VARCHAR(50) UNIQUE NOT NULL,
                    full_name VARCHAR(255) NOT NULL,
                    gender ENUM('Male', 'Female', 'Other') NOT NULL,
                    dob DATE NOT NULL,
                    nationality VARCHAR(100),
                    cni VARCHAR(100),
                    age INT,
                    weight FLOAT,
                    height FLOAT,
                    phone VARCHAR(50),
                    email VARCHAR(255),
                    address TEXT,
                    ref_doctor VARCHAR(255),
                    insurance VARCHAR(255),
                    insurance_policy VARCHAR(255),
                    consent BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS emergency_contacts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    patient_db_id INT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    relationship VARCHAR(100),
                    phone VARCHAR(50),
                    FOREIGN KEY (patient_db_id) REFERENCES patients(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS risk_factors (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    patient_db_id INT NOT NULL,
                    factor_label VARCHAR(255) NOT NULL,
                    FOREIGN KEY (patient_db_id) REFERENCES patients(id) ON DELETE CASCADE
                );

                -- Insert initial doctor if not exists
                INSERT IGNORE INTO users (username, password_hash, full_name, role) 
                VALUES ('admin', 'password123', 'Dr. Cyrille Mbida', 'Doctor');
            ",
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
        tauri_plugin_sql::Migration {
            version: 2,
            description: "consultation_modules",
            sql: "
                CREATE TABLE IF NOT EXISTS consultations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    patient_db_id INT NOT NULL,
                    doctor_db_id INT NOT NULL,
                    reason TEXT,
                    status ENUM('In Progress', 'Completed', 'Cancelled') DEFAULT 'In Progress',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (patient_db_id) REFERENCES patients(id) ON DELETE CASCADE,
                    FOREIGN KEY (doctor_db_id) REFERENCES users(id)
                );

                CREATE TABLE IF NOT EXISTS clinical_exams (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    consultation_id INT NOT NULL,
                    bp_sys INT,
                    bp_dia INT,
                    heart_rate INT,
                    weight FLOAT,
                    height FLOAT,
                    temp FLOAT,
                    spo2 INT,
                    bmi FLOAT,
                    notes TEXT,
                    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS diagnostic_results (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    consultation_id INT NOT NULL,
                    primary_diagnosis VARCHAR(255),
                    secondary_diagnoses TEXT,
                    nyha_class VARCHAR(50),
                    notes TEXT,
                    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS ecg_ett_exams (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    consultation_id INT NOT NULL,
                    ecg_interpretation TEXT,
                    ett_fevg FLOAT,
                    ett_lvedd FLOAT,
                    ett_interpretation TEXT,
                    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS scores (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    consultation_id INT NOT NULL,
                    chads_vasc INT,
                    has_bled INT,
                    cv_risk VARCHAR(50),
                    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS prescriptions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    consultation_id INT NOT NULL,
                    drug VARCHAR(255) NOT NULL,
                    dosage VARCHAR(100),
                    frequency VARCHAR(100),
                    duration VARCHAR(100),
                    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
                );
            ",
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
        tauri_plugin_sql::Migration {
            version: 3,
            description: "templates_and_appointments",
            sql: "
                CREATE TABLE IF NOT EXISTS prescription_templates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    label VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS template_medications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    template_id INT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    dosage VARCHAR(100),
                    frequency VARCHAR(100),
                    duration VARCHAR(100),
                    instructions TEXT,
                    FOREIGN KEY (template_id) REFERENCES prescription_templates(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS appointments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    patient_db_id INT NOT NULL,
                    doctor_db_id INT,
                    appointment_date DATE NOT NULL,
                    appointment_time TIME NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    status VARCHAR(50) DEFAULT 'Scheduled',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (patient_db_id) REFERENCES patients(id) ON DELETE CASCADE,
                    FOREIGN KEY (doctor_db_id) REFERENCES users(id) ON DELETE SET NULL
                );
            ",
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
        tauri_plugin_sql::Migration {
            version: 4,
            description: "appointment_refinements",
            sql: "
                ALTER TABLE appointments ADD COLUMN posted_by VARCHAR(50) DEFAULT 'Hospital';
                ALTER TABLE appointments ADD COLUMN created_by_role VARCHAR(50);
            ",
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
        tauri_plugin_sql::Migration {
            version: 5,
            description: "settings_and_user_enhancements",
            sql: "
                -- System Settings table
                CREATE TABLE IF NOT EXISTS system_settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    setting_key VARCHAR(255) UNIQUE NOT NULL,
                    setting_value TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                -- Password Policy table
                CREATE TABLE IF NOT EXISTS password_policy (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    min_length INT DEFAULT 8,
                    require_uppercase BOOLEAN DEFAULT TRUE,
                    require_numbers BOOLEAN DEFAULT TRUE,
                    require_special_chars BOOLEAN DEFAULT TRUE,
                    expiry_days INT DEFAULT 90,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                -- Audit Logs table
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    action VARCHAR(255) NOT NULL,
                    details TEXT,
                    severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
                    ip_address VARCHAR(45),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                -- Roles Permissions table
                CREATE TABLE IF NOT EXISTS roles_permissions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    role VARCHAR(50) NOT NULL,
                    permission VARCHAR(100) NOT NULL,
                    allowed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_role_permission (role, permission)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                -- Backup History table
                CREATE TABLE IF NOT EXISTS backup_history (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    type ENUM('Automatic', 'Manual') NOT NULL,
                    filename VARCHAR(255) NOT NULL,
                    size_mb DECIMAL(10,2),
                    status ENUM('Success', 'Failed') NOT NULL,
                    error_message TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                -- Insert default system settings
                INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES
                ('clinicName', 'CardioMed '),
                ('clinicAddress', 'Yaoundé, Cameroun'),
                ('clinicPhone', '(+237) 6xx-xxx-xxx'),
                ('clinicEmail', 'contact@fce-titus.org'),
                ('timezone', 'Africa/Douala'),
                ('language', 'fr'),
                ('dateFormat', 'DD/MM/YYYY'),
                ('currency', 'XAF');

                -- Insert default password policy
                INSERT IGNORE INTO password_policy (id, min_length, require_uppercase, require_numbers, require_special_chars, expiry_days)
                VALUES (1, 8, TRUE, TRUE, TRUE, 90);

                -- Insert default role permissions
                INSERT IGNORE INTO roles_permissions (role, permission, allowed) VALUES
                ('doctor', 'view_medical', TRUE),
                ('doctor', 'edit_patient', TRUE),
                ('doctor', 'manage_prescriptions', TRUE),
                ('doctor', 'create_consultations', TRUE),
                ('doctor', 'manage_billing', FALSE),
                ('doctor', 'staff_management', FALSE),
                ('doctor', 'view_analytics', TRUE),
                ('secretary', 'view_medical', FALSE),
                ('secretary', 'edit_patient', TRUE),
                ('secretary', 'manage_prescriptions', FALSE),
                ('secretary', 'create_consultations', TRUE),
                ('secretary', 'manage_billing', TRUE),
                ('secretary', 'staff_management', FALSE),
                ('secretary', 'view_analytics', FALSE);
            ",
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
        tauri_plugin_sql::Migration {
            version: 6,
            description: "add_email_to_users",
            sql: "
                -- Add email column to users table (check if exists first)
                SET @dbname = DATABASE();
                SET @tablename = 'users';
                SET @columnname = 'email';
                SET @preparedStatement = (SELECT IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE (table_name = @tablename)
                        AND (table_schema = @dbname)
                        AND (column_name = @columnname)
                    ) > 0,
                    'SELECT 1',
                    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(255);')
                ));
                PREPARE alterIfNotExists FROM @preparedStatement;
                EXECUTE alterIfNotExists;
                DEALLOCATE PREPARE alterIfNotExists;
            ",
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
        tauri_plugin_sql::Migration {
            version: 7,
            description: "app_version_management",
            sql: "
                -- App Versions table for version management
                CREATE TABLE IF NOT EXISTS app_versions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    platform VARCHAR(50) NOT NULL,
                    version VARCHAR(20) NOT NULL,
                    value TEXT,
                    priority BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                -- Insert default version record
                INSERT IGNORE INTO app_versions (id, platform, version, value, priority)
                VALUES (1, 'all', '0.1.0', 'Initial release version', FALSE);
            ",
            kind: tauri_plugin_sql::MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    if cfg!(debug_assertions) {
                       // "mysql://root:51405492fS%40@localhost/cardio_ebogo"
                        "mysql://u111881942_cardio:51405492fSteve%40@82.197.82.156/u111881942_cardio"
                    } else {
                        //"mysql://root:51405492fS%40@localhost/cardio_ebogo"
                        "mysql://u111881942_cardio:51405492fSteve%40@82.197.82.156/u111881942_cardio"
                    },
                    migrations,
                )
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            backup::create_database_backup,
            backup::restore_database_backup,
            backup::list_backup_files,
            backup::delete_backup_file,
            version::get_app_version,
            version::get_app_platform
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
