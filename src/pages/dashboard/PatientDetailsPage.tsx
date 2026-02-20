import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { DatabaseService } from '../../services/database';
import { generatePatientDetailsPDF } from '../../services/patientDetailsPDF';
import { generatePrescriptionPDF, PrescriptionGroup } from '../../services/prescriptionPDF';

interface PatientDetailsPageProps {
    patientId: string; // Numeric ID from DB
    onBack: () => void;
    onStartConsultation: () => void;
    onViewExam: (id: string) => void;
    onEditPatient: (id: string) => void;
}

type Tab = 'overview' | 'consultations' | 'exams' | 'prescriptions';



export const PatientDetailsPage: React.FC<PatientDetailsPageProps> = ({ patientId, onBack, onStartConsultation, onViewExam, onEditPatient }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [patient, setPatient] = useState<any>(null);
    const [consultations, setConsultations] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [prescriptionsGrouped, setPrescriptionsGrouped] = useState<PrescriptionGroup[]>([]);
    const [latestExam, setLatestExam] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleExportPDF = () => {
        if (patient) {
            generatePatientDetailsPDF(patient);
        }
    };

    const handlePrintPrescription = (prescription: PrescriptionGroup) => {
        if (patient) {
            generatePrescriptionPDF(prescription, patient.full_name);
        }
    };

    const handleDeletePatient = async () => {
        if (patient && patient.id) {
            try {
                console.log(`Deleting patient with ID: ${patient.id}`);
                await DatabaseService.deletePatient(patient.id);
                onBack(); // Go back to the previous page after deletion
            } catch (error) {
                console.error('Error deleting patient:', error);
                // Optionally show an error message to the user
            } finally {
                setShowDeleteConfirm(false);
            }
        }
    };

    // Confirmation Dialog for Delete Patient
    {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#152a26] p-8 rounded-xl shadow-lg border border-[var(--color-border)] dark:border-[#1e3a36] text-center">
                <h3 className="text-xl font-bold text-red-600 mb-4">Confirmer la suppression</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.</p>
                <div className="flex justify-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-6 py-2 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleDeletePatient}
                        className="px-6 py-2 bg-red-600 text-white hover:bg-red-700"
                    >
                        Supprimer
                    </Button>
                </div>
            </div>
        </div>
    )}

    // Quick Add Exam State
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [examForm, setExamForm] = useState({
        type: 'ECG' as 'ECG' | 'ETT',
        interpretation: '',
        ef: '', // For ETT
        lvedd: '', // For ETT
    });

    useEffect(() => {
        loadData();
    }, [patientId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const dbId = parseInt(patientId);
            const pData = await DatabaseService.getPatientById(dbId);
            setPatient(pData);

            const cData = await DatabaseService.getConsultationsByPatient(dbId);
            setConsultations(cData);

            const eData = await DatabaseService.getExamsByPatient(dbId);
            // Transform eData (ecg_ett_exams records) into UI cards
            const examCards: any[] = [];
            eData.forEach(e => {
                if (e.ecg_interpretation) {
                    examCards.push({
                        id: `ecg-${e.id}`,
                        date: new Date(e.date).toLocaleDateString(),
                        type: 'ECG',
                        result: e.ecg_interpretation,
                        file: 'ECG_Record'
                    });
                }
                if (e.ett_interpretation || e.ett_fevg) {
                    examCards.push({
                        id: `ett-${e.id}`,
                        date: new Date(e.date).toLocaleDateString(),
                        type: 'ETT (Echo cardiaque)',
                        result: `FEVG: ${e.ett_fevg || 'N/A'}%, ${e.ett_interpretation || ''}`,
                        file: 'ETT_Record'
                    });
                }
            });
            setExams(examCards);

            const prData = await DatabaseService.getPrescriptionsByPatient(dbId);
            // Group prescriptions by consultation_id
            const grouped: PrescriptionGroup[] = [];
            const map = new Map();
            prData.forEach(pr => {
                if (!map.has(pr.consultation_id)) {
                    map.set(pr.consultation_id, {
                        id: pr.consultation_id,
                        date: new Date(pr.consultation_date).toLocaleDateString(),
                        meds: [],
                        status: 'Active' // We don't have expiry logic yet
                    });
                    grouped.push(map.get(pr.consultation_id));
                }
                map.get(pr.consultation_id).meds.push(`${pr.drug} ${pr.dosage}`);
            });
            setPrescriptionsGrouped(grouped);

            const latest = await DatabaseService.getLatestExamDataForPatient(dbId);
            setLatestExam(latest);

        } catch (err) {
            console.error('Failed to load patient details:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderOverview = () => (
        <div className="grid grid-cols-12 gap-6 text-left animate-in fade-in duration-300">
            {/* Vital Summary */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#152a26] p-5 rounded-xl shadow-sm border border-[#e7f3f1] dark:border-[#1e3a36] flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Tension Artérielle</span>
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500">
                            <span className="material-symbols-outlined text-lg">blood_pressure</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[var(--color-text-main)] dark:text-white">
                            {latestExam ? `${latestExam.bp_sys}/${latestExam.bp_dia}` : '--/--'}
                        </span>
                        <span className="text-xs text-[#4c9a8d] font-bold">mmHg</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[#4c9a8d] text-[10px] font-bold">
                        <span className="material-symbols-outlined text-sm">event</span>
                        <span>Dernier contrôle: {latestExam ? new Date(latestExam.consultation_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
                <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] p-5 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Fréquence Cardiaque</span>
                        <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg text-[var(--color-primary)]">
                            <span className="material-symbols-outlined text-lg">favorite</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[var(--color-text-main)] dark:text-white">{latestExam?.heart_rate || '--'}</span>
                        <span className="text-xs text-[var(--color-text-muted)] font-bold">bpm</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-green-500 text-[10px] font-bold">
                        <span className="material-symbols-outlined text-sm">trending_flat</span>
                        <span>Stable</span>
                    </div>
                </div>
                <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] p-5 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Sat. Oxygène</span>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-500">
                            <span className="material-symbols-outlined text-lg">air</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[#0d1b19] dark:text-white">{latestExam?.spo2 || '--'}</span>
                        <span className="text-xs text-[#4c9a8d] font-bold">% SpO2</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-green-500 text-[10px] font-bold">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Plage Normale</span>
                    </div>
                </div>
            </div>

            {/* Recent Timeline */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-xl shadow-sm border border-[var(--color-border)] dark:border-[var(--color-dark-border)] overflow-hidden">
                    <div className="p-5 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex justify-between items-center bg-[var(--color-bg-main)]/50 dark:bg-white/5">
                        <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-[var(--color-text-muted)]">
                            <span className="material-symbols-outlined text-[var(--color-primary)] text-lg">history</span> Chronologie Récente
                        </h3>
                        <button onClick={() => setActiveTab('consultations')} className="text-[var(--color-primary)] text-xs font-bold hover:underline">Voir tout l'historique</button>
                    </div>
                    <div className="p-6">
                        <div className="space-y-8 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--color-border)] dark:before:bg-[var(--color-dark-border)]">
                            {consultations.slice(0, 3).map((c, i) => (
                                <div key={i} className="relative pl-8 text-left">
                                    <div className={`absolute left-0 top-1.5 size-[24px] rounded-full border-4 border-white dark:border-[var(--color-dark-bg-surface)] z-10 ${i === 0 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)] dark:bg-[var(--color-dark-border)]'}`}></div>
                                    <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-tighter">{new Date(c.date).toLocaleDateString()}</p>
                                    <p className="text-sm font-bold text-[var(--color-text-main)] dark:text-white">{c.type}</p>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-1">{c.diagnosis}</p>
                                </div>
                            ))}
                            {consultations.length === 0 && (
                                <p className="text-xs text-[var(--color-text-muted)] ml-4 italic">Aucune consultation récente.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Note area */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <div className="bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/5 rounded-xl border border-[var(--color-primary)]/30 p-5 text-left">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-[var(--color-primary)] text-lg">sticky_note_2</span>
                        <h3 className="font-bold text-sm uppercase tracking-wider">Note Clinique</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--color-text-main)] dark:text-white italic">
                        {latestExam?.notes || "Aucune note clinique récente."}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-4 font-bold">— Rapport d'Examen</p>
                </div>

                <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-xl shadow-sm border border-[var(--color-border)] dark:border-[var(--color-dark-border)] p-5 text-left">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[var(--color-primary)] text-lg">medical_information</span> Antécédents
                    </h3>
                    <p className="text-xs text-[var(--color-text-main)] dark:text-white font-medium mb-4">{patient?.medical_history || 'Aucun antécédent renseigné.'}</p>
                    <Button variant="outline" className="w-full text-xs py-2" icon="visibility">Voir les antécédents complets</Button>
                </div>
            </div>
        </div>
    );

    const renderConsultations = () => (
        <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-xl shadow-sm border border-[var(--color-border)] dark:border-[var(--color-dark-border)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-6 flex justify-between items-center border-b border-[var(--color-border)] dark:border-white/5">
                <h3 className="font-bold text-lg text-[var(--color-text-main)] dark:text-white uppercase tracking-tight">Historique des Consultations</h3>
                <Button icon="add" onClick={onStartConsultation} className="bg-[var(--color-primary)] text-white h-10 px-4 text-xs font-black">Nouvelle Consultation</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[var(--color-bg-main)] dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Médecin</th>
                            <th className="px-6 py-4">Diagnostic</th>
                            <th className="px-6 py-4">Statut</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] dark:divide-[var(--color-dark-border)]">
                        {consultations.map((c) => (
                            <tr key={c.id} className="hover:bg-[var(--color-bg-main)] dark:hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-main)] dark:text-white">{new Date(c.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-xs font-medium text-[var(--color-text-muted)]">{c.type}</td>
                                <td className="px-6 py-4 text-sm font-bold text-[var(--color-text-main)] dark:text-white">{c.doctor}</td>
                                <td className="px-6 py-4 text-xs text-[var(--color-text-muted)] italic">"{c.diagnosis}"</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${c.status === 'Terminé' ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[var(--color-primary)] hover:scale-110 transition-transform"><span className="material-symbols-outlined">visibility</span></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderExams = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
            {exams.map((e) => (
                <div key={e.id} className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-xl shadow-sm border border-[var(--color-border)] dark:border-[var(--color-dark-border)] overflow-hidden text-left flex flex-col">
                    <div className="p-5 bg-[var(--color-bg-main)]/50 dark:bg-white/5 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest">{e.type}</p>
                            <h4 className="text-sm font-bold text-[var(--color-text-main)] dark:text-white">{e.date}</h4>
                        </div>
                        <span className="material-symbols-outlined text-[var(--color-primary)] bg-[var(--color-primary)]/10 p-2 rounded-xl">{e.type === 'ECG' ? 'ecg_heart' : 'medical_services'}</span>
                    </div>
                    <div className="p-5 flex-1">
                        <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider mb-2">Résultat :</p>
                        <p className="text-sm text-[var(--color-text-main)] dark:text-white font-medium italic mb-4">"{e.result}"</p>

                        <div className="mt-auto pt-4 border-t border-dashed border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-[var(--color-text-muted)]">attach_file</span>
                                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase truncate max-w-[120px]">{e.file}</span>
                            </div>
                            <Button
                                variant="outline"
                                className="h-8 px-3 text-[10px] font-black uppercase"
                                onClick={() => onViewExam(e.id)}
                            >
                                Ouvrir
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
            {/* Add Exam Placeholder */}
            <div
                className="bg-[var(--color-bg-main)] dark:bg-white/5 rounded-xl border-2 border-dashed border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex flex-col items-center justify-center p-8 group cursor-pointer hover:border-[var(--color-primary)]/50 transition-all"
                onClick={() => setIsExamModalOpen(true)}
            >
                <span className="material-symbols-outlined text-3xl text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors mb-2">add_circle</span>
                <p className="text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest">Nouveau Rapport/Fichier</p>
            </div>
        </div>
    );

    const renderPrescriptions = () => (
        <div className="space-y-4 animate-in fade-in duration-300">
            {prescriptionsGrouped.map((p) => (
                <div key={p.id} className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-xl shadow-sm border border-[var(--color-border)] dark:border-[var(--color-dark-border)] p-6 text-left flex flex-wrap items-center justify-between gap-6 border-l-4 border-l-[var(--color-primary)]">
                    <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-black text-[var(--color-text-main)] dark:text-white tracking-tight">Prescription {p.id}</h4>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${p.status === 'Active' ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {p.status}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-4">Émise le : {p.date}</p>
                        <div className="flex flex-wrap gap-2">
                            {p.meds.map(m => (
                                <span key={m} className="px-3 py-1 bg-[var(--color-bg-main)] dark:bg-white/5 text-[var(--color-text-main)] dark:text-white rounded-lg text-[10px] font-bold border border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px] text-[var(--color-primary)]">pill</span> {m}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" icon="print" className="h-10 px-4 text-xs font-bold uppercase tracking-widest" onClick={() => handlePrintPrescription(p)}>Imprimer</Button>
                        <Button variant="outline" icon="edit" className="h-10 px-4 text-xs font-bold uppercase tracking-widest">Renouveler</Button>
                    </div>
                </div>
            ))}
        </div>
    );

    if (isLoading || !patient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f6f8f8] dark:bg-[#10221f]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#4c9a8d] font-black uppercase tracking-widest text-xs">Chargement du dossier...</p>
            </div>
        );
    }

    // Helper to get initials
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };



    const handleSaveExam = async () => {
        if (!patientId) return;
        try {
            await DatabaseService.addStandaloneExam(parseInt(patientId), examForm.type, examForm);
            setIsExamModalOpen(false);
            setExamForm({ type: 'ECG', interpretation: '', ef: '', lvedd: '' }); // Reset
            loadData(); // Refresh list
        } catch (error) {
            console.error('Failed to save exam:', error);
            alert("Erreur lors de l'enregistrement de l'examen.");
        }
    };

    return (
        <>
            <div className="flex flex-col min-h-screen bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] font-sans text-[var(--color-text-main)] dark:text-white overflow-y-auto no-scrollbar">
                {/* Header / Navigation Bar structure from mockup */}
                <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] px-8 py-3 sticky top-0 z-50 shrink-0">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onBack}
                            className="flex items-center text-[#4c9a8d] hover:text-[#42f0d3] transition-colors"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="size-6 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-sm">cardiology</span>
                            </div>
                            <h2 className="text-[var(--color-text-main)] dark:text-white text-lg font-bold leading-tight tracking-tight uppercase">CARDIOMED</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em]">
                            <span>Patients</span>
                            <span className="opacity-30">/</span>
                            <span className="text-[#0d1b19] dark:text-white underline decoration-primary decoration-2 underline-offset-4">Dossier: {patient.patient_id}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-[#f6f8f8] dark:bg-white/5 text-[#4c9a8d] hover:bg-primary/10 transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-[var(--color-bg-main)] dark:bg-white/5 text-[var(--color-text-muted)] hover:bg-[var(--color-primary)]/10 transition-colors">
                            <span className="material-symbols-outlined">settings</span>
                        </button>
                        <div className="size-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-text-main)] font-black border-2 border-[var(--color-bg-surface)] dark:border-[var(--color-dark-border)] shadow-sm">
                            AD
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex max-w-[1440px] mx-auto w-full p-6 gap-6">
                    {/* Left Sidebar: Patient Summary */}
                    <aside className="w-80 flex-shrink-0 flex flex-col gap-6">
                        {/* Profile Card */}
                        <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl p-6 shadow-sm border border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-center text-left">
                            <div className="flex flex-col items-center mb-6">
                                <div className="size-32 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] text-4xl font-black mb-4 shadow-lg border-4 border-[var(--color-bg-surface)] dark:border-[var(--color-dark-border)]">
                                    {getInitials(patient.full_name)}
                                </div>
                                <h1 className="text-[var(--color-text-main)] dark:text-white text-2xl font-bold">{patient.full_name}</h1>
                                <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mt-1">ID CLIENT: {patient.patient_id}</p>
                            </div>

                            <div className="space-y-3 text-left">
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                    <span className="text-[var(--color-text-muted)] text-[10px] font-black uppercase">Âge / Genre</span>
                                    <span className="text-[var(--color-text-main)] dark:text-white font-bold text-sm tracking-tighter">{patient.age} ans • {patient.gender}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                    <span className="text-[var(--color-text-muted)] text-[10px] font-black uppercase">Nationalité</span>
                                    <span className="text-[var(--color-text-main)] dark:text-white font-bold text-[11px] uppercase tracking-tight">{patient.nationality || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                    <span className="text-[var(--color-text-muted)] text-[10px] font-black uppercase">Poids</span>
                                    <span className="text-[var(--color-text-main)] dark:text-white font-bold text-sm tracking-tighter">{latestExam?.weight ? `${latestExam.weight} kg` : 'N/A'}</span>
                                </div>
                            </div>

                            <div className="mt-6 text-left">
                                <p className="text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest mb-3">Facteurs de Risque</p>
                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(patient.risk_factors) && patient.risk_factors.length > 0 ? (
                                        patient.risk_factors.map((f: string, i: number) => (
                                            <span key={`${f}-${i}`} className="px-2.5 py-1 bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-lg text-[10px] font-black flex items-center gap-1.5 border border-orange-100 dark:border-orange-900/50 capitalize">
                                                <span className="material-symbols-outlined text-xs">warning</span> {f}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[10px] text-[var(--color-text-muted)] italic">Aucun facteur renseigné</span>
                                    )}
                                </div>
                            </div>

                            <button onClick={() => onEditPatient(patientId)} className="w-full mt-6 py-3 px-4 bg-[var(--color-bg-main)] dark:bg-white/5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-[var(--color-border)] dark:border-[var(--color-dark-border)] hover:border-[var(--color-primary)]/50 transition-all">
                                <span className="material-symbols-outlined text-lg">edit</span> Modifier Dossier
                            </button>
                        </div>

                        {/* Contact Summary */}
                        <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl p-5 shadow-sm border border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-left">
                            <h3 className="text-[10px] font-black mb-3 flex items-center gap-2 uppercase tracking-widest text-[var(--color-text-muted)]">
                                <span className="material-symbols-outlined text-[var(--color-primary)] text-lg">contact_phone</span> Contact d'Urgence
                            </h3>
                            <p className="text-[var(--color-text-main)] dark:text-white text-sm font-black">{patient.emergency_contact || 'N/A'}</p>
                            <p className="text-[var(--color-text-muted)] text-[11px] font-bold mt-1">{patient.phone || 'N/A'}</p>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h2 className="text-3xl font-black text-[var(--color-text-main)] dark:text-white tracking-tight">Hub du Dossier Patient</h2>
                            <div className="flex gap-3">
                                <button
                                     onClick={handleExportPDF}
                                      className="px-5 py-2.5 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-[var(--color-bg-main)] dark:hover:bg-white/5 transition-colors">
                                      <span className="material-symbols-outlined text-lg">picture_as_pdf</span> Exporter PDF
                                  </button>
                                  <button
                                      onClick={() => setShowDeleteConfirm(true)}
                                      className="px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-red-500/20 transition-colors">
                                      <span className="material-symbols-outlined text-lg">delete</span> Supprimer Patient
                                  </button>
                                <button
                                    onClick={onStartConsultation}
                                    className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md flex items-center gap-2 hover:brightness-105 transition-all shadow-primary/20"
                                >
                                    <span className="material-symbols-outlined text-lg">add_circle</span> Nouvelle Consultation
                                </button>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] gap-8">
                            {(['overview', 'consultations', 'exams', 'prescriptions'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeTab === tab
                                        ? 'text-[var(--color-text-main)] dark:text-white'
                                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] dark:hover:text-white'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {tab === 'overview' ? 'grid_view' : tab === 'consultations' ? 'chat' : tab === 'exams' ? 'ecg_heart' : 'prescriptions'}
                                    </span>
                                    {tab === 'overview' ? 'Vue d\'ensemble' : tab === 'consultations' ? 'Consultations' : tab === 'exams' ? 'Examens (ECG/ETT)' : 'Ordonnances'}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-primary)] rounded-t-full shadow-[0_-2px_8px_rgba(13,148,136,0.5)]"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Active Tab Content */}
                        <div className="flex flex-col gap-6">
                            {activeTab === 'overview' && renderOverview()}
                            {activeTab === 'consultations' && renderConsultations()}
                            {activeTab === 'exams' && renderExams()}
                            {activeTab === 'prescriptions' && renderPrescriptions()}
                        </div>
                    </div>
                </main>

                <footer className="mt-auto py-8 px-8 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] text-center">
                    <p className="text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-[0.3em] leading-loose">
                        © 2024 CardioMed . Système de Gestion Médicale Sécurisé. Tous Droits Réservés.
                    </p>
                </footer>
            </div>

            {/* Quick Exam Modal */}
            {isExamModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] w-full max-w-lg p-6 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-[var(--color-text-main)] dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <span className="material-symbols-outlined text-[var(--color-primary)]">add_circle</span> Nouvel Examen Rapide
                            </h3>
                            <button onClick={() => setIsExamModalOpen(false)} className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">Type d'examen</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all ${examForm.type === 'ECG'
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-text-main)] font-bold'
                                        : 'border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/50'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="examType"
                                            className="hidden"
                                            checked={examForm.type === 'ECG'}
                                            onChange={() => setExamForm(prev => ({ ...prev, type: 'ECG' }))}
                                        />
                                        <span className="material-symbols-outlined">ecg_heart</span> ECG
                                    </label>
                                    <label className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all ${examForm.type === 'ETT'
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-text-main)] font-bold'
                                        : 'border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/50'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="examType"
                                            className="hidden"
                                            checked={examForm.type === 'ETT'}
                                            onChange={() => setExamForm(prev => ({ ...prev, type: 'ETT' }))}
                                        />
                                        <span className="material-symbols-outlined">echo</span> ETT
                                    </label>
                                </div>
                            </div>

                            {examForm.type === 'ETT' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">FEVG (%)</label>
                                        <input
                                            type="text"
                                            className="w-full h-12 rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white"
                                            placeholder="ex: 60"
                                            value={examForm.ef}
                                            onChange={(e) => setExamForm(prev => ({ ...prev, ef: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">DTDVG (mm)</label>
                                        <input
                                            type="text"
                                            className="w-full h-12 rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white"
                                            placeholder="ex: 45"
                                            value={examForm.lvedd}
                                            onChange={(e) => setExamForm(prev => ({ ...prev, lvedd: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">Interprétation / Conclusion</label>
                                <textarea
                                    className="w-full h-32 rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] p-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white resize-none"
                                    placeholder="Saisissez les conclusions de l'examen..."
                                    value={examForm.interpretation}
                                    onChange={(e) => setExamForm(prev => ({ ...prev, interpretation: e.target.value }))}
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsExamModalOpen(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleSaveExam}
                                    className="bg-[var(--color-primary)] text-white"
                                >
                                    Enregistrer
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
