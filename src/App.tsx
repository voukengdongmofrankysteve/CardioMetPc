import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { TitleBar } from './components/layout/TitleBar';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PatientPage } from './pages/dashboard/PatientPage';
import { PatientPrescriptionsPage } from './pages/dashboard/PatientPrescriptionsPage';
import { ConsultationPage } from './pages/consultation/ConsultationPage';
import { ConsultationListPage } from './pages/consultation/ConsultationListPage';
import { ConsultationDetailsPage } from './pages/consultation/ConsultationDetailsPage';
import { PrescriptionPage } from './pages/prescription/PrescriptionPage';
import { PrescriptionTemplatesPage } from './pages/prescription/PrescriptionTemplatesPage';
import { ArchivePage } from './pages/archives/ArchivePage';
import { NewPatientPage } from './pages/dashboard/NewPatientPage';
import { PatientDetailsPage } from './pages/dashboard/PatientDetailsPage';
import { ExamDetailsPage } from './pages/archives/ExamDetailsPage';
import { AppointmentsPage } from './pages/appointments/AppointmentsPage';
import { AppointmentDetailsPage } from './pages/appointments/AppointmentDetailsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { Sidebar } from './components/layout/Sidebar';
import { UpdateModal } from './components/modals/UpdateModal';
import { authService } from './services/api';
import './App.css';

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Version checking state (kept for compatibility, though currently unused)
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [currentVersion] = useState('0.1.0');
    const [requiredVersion] = useState('0.1.0');
    const [releaseNotes] = useState('');
    const [updatePriority] = useState(false);

    // Check for persisted login
    useEffect(() => {
        const storedUser = localStorage.getItem('cardio_user');
        if (storedUser) {
            setIsLoggedIn(true);
        } else if (location.pathname !== '/login') {
            navigate('/login');
        }
    }, [navigate, location.pathname]);

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('cardio_token');
            localStorage.removeItem('cardio_user');
        }
        setIsLoggedIn(false);
        navigate('/login');
    };

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        navigate('/dashboard');
    };

    if (!isLoggedIn && location.pathname !== '/login') {
        return null; // Or a loading spinner while checking useEffect
    }

    if (location.pathname === '/login') {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-[#101f22]">
                <TitleBar />
                <LoginPage onLogin={handleLoginSuccess} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-bg-main dark:bg-dark-bg-main font-sans text-text-main dark:text-dark-text-main transition-colors duration-200 print:h-auto print:overflow-visible">
            <div className="flex flex-1 overflow-hidden print:overflow-visible print:h-auto">
                <div className="print:hidden">
                    <Sidebar onLogout={handleLogout} />
                </div>
                <main className="flex-1 overflow-y-auto bg-bg-main dark:bg-dark-bg-main p-6 print:p-0 print:overflow-visible print:bg-white">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        
                        <Route path="/appointments" element={<AppointmentsPage />} />
                        <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
                        
                        <Route path="/patients" element={<PatientPage />} />
                        <Route path="/patients/new" element={<NewPatientPage />} />
                        <Route path="/patients/edit/:id" element={<NewPatientPage />} />
                        <Route path="/patients/:id" element={<PatientDetailsPage />} />
                        <Route path="/patients/:id/prescriptions" element={<PatientPrescriptionsPage />} />

                        <Route path="/consultations" element={<ConsultationListPage />} />
                        <Route path="/consultations/new/:patientId?" element={<ConsultationPage />} />
                        <Route path="/consultations/:id" element={<ConsultationDetailsPage />} />

                        <Route path="/prescriptions" element={<PrescriptionPage />} />
                        <Route path="/prescription-templates" element={<PrescriptionTemplatesPage />} />
                        
                        <Route path="/archives" element={<ArchivePage />} />
                        <Route path="/archives/exams/:id" element={<ExamDetailsPage />} />
                        
                        <Route path="/settings" element={<SettingsPage />} />
                        
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </main>
            </div>
            <UpdateModal
                isOpen={showUpdateModal}
                currentVersion={currentVersion}
                requiredVersion={requiredVersion}
                releaseNotes={releaseNotes}
                priority={updatePriority}
                onClose={() => setShowUpdateModal(false)}
            />
        </div>
    );
};

export default App;
