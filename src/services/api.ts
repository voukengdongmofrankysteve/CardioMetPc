import axios from 'axios';

const API_URL = 'https://cardiomed.vyloxi.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Interceptor to add the token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('cardio_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor to handle standardized response format
api.interceptors.response.use((response) => {
    if (response.data && response.data.success !== undefined) {
        if (response.data.success) {
            // Return only the data payload to the service
            return { ...response, data: response.data.data };
        }
    }
    return response;
}, (error) => {
    return Promise.reject(error);
});

export const authService = {
    async login(email: string, password: string) {
        const response = await api.post('/login', {
            email,
            password,
            device_name: 'CardioMetPc',
        });
        
        const data = response.data;
        
        if (data && data.token) {
            localStorage.setItem('cardio_token', data.token);
            localStorage.setItem('cardio_user', JSON.stringify(data.user));
        }
        
        return data;
    },

    async logout() {
        await api.post('/logout');
        localStorage.removeItem('cardio_token');
        localStorage.removeItem('cardio_user');
    },

    async getCurrentUser() {
        const response = await api.get('/user');
        return response.data;
    }
};

export const patientService = {
    async getPatients() {
        const response = await api.get('/patients');
        return response.data;
    },

    async getPatientById(id: number) {
        const response = await api.get(`/patients/${id}`);
        return response.data;
    },

    async createPatient(data: any) {
        const response = await api.post('/patients', data);
        return response.data;
    },

    async updatePatient(id: number, data: any) {
        const response = await api.put(`/patients/${id}`, data);
        return response.data;
    },

    async deletePatient(id: number) {
        const response = await api.delete(`/patients/${id}`);
        return response.data;
    },

    async searchPatients(query: string) {
        const response = await api.get('/patients/search', {
            params: { query }
        });
        return response.data;
    },
};

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};

export const consultationService = {
  getConsultations: async (patientId?: number) => {
    const response = await api.get('/consultations', {
      params: patientId ? { patient_id: patientId } : {},
    });
    return response.data;
  },
  getConsultationById: async (id: number | string) => {
    const response = await api.get(`/consultations/${id}`);
    return response.data;
  },
  saveConsultation: async (data: any) => {
    const isFormData = data instanceof FormData;
    const response = await api.post('/consultations', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
  },
};

export const appointmentService = {
  getAppointments: async (params?: { patient_id?: number; date?: string }) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },
  getAppointmentById: async (id: number | string) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },
  scheduleAppointment: async (data: any) => {
    const response = await api.post('/appointments', data);
    return response.data;
  },
  createAppointment: async (data: any) => {
    const response = await api.post('/appointments', data);
    return response.data;
  },
  updateAppointment: async (id: number | string, data: any) => {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
  },
  updateAppointmentStatus: async (id: number | string, status: string) => {
    const response = await api.patch(`/appointments/${id}/status`, { status });
    return response.data;
  },
  cancelAppointment: async (id: number | string) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },
};

export const prescriptionService = {
  getTemplates: async () => {
    const response = await api.get('/prescriptions/templates');
    return response.data;
  },
  saveTemplate: async (label: string, meds: any[]) => {
    // Backend expects "medications" array
    const response = await api.post('/prescriptions/templates', { label, medications: meds });
    return response.data;
  },
  updateTemplate: async (id: number | string, label: string, meds: any[]) => {
    // Backend expects "medications" array
    const response = await api.put(`/prescriptions/templates/${id}`, { label, medications: meds });
    return response.data;
  },
  deleteTemplate: async (id: number | string) => {
    const response = await api.delete(`/prescriptions/templates/${id}`);
    return response.data;
  },
  getPrescriptions: async (patientId?: number) => {
    const response = await api.get('/prescriptions', {
      params: patientId ? { patient_id: patientId } : {},
    });
    return response.data;
  },
  getPrescriptionById: async (id: number | string) => {
    const response = await api.get(`/prescriptions/${id}`);
    return response.data;
  },
  savePrescription: async (medications: any[], patientId: number | string, consultationId?: number) => {
    const response = await api.post('/prescriptions', { medications, patient_id: patientId, consultation_id: consultationId });
    return response.data;
  },
  updatePrescription: async (data: any) => {
    const response = await api.put(`/prescriptions/${data.id}`, data);
    return response.data;
  },
};

export const examService = {
  getExams: async (params?: any) => {
    const response = await api.get('/exams', { params });
    return response.data;
  },
  getExamById: async (id: number | string) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  }
};

export const userService = {
  getUsers: async () => {
    const response = await api.get('/settings/users');
    return response.data;
  },
  createUser: async (data: any) => {
    const response = await api.post('/settings/users', data);
    return response.data;
  },
  updateUser: async (id: number, data: any) => {
    const response = await api.put(`/settings/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: number) => {
    const response = await api.delete(`/settings/users/${id}`);
    return response.data;
  }
};

export const systemService = {
  getSettings: async () => {
    const response = await api.get('/settings/system');
    return response.data;
  },
  updateSettings: async (data: any) => {
    const response = await api.post('/settings/system', data);
    return response.data;
  }
};

export const securityService = {
  getAuditLogs: async () => {
    const response = await api.get('/settings/security/audit-logs');
    return response.data;
  },
  getBackups: async () => {
    const response = await api.get('/settings/security/backups');
    return response.data;
  },
  createBackup: async () => {
    const response = await api.post('/settings/security/backups');
    return response.data;
  },
  getPasswordPolicy: async () => {
    const response = await api.get('/settings/security/password-policy');
    return response.data;
  },
  updatePasswordPolicy: async (data: any) => {
    const response = await api.post('/settings/security/password-policy', data);
    return response.data;
  },
  getRolesPermissions: async () => {
    const response = await api.get('/settings/security/permissions');
    return response.data;
  },
  updateRolePermission: async (role: string, permission: string, allowed: boolean) => {
    const response = await api.post('/settings/security/permissions', { role, permission, allowed });
    return response.data;
  }
};

export const fileService = {
  uploadFile: async (file: File, type: 'ecg' | 'ett') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  downloadFile: async (path: string) => {
    try {
      const response = await api.get(`/download/${path.replace(/\//g, '%2F')}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', path.split('/').pop() || 'download');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Le téléchargement a échoué.');
    }
  }
};

export default api;
