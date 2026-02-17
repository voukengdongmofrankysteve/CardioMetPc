import React, { useState, useEffect } from 'react';
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
import { DatabaseService } from './services/database';
import { invoke } from '@tauri-apps/api/core';
import './App.css';

type Page = 'dashboard' | 'appointments' | 'appointment-details' | 'patients' | 'patient-prescriptions' | 'new-patient' | 'patient-details' | 'consultations' | 'new-consultation' | 'consultation-details' | 'archives' | 'prescriptions' | 'prescription-templates' | 'stats' | 'settings' | 'exam-details';

// Helper function to compare versions
const compareVersions = (current: string, required: string): boolean => {
    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
        const curr = currentParts[i] || 0;
        const req = requiredParts[i] || 0;

        if (curr < req) return false; // Update needed
        if (curr > req) return true;  // Current is newer
    }

    return true; // Versions are equal
};

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [selectedPatientDbId, setSelectedPatientDbId] = useState<number | null>(null);
    const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

    // Version checking state
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [currentVersion, setCurrentVersion] = useState('0.1.0');
    const [requiredVersion, setRequiredVersion] = useState('0.1.0');
    const [releaseNotes, setReleaseNotes] = useState('');
    const [updatePriority, setUpdatePriority] = useState(false);

    // Check for persisted login
    useEffect(() => {
        const storedUser = localStorage.getItem('cardio_user');
        if (storedUser) {
            setIsLoggedIn(true);
        }
    }, []);

    // Check version on mount and whenever login status or page changes
    useEffect(() => {
        checkVersion();
    }, [isLoggedIn, currentPage]);

    const checkVersion = async () => {
        try {
            // Get current app version and platform
            const [appVersion, platform] = await Promise.all([
                invoke<string>('get_app_version'),
                invoke<string>('get_app_platform')
            ]);

            setCurrentVersion(appVersion);

            // Get required version from database
            const versionRequirement = await DatabaseService.getLatestVersion(platform);

            if (versionRequirement) {
                const isUpToDate = compareVersions(appVersion, versionRequirement.version);

                if (!isUpToDate) {
                    // Show update modal
                    setRequiredVersion(versionRequirement.version);
                    setReleaseNotes(versionRequirement.value || '');
                    setUpdatePriority(versionRequirement.priority);
                    setShowUpdateModal(true);
                }
            }
        } catch (error) {
            console.error('Version check failed:', error);
        }
    };

    const handleCloseUpdateModal = () => {
        if (!updatePriority) {
            setShowUpdateModal(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('cardio_user');
        setIsLoggedIn(false);
        setCurrentPage('dashboard'); // Reset page
    };

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-[#101f22]">
                <TitleBar />
                <LoginPage onLogin={() => setIsLoggedIn(true)} />
                <UpdateModal
                    isOpen={showUpdateModal}
                    currentVersion={currentVersion}
                    requiredVersion={requiredVersion}
                    releaseNotes={releaseNotes}
                    priority={updatePriority}
                    onClose={handleCloseUpdateModal}
                />
            </div>
        );
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage onNavigate={(page: string) => {
                    if (page === 'new-patient') setSelectedPatientId(null);
                    setCurrentPage(page as any);
                }} />;
            case 'appointments':
                return <AppointmentsPage
                    onViewDetails={(id) => {
                        setSelectedAppointmentId(id);
                        setCurrentPage('appointment-details');
                    }}
                />;
            case 'appointment-details':
                return (
                    <AppointmentDetailsPage
                        appointmentId={selectedAppointmentId || 0}
                        onBack={() => setCurrentPage('appointments')}
                    />
                );
            case 'patients':
                return <PatientPage
                    onAddPatient={() => {
                        setSelectedPatientId(null);
                        setCurrentPage('new-patient');
                    }}
                    onStartConsultation={() => setCurrentPage('new-consultation')}
                    onViewDetails={(id) => {
                        setSelectedPatientId(id);
                        setCurrentPage('patient-details');
                    }}
                    onViewPrescriptions={(id, dbId, name) => {
                        setSelectedPatientId(id);
                        setSelectedPatientDbId(dbId);
                        setSelectedPatientName(name);
                        setCurrentPage('patient-prescriptions');
                    }}
                    onEditPatient={(id) => {
                        setSelectedPatientId(id);
                        setCurrentPage('new-patient');
                    }}
                    onArchivePatient={(_id) => setCurrentPage('archives')}
                />;
            case 'new-patient':
                return <NewPatientPage
                    patientId={selectedPatientId || undefined}
                    onBack={() => {
                        setSelectedPatientId(null);
                        setCurrentPage('patients');
                    }}
                    onCancel={() => {
                        setSelectedPatientId(null);
                        setCurrentPage('patients');
                    }}
                />;
            case 'patient-details':
                return <PatientDetailsPage
                    patientId={selectedPatientId || ''}
                    onBack={() => setCurrentPage('patients')}
                    onStartConsultation={() => setCurrentPage('new-consultation')}
                    onViewExam={(id) => {
                        setSelectedExamId(id);
                        setCurrentPage('exam-details');
                    }}
                />;
            case 'consultations':
                return <ConsultationListPage
                    onNewConsultation={() => setCurrentPage('new-consultation')}
                    onViewDetails={(id) => {
                        setSelectedConsultationId(id);
                        setCurrentPage('consultation-details');
                    }}
                />;
            case 'new-consultation':
                return <ConsultationPage
                    onBack={() => setCurrentPage('consultations')}
                    onComplete={() => setCurrentPage('consultations')}
                    onViewDetails={(id) => {
                        setSelectedPatientId(id);
                        setCurrentPage('patient-details');
                    }}
                />;
            case 'consultation-details':
                return <ConsultationDetailsPage
                    consultationId={selectedConsultationId || undefined}
                    onBack={() => setCurrentPage('consultations')}
                    onEditPatient={(id) => {
                        setSelectedPatientId(id);
                        setCurrentPage('new-patient');
                    }}
                />;
            case 'prescriptions':
                return <PrescriptionPage />;
            case 'prescription-templates':
                return <PrescriptionTemplatesPage />;
            case 'archives':
                return <ArchivePage onViewExam={(id, patientId) => {
                    setSelectedExamId(id);
                    setSelectedPatientId(patientId);
                    setCurrentPage('exam-details');
                }} />;
            case 'settings':
                return <SettingsPage />;
            case 'exam-details':
                return <ExamDetailsPage
                    examId={selectedExamId || ''}
                    patientId={selectedPatientId || ''}
                    onBack={() => setCurrentPage('patient-details')}
                />;
            case 'patient-prescriptions':
                return <PatientPrescriptionsPage
                    patientId={selectedPatientId || ''}
                    patientDbId={selectedPatientDbId || 0}
                    patientName={selectedPatientName || ''}
                    onBack={() => setCurrentPage('patients')}
                    onEditPrescription={(px) => {
                        // For now just console log, or we could navigate to Prescription editor
                        console.log('Edit PX', px);
                    }}
                />;
            default:
                return <DashboardPage onNavigate={(page: string) => {
                    if (page === 'new-patient') setSelectedPatientId(null);
                    setCurrentPage(page as any);
                }} />;
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-bg-main dark:bg-dark-bg-main font-sans text-text-main dark:text-dark-text-main transition-colors duration-200 print:h-auto print:overflow-visible">
            <div className="print:hidden">
                <TitleBar />
            </div>
            <div className="flex flex-1 overflow-hidden print:overflow-visible print:h-auto">
                <div className="print:hidden">
                    <Sidebar activePage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout} />
                </div>
                <main className="flex-1 overflow-y-auto bg-bg-main dark:bg-dark-bg-main p-6 print:p-0 print:overflow-visible print:bg-white">
                    {renderPage()}
                </main>
            </div>
            <UpdateModal
                isOpen={showUpdateModal}
                currentVersion={currentVersion}
                requiredVersion={requiredVersion}
                releaseNotes={releaseNotes}
                priority={updatePriority}
                onClose={handleCloseUpdateModal}
            />
        </div>
    );
};

export default App;
