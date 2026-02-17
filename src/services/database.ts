import Database from '@tauri-apps/plugin-sql';

// Remote Connection (Legacy)
const DB_CONNECTION = 'mysql://u111881942_cardio:51405492fSteve%40@82.197.82.156/u111881942_cardio';

// Local Connection
//const DB_CONNECTION = 'mysql://root:51405492fS%40@localhost/cardio_ebogo';

export class DatabaseService {
    private static instance: Database | null = null;

    private static async getDb(): Promise<Database> {
        if (!this.instance) {
            this.instance = await Database.load(DB_CONNECTION);
        }
        return this.instance;
    }

    // User Authentication
    static async login(username: string, password_hash: string): Promise<any> {
        const db = await this.getDb();
        const users = await db.select<any[]>(
            'SELECT * FROM users WHERE username = ? AND password_hash = ?',
            [username, password_hash]
        );
        return users.length > 0 ? users[0] : null;
    }

    static async getUsers(): Promise<any[]> {
        const db = await this.getDb();
        return await db.select<any[]>('SELECT id, full_name, role FROM users');
    }

    // Patient Management
    static async getPatients(): Promise<any[]> {
        const db = await this.getDb();
        return await db.select<any[]>('SELECT * FROM patients ORDER BY created_at DESC');
    }

    static async getPatientById(id: number): Promise<any> {
        const db = await this.getDb();
        const patients = await db.select<any[]>('SELECT * FROM patients WHERE id = ?', [id]);
        if (patients.length === 0) return null;

        const patient = patients[0];
        // Fetch contacts
        patient.emergency_contacts = await db.select<any[]>(
            'SELECT * FROM emergency_contacts WHERE patient_db_id = ?',
            [id]
        );
        // Fetch risk factors
        const factors = await db.select<any[]>(
            'SELECT factor_label FROM risk_factors WHERE patient_db_id = ?',
            [id]
        );
        patient.risk_factors = factors.map(f => f.factor_label);

        return patient;
    }

    static async createPatient(data: any): Promise<number> {
        const db = await this.getDb();
        const result = await db.execute(
            `INSERT INTO patients (
                patient_id, full_name, gender, dob, nationality, cni, 
                age, weight, height, phone, email, address, 
                ref_doctor, insurance, insurance_policy, consent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.patient_id, data.full_name, data.gender, data.dob, data.nationality, data.cni,
                data.age, data.weight, data.height, data.phone, data.email, data.address,
                data.ref_doctor, data.insurance, data.insurance_policy, data.consent ? 1 : 0
            ]
        );

        const patientDbId = result.lastInsertId;
        if (!patientDbId) throw new Error('Failed to insert patient');

        // Add emergency contacts
        if (data.emergency_contacts && data.emergency_contacts.length > 0) {
            for (const contact of data.emergency_contacts) {
                if (contact.name) {
                    await db.execute(
                        'INSERT INTO emergency_contacts (patient_db_id, name, relationship, phone) VALUES (?, ?, ?, ?)',
                        [patientDbId, contact.name, contact.relationship, contact.phone]
                    );
                }
            }
        }

        // Add risk factors
        if (data.risk_factors && data.risk_factors.length > 0) {
            for (const factor of data.risk_factors) {
                await db.execute(
                    'INSERT INTO risk_factors (patient_db_id, factor_label) VALUES (?, ?)',
                    [patientDbId, factor]
                );
            }
        }

        return patientDbId;
    }

    static async updatePatient(id: number, data: any): Promise<void> {
        const db = await this.getDb();

        // Update main patient record
        const updates: string[] = [];
        const values: any[] = [];

        const fields = [
            'full_name', 'gender', 'dob', 'nationality', 'cni',
            'age', 'weight', 'height', 'phone', 'email', 'address',
            'ref_doctor', 'insurance', 'insurance_policy'
        ];

        fields.forEach(field => {
            if (data[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(data[field]);
            }
        });

        if (data.consent !== undefined) {
            updates.push('consent = ?');
            values.push(data.consent ? 1 : 0);
        }

        if (updates.length > 0) {
            values.push(id);

            await db.execute(
                `UPDATE patients SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        // We also need to update related tables (risk factors, emergency contacts)
        // This is complex because we need to handle additions/removals.
        // For simplicity: Delete all and re-insert is often easiest for these small lists.

        // First get DB ID to update related tables
        const dbId = id;

        // Update Risk Factors
        if (data.risk_factors) {
            await db.execute('DELETE FROM risk_factors WHERE patient_db_id = ?', [dbId]);
            for (const factor of data.risk_factors) {
                await db.execute(
                    'INSERT INTO risk_factors (patient_db_id, factor_label) VALUES (?, ?)',
                    [dbId, factor]
                );
            }
        }

        // Update Emergency Contacts
        if (data.emergency_contacts) {
            await db.execute('DELETE FROM emergency_contacts WHERE patient_db_id = ?', [dbId]);
            for (const contact of data.emergency_contacts) {
                if (contact.name) {
                    await db.execute(
                        'INSERT INTO emergency_contacts (patient_db_id, name, relationship, phone) VALUES (?, ?, ?, ?)',
                        [dbId, contact.name, contact.relationship, contact.phone]
                    );
                }
            }
        }
    }

    // Search
    static async searchPatients(query: string): Promise<any[]> {
        const db = await this.getDb();
        const searchPattern = `%${query}%`;
        return await db.select<any[]>(
            'SELECT * FROM patients WHERE full_name LIKE ? OR patient_id LIKE ? OR phone LIKE ?',
            [searchPattern, searchPattern, searchPattern]
        );
    }

    // Consultation Management
    static async createConsultation(data: any): Promise<number> {
        const db = await this.getDb();

        // 1. Insert Consultation
        const consultResult = await db.execute(
            'INSERT INTO consultations (patient_db_id, doctor_db_id, reason, status) VALUES (?, ?, ?, ?)',
            [data.patient_db_id, data.doctor_db_id, data.reason || '', data.status || 'In Progress']
        );
        const consultId = consultResult.lastInsertId;
        if (!consultId) throw new Error('Failed to create consultation');

        // 2. Insert Clinical Exam
        if (data.exam) {
            await db.execute(
                `INSERT INTO clinical_exams (
                    consultation_id, bp_sys, bp_dia, heart_rate, weight, height, temp, spo2, bmi, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    consultId, data.exam.bpSys, data.exam.bpDia, data.exam.heartRate,
                    data.exam.weight, data.exam.height, data.exam.temp, data.exam.spo2,
                    data.exam.bmi, data.exam.notes
                ]
            );
        }

        // 3. Insert ECG/ETT Exam
        if (data.ecg || data.ett) {
            await db.execute(
                `INSERT INTO ecg_ett_exams (
                    consultation_id, ecg_interpretation, ett_fevg, ett_lvedd, ett_interpretation
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    consultId, data.ecg?.interpretation, data.ett?.ef,
                    data.ett?.lvedd, data.ett?.interpretation
                ]
            );
        }

        // 4. Insert Diagnostic Results
        if (data.diagnostic) {
            await db.execute(
                `INSERT INTO diagnostic_results (
                    consultation_id, primary_diagnosis, secondary_diagnoses, nyha_class, notes
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    consultId, data.diagnostic.primaryDiagnosis,
                    JSON.stringify(data.diagnostic.secondaryDiagnoses),
                    data.diagnostic.nyha, data.diagnostic.notes
                ]
            );
        }

        // 5. Insert Scores
        if (data.scores) {
            await db.execute(
                'INSERT INTO scores (consultation_id, chads_vasc, has_bled, cv_risk) VALUES (?, ?, ?, ?)',
                [consultId, data.scores.chadsVasc, data.scores.hasBled, data.scores.cvRisk]
            );
        }

        // 6. Insert Prescriptions
        if (data.prescriptions && data.prescriptions.length > 0) {
            for (const p of data.prescriptions) {
                await db.execute(
                    'INSERT INTO prescriptions (consultation_id, drug, dosage, frequency, duration) VALUES (?, ?, ?, ?, ?)',
                    [consultId, p.drug, p.dosage, p.frequency, p.duration]
                );
            }
        }

        return consultId;
    }

    static async addStandaloneExam(patientDbId: number, type: 'ECG' | 'ETT', data: any): Promise<void> {
        const db = await this.getDb();

        // Create a wrapper consultation
        const consultResult = await db.execute(
            'INSERT INTO consultations (patient_db_id, doctor_db_id, reason, status) VALUES (?, ?, ?, ?)',
            [patientDbId, 1, `Examen Rapide: ${type}`, 'Completed']
        );
        const consultId = consultResult.lastInsertId;

        await db.execute(
            `INSERT INTO ecg_ett_exams (
                consultation_id, ecg_interpretation, ett_fevg, ett_lvedd, ett_interpretation
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                consultId,
                type === 'ECG' ? data.interpretation : null,
                type === 'ETT' ? data.ef : null,
                type === 'ETT' ? data.lvedd : null,
                type === 'ETT' ? data.interpretation : null
            ]
        );
    }

    static async getConsultations(): Promise<any[]> {
        const db = await this.getDb();
        return await db.select<any[]>(`
            SELECT c.*, p.full_name as patient_name, p.patient_id as patient_code, u.full_name as doctor_name
            FROM consultations c
            JOIN patients p ON c.patient_db_id = p.id
            JOIN users u ON c.doctor_db_id = u.id
            ORDER BY c.created_at DESC
        `);
    }

    static async getConsultationsByPatient(patientDbId: number): Promise<any[]> {
        const db = await this.getDb();
        return await db.select<any[]>(`
            SELECT c.id, c.created_at as date, c.reason as type, dr.primary_diagnosis as diagnosis, u.full_name as doctor, c.status
            FROM consultations c
            LEFT JOIN diagnostic_results dr ON c.id = dr.consultation_id
            LEFT JOIN users u ON c.doctor_db_id = u.id
            WHERE c.patient_db_id = ? 
            ORDER BY c.created_at DESC
        `, [patientDbId]);
    }

    static async getExamsByPatient(patientDbId: number): Promise<any[]> {
        const db = await this.getDb();
        return await db.select<any[]>(`
            SELECT e.*, c.created_at as date
            FROM ecg_ett_exams e
            JOIN consultations c ON e.consultation_id = c.id
            WHERE c.patient_db_id = ?
            ORDER BY c.created_at DESC
        `, [patientDbId]);
    }

    static async getAllExams(): Promise<any[]> {
        const db = await this.getDb();
        return await db.select<any[]>(`
            SELECT e.*, c.created_at as date, p.full_name as patient_name, p.patient_id as patient_code
            FROM ecg_ett_exams e
            JOIN consultations c ON e.consultation_id = c.id
            JOIN patients p ON c.patient_db_id = p.id
            ORDER BY c.created_at DESC
        `);
    }

    static async getExamById(examId: number): Promise<any | null> {
        const db = await this.getDb();
        const results = await db.select<any[]>(`
            SELECT e.*, c.created_at as date, u.full_name as doctor_name, c.reason as type_reason
            FROM ecg_ett_exams e
            JOIN consultations c ON e.consultation_id = c.id
            LEFT JOIN users u ON c.doctor_db_id = u.id
            WHERE e.id = ?
        `, [examId]);
        return results.length > 0 ? results[0] : null;
    }

    static async savePrescription(medications: any[], consultationId?: number): Promise<void> {
        const db = await this.getDb();

        for (const med of medications) {
            const fullDuration = med.duration + (med.instructions ? ` | SIG: ${med.instructions}` : '');

            await db.execute(
                'INSERT INTO prescriptions (consultation_id, drug, dosage, frequency, duration) VALUES (?, ?, ?, ?, ?)',
                [consultationId || null, med.name, med.dosage, med.frequency, fullDuration]
            );
        }
    }

    static async getConsultationDetails(id: number): Promise<any> {
        const db = await this.getDb();
        const consultations = await db.select<any[]>(`
            SELECT c.*, p.full_name as patient_name, p.age as patient_age, p.gender as patient_gender, p.nationality as patient_nationality
            FROM consultations c
            JOIN patients p ON c.patient_db_id = p.id
            WHERE c.id = ?
        `, [id]);
        console.log('consultations');
        if (consultations.length === 0) return null;

        const consult = consultations[0];
        consult.clinical_exam = (await db.select<any[]>('SELECT * FROM clinical_exams WHERE consultation_id = ?', [id]))[0];
        consult.ecg_ett = (await db.select<any[]>('SELECT * FROM ecg_ett_exams WHERE consultation_id = ?', [id]))[0];
        consult.diagnostic = (await db.select<any[]>('SELECT * FROM diagnostic_results WHERE consultation_id = ?', [id]))[0];
        consult.scores = (await db.select<any[]>('SELECT * FROM scores WHERE consultation_id = ?', [id]))[0];
        consult.prescriptions = await db.select<any[]>('SELECT * FROM prescriptions WHERE consultation_id = ?', [id]);

        return consult;
    }

    // Prescription Templates Management
    static async getTemplates(): Promise<any[]> {
        const db = await this.getDb();
        const templates = await db.select<any[]>('SELECT * FROM prescription_templates ORDER BY created_at DESC');

        for (const template of templates) {
            template.meds = await db.select<any[]>(
                'SELECT * FROM template_medications WHERE template_id = ?',
                [template.id]
            );
        }
        return templates;
    }

    static async saveTemplate(label: string, meds: any[]): Promise<number> {
        const db = await this.getDb();
        const result = await db.execute(
            'INSERT INTO prescription_templates (label) VALUES (?)',
            [label]
        );
        const templateId = result.lastInsertId;
        if (!templateId) throw new Error('Failed to create template');

        for (const med of meds) {
            await db.execute(
                `INSERT INTO template_medications (
                    template_id, name, dosage, frequency, duration, instructions
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [templateId, med.name, med.dosage, med.frequency, med.duration, med.instructions]
            );
        }
        return templateId;
    }

    static async updateTemplate(id: number, label: string, meds: any[]): Promise<void> {
        const db = await this.getDb();
        await db.execute('UPDATE prescription_templates SET label = ? WHERE id = ?', [label, id]);

        // Simpler to delete and re-insert meds
        await db.execute('DELETE FROM template_medications WHERE template_id = ?', [id]);
        for (const med of meds) {
            await db.execute(
                `INSERT INTO template_medications (
                    template_id, name, dosage, frequency, duration, instructions
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [id, med.name, med.dosage, med.frequency, med.duration, med.instructions]
            );
        }
    }

    static async deleteTemplate(id: number): Promise<void> {
        const db = await this.getDb();
        await db.execute('DELETE FROM template_medications WHERE template_id = ?', [id]);
        await db.execute('DELETE FROM prescription_templates WHERE id = ?', [id]);
    }

    // Appointment Management
    static async getAppointments(date?: string): Promise<any[]> {
        const db = await this.getDb();
        let query = `
            SELECT a.*, p.full_name as patient_name, u.full_name as doctor_name
            FROM appointments a
            JOIN patients p ON a.patient_db_id = p.id
            LEFT JOIN users u ON a.doctor_db_id = u.id
        `;
        const params: any[] = [];
        if (date) {
            query += ' WHERE a.appointment_date = ?';
            params.push(date);
        }
        query += ' ORDER BY a.appointment_time ASC';
        return await db.select<any[]>(query, params);
    }

    static async getAppointmentById(id: number): Promise<any | null> {
        const db = await this.getDb();
        const results = await db.select<any[]>(`
            SELECT a.*, p.full_name as patient_name, u.full_name as doctor_name, p.patient_id as patient_file_id
            FROM appointments a
            JOIN patients p ON a.patient_db_id = p.id
            LEFT JOIN users u ON a.doctor_db_id = u.id
            WHERE a.id = ?
        `, [id]);
        return results.length > 0 ? results[0] : null;
    }

    static async updateAppointmentStatus(id: number, status: string): Promise<void> {
        const db = await this.getDb();
        await db.execute('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
    }

    static async createAppointment(data: {
        patient_db_id: number;
        doctor_db_id?: number;
        appointment_date: string;
        appointment_time: string;
        type: string;
        notes?: string;
        posted_by?: string;
        created_by_role?: string;
    }): Promise<number> {
        const db = await this.getDb();
        const result = await db.execute(
            `INSERT INTO appointments (
                patient_db_id, doctor_db_id, appointment_date, appointment_time, type, notes, posted_by, created_by_role
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.patient_db_id,
                data.doctor_db_id,
                data.appointment_date,
                data.appointment_time,
                data.type,
                data.notes,
                data.posted_by || 'Hospital',
                data.created_by_role || 'Staff'
            ]
        );
        if (!result.lastInsertId) throw new Error('Failed to create appointment');
        return result.lastInsertId;
    }

    static async getPrescriptionsByPatient(patientId: number): Promise<any[]> {
        const db = await this.getDb();
        return await db.select<any[]>(`
            SELECT pr.*, c.created_at as consultation_date
            FROM prescriptions pr
            JOIN consultations c ON pr.consultation_id = c.id
            WHERE c.patient_db_id = ?
            ORDER BY c.created_at DESC
        `, [patientId]);
    }

    static async updatePrescription(data: {
        id: number;
        drug: string;
        dosage: string;
        frequency: string;
        duration: string;
    }): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            'UPDATE prescriptions SET drug = ?, dosage = ?, frequency = ?, duration = ? WHERE id = ?',
            [data.drug, data.dosage, data.frequency, data.duration, data.id]
        );
    }

    static async getLatestExamDataForPatient(patientDbId: number): Promise<any | null> {
        const db = await this.getDb();
        const results = await db.select<any[]>(`
            SELECT ce.*, c.created_at as consultation_date
            FROM clinical_exams ce
            JOIN consultations c ON ce.consultation_id = c.id
            WHERE c.patient_db_id = ?
            ORDER BY c.created_at DESC
            LIMIT 1
        `, [patientDbId]);
        return results.length > 0 ? results[0] : null;
    }

    static async getDashboardStats(): Promise<{
        totalPatients: number;
        appointmentsToday: number;
        appointmentsCompletedToday: number;
        pendingReports: number;
    }> {
        const db = await this.getDb();
        const today = new Date().toISOString().split('T')[0];

        // 1. Total Patients
        const patientsResult = await db.select<any[]>('SELECT COUNT(*) as count FROM patients');
        const totalPatients = patientsResult[0]?.count || 0;

        // 2. Appointments Today
        const appointmentsResult = await db.select<any[]>(
            'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?',
            [today]
        );
        const appointmentsToday = appointmentsResult[0]?.count || 0;

        // 3. Appointments Completed Today
        const completedAppointmentsResult = await db.select<any[]>(
            'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status = ?',
            [today, 'Completed']
        );
        const appointmentsCompletedToday = completedAppointmentsResult[0]?.count || 0;

        // 4. Pending Reports (Consultations In Progress)
        const pendingReportsResult = await db.select<any[]>(
            'SELECT COUNT(*) as count FROM consultations WHERE status = ?',
            ['In Progress']
        );
        const pendingReports = pendingReportsResult[0]?.count || 0;

        return {
            totalPatients,
            appointmentsToday,
            appointmentsCompletedToday,
            pendingReports
        };
    }

    static async getRecentActivity(): Promise<any[]> {
        const db = await this.getDb();
        return await db.select<any[]>(`
            SELECT 
                'Consultation' as type, 
                c.created_at as created_at, 
                p.full_name as patient_name, 
                c.reason as details
            FROM consultations c
            JOIN patients p ON c.patient_db_id = p.id
            ORDER BY c.created_at DESC LIMIT 10
        `);
    }

    // ==================== SETTINGS MANAGEMENT ====================

    // System Settings
    static async getSystemSettings(): Promise<Record<string, string>> {
        const db = await this.getDb();
        const settings = await db.select<any[]>('SELECT setting_key, setting_value FROM system_settings');
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => {
            settingsMap[s.setting_key] = s.setting_value;
        });
        return settingsMap;
    }

    static async updateSystemSetting(key: string, value: string): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
            [key, value, value]
        );
    }

    static async updateSystemSettings(settings: Record<string, string>): Promise<void> {
        for (const [key, value] of Object.entries(settings)) {
            await this.updateSystemSetting(key, value);
        }
    }

    // User Management (Extended)
    static async getUsersDetailed(): Promise<any[]> {
        const db = await this.getDb();
        return await db.select<any[]>('SELECT id, username, full_name, role, email, created_at FROM users ORDER BY created_at DESC');
    }

    static async createUser(userData: {
        username: string;
        password_hash: string;
        full_name: string;
        role: string;
        email?: string;
    }): Promise<number> {
        const db = await this.getDb();
        const result = await db.execute(
            'INSERT INTO users (username, password_hash, full_name, role, email) VALUES (?, ?, ?, ?, ?)',
            [userData.username, userData.password_hash, userData.full_name, userData.role, userData.email || null]
        );
        return result.lastInsertId || 0;
    }

    static async updateUser(id: number, userData: {
        username?: string;
        full_name?: string;
        role?: string;
        email?: string;
    }): Promise<void> {
        const db = await this.getDb();
        const updates: string[] = [];
        const values: any[] = [];

        if (userData.username !== undefined) {
            updates.push('username = ?');
            values.push(userData.username);
        }
        if (userData.full_name !== undefined) {
            updates.push('full_name = ?');
            values.push(userData.full_name);
        }
        if (userData.role !== undefined) {
            updates.push('role = ?');
            values.push(userData.role);
        }
        if (userData.email !== undefined) {
            updates.push('email = ?');
            values.push(userData.email);
        }

        if (updates.length > 0) {
            values.push(id);
            await db.execute(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }
    }

    static async deleteUser(id: number): Promise<void> {
        const db = await this.getDb();
        await db.execute('DELETE FROM users WHERE id = ?', [id]);
    }

    // Password Policy
    static async getPasswordPolicy(): Promise<any> {
        const db = await this.getDb();
        const policies = await db.select<any[]>('SELECT * FROM password_policy LIMIT 1');
        if (policies.length > 0) {
            return policies[0];
        }
        // Return default policy if none exists
        return {
            min_length: 8,
            require_uppercase: true,
            require_numbers: true,
            require_special_chars: true,
            expiry_days: 90
        };
    }

    static async updatePasswordPolicy(policy: {
        min_length: number;
        require_uppercase: boolean;
        require_numbers: boolean;
        require_special_chars: boolean;
        expiry_days: number;
    }): Promise<void> {
        const db = await this.getDb();
        // Delete existing policy and insert new one
        await db.execute('DELETE FROM password_policy');
        await db.execute(
            'INSERT INTO password_policy (min_length, require_uppercase, require_numbers, require_special_chars, expiry_days) VALUES (?, ?, ?, ?, ?)',
            [
                policy.min_length,
                policy.require_uppercase ? 1 : 0,
                policy.require_numbers ? 1 : 0,
                policy.require_special_chars ? 1 : 0,
                policy.expiry_days
            ]
        );
    }

    // Audit Logs
    static async getAuditLogs(limit: number = 50): Promise<any[]> {
        const db = await this.getDb();
        return await db.select<any[]>(`
            SELECT al.*, u.full_name as user_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.timestamp DESC
            LIMIT ?
        `, [limit]);
    }

    static async createAuditLog(logData: {
        user_id: number | null;
        action: string;
        details: string;
        severity: 'info' | 'warning' | 'critical';
        ip_address?: string;
    }): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            'INSERT INTO audit_logs (user_id, action, details, severity, ip_address) VALUES (?, ?, ?, ?, ?)',
            [logData.user_id, logData.action, logData.details, logData.severity, logData.ip_address || null]
        );
    }

    // Roles & Permissions
    static async getRolesPermissions(): Promise<any[]> {
        const db = await this.getDb();
        return await db.select<any[]>('SELECT * FROM roles_permissions ORDER BY role');
    }

    static async updateRolePermission(role: string, permission: string, allowed: boolean): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            'INSERT INTO roles_permissions (role, permission, allowed) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE allowed = ?',
            [role, permission, allowed ? 1 : 0, allowed ? 1 : 0]
        );
    }

    // Backups
    static async getBackupHistory(limit: number = 50): Promise<any[]> {
        const db = await this.getDb();
        return await db.select<any[]>(`
            SELECT * FROM backup_history
            ORDER BY timestamp DESC
            LIMIT ?
        `, [limit]);
    }

    static async createBackupRecord(backupData: {
        type: 'Automatic' | 'Manual';
        filename: string;
        size_mb: number;
        status: 'Success' | 'Failed';
        error_message?: string;
    }): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            'INSERT INTO backup_history (type, filename, size_mb, status, error_message) VALUES (?, ?, ?, ?, ?)',
            [backupData.type, backupData.filename, backupData.size_mb, backupData.status, backupData.error_message || null]
        );
    }

    static async getBackupStats(): Promise<{
        total: number;
        lastSuccessful: string | null;
        failedLast24h: number;
    }> {
        const db = await this.getDb();

        const totalResult = await db.select<any[]>('SELECT COUNT(*) as count FROM backup_history');
        const total = totalResult[0]?.count || 0;

        const lastSuccessfulResult = await db.select<any[]>(
            "SELECT timestamp FROM backup_history WHERE status = 'Success' ORDER BY timestamp DESC LIMIT 1"
        );
        const lastSuccessful = lastSuccessfulResult[0]?.timestamp || null;

        const failedResult = await db.select<any[]>(
            "SELECT COUNT(*) as count FROM backup_history WHERE status = 'Failed' AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
        );
        const failedLast24h = failedResult[0]?.count || 0;

        return { total, lastSuccessful, failedLast24h };
    }

    // Version Management
    static async getLatestVersion(platform: string): Promise<any | null> {
        const db = await this.getDb();
        const versions = await db.select<any[]>(
            'SELECT * FROM app_versions WHERE platform = ? OR platform = ? ORDER BY created_at DESC LIMIT 1',
            [platform, 'all']
        );
        return versions.length > 0 ? versions[0] : null;
    }

    static async getAllVersionRequirements(): Promise<any[]> {
        const db = await this.getDb();
        return await db.select<any[]>('SELECT * FROM app_versions ORDER BY created_at DESC');
    }

    static async updateVersionRequirement(versionData: {
        platform: string;
        version: string;
        value?: string;
        priority: boolean;
    }): Promise<void> {
        const db = await this.getDb();
        await db.execute(
            'INSERT INTO app_versions (platform, version, value, priority) VALUES (?, ?, ?, ?)',
            [versionData.platform, versionData.version, versionData.value || null, versionData.priority]
        );
    }
}
