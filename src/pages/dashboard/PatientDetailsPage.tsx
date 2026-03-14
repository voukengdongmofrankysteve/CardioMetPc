import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { patientService, consultationService, systemService, fileService } from '../../services/api';
import { generatePatientDetailsPDF } from '../../services/patientDetailsPDF';
import { generatePrescriptionPDF, PrescriptionGroup } from '../../services/prescriptionPDF';

type Tab = 'overview' | 'consultations' | 'exams' | 'prescriptions';

export const PatientDetailsPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [patient, setPatient] = useState<any>(null);
    const [consultations, setConsultations] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [prescriptionsGrouped, setPrescriptionsGrouped] = useState<PrescriptionGroup[]>([]);
    const [latestExam, setLatestExam] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [clinicSettings, setClinicSettings] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

 

    const loadData = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const dbId = parseInt(id);
            const pData = await patientService.getPatientById(dbId);
            setPatient(pData);

            const cData = await consultationService.getConsultations(dbId);
            setConsultations(cData || []);

            const examCards: any[] = [];
            cData?.forEach((c: any) => {
                if (c.ecg_ett_exam) {
                    const e = c.ecg_ett_exam;
                    if (e.ecg_interpretation) {
                        examCards.push({
                            id: `ecg-${e.id}`,
                            date: new Date(c.created_at).toLocaleDateString(),
                            type: 'ECG',
                            result: e.ecg_interpretation,
                            file: e.ecg_files && e.ecg_files.length > 0 ? e.ecg_files[0] : null
                        });
                    }
                    if (e.ett_interpretation || e.ett_fevg) {
                        examCards.push({
                            id: `ett-${e.id}`,
                            date: new Date(c.created_at).toLocaleDateString(),
                            type: 'ETT (Echo cardiaque)',
                            result: `FEVG: ${e.ett_fevg || 'N/A'}%, ${e.ett_interpretation || ''}`,
                            file: e.ett_files && e.ett_files.length > 0 ? e.ett_files[0] : null
                        });
                    }
                }
            });
            setExams(examCards);

            const grouped: PrescriptionGroup[] = [];
            cData?.forEach((c: any) => {
                c.prescriptions?.forEach((pr: any) => {
                    if (pr.items && pr.items.length > 0) {
                        grouped.push({
                            id: pr.id,
                            date: new Date(pr.created_at).toLocaleDateString(),
                            meds: pr.items.map((it: any) => `${it.drug} ${it.dosage}`),
                            status: 'Active'
                        });
                    }
                });
            });
            setPrescriptionsGrouped(grouped);

            if (cData && cData.length > 0) {
                setLatestExam(cData[0].clinical_exam || null);
            }

            // Load Settings & User
            const settingsData = await systemService.getSettings();
            if (settingsData && settingsData.success !== false) {
                setClinicSettings(settingsData.data || settingsData);
            }

            const userDataStr = localStorage.getItem('cardio_user');
            if (userDataStr) {
                setCurrentUser(JSON.parse(userDataStr));
            }
        } catch (err) {
            console.error('Failed to load patient details:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [id]);

    const handleExportPDF = () => {
        if (!patient) return;
        const doctorName = currentUser?.full_name || 'Dr. Cyrille Mbida';
        generatePatientDetailsPDF(patient, doctorName, clinicSettings);
    };
    
    const handlePrintPrescription = (prescription: PrescriptionGroup) => {
        if (patient) generatePrescriptionPDF(prescription, patient.full_name);
    };

    const handleDownloadFile = (fileName: string) => {
        if (!fileName) return;
        fileService.downloadFile(fileName);
    };

    const [isExamModalOpen, setIsExamModalOpen] = useState(false);

    // Shared Components
    const TabButton = ({ id, label, icon }: { id: Tab, label: string, icon: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all font-bold text-xs uppercase tracking-widest ${
                activeTab === id 
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50' 
                : 'border-transparent text-gray-400 hover:text-emerald-500 hover:bg-gray-50'
            }`}
        >
            <span className="material-symbols-outlined text-lg">{icon}</span>
            {label}
        </button>
    );

    if (isLoading || !patient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-emerald-800 font-bold uppercase tracking-tighter text-xs">Initialisation du dossier...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-slate-900">
            {/* White Header with Green Accents */}
            <header className="flex items-center justify-between bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/patients')} className="p-2 hover:bg-emerald-50 rounded-full text-emerald-600 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="h-8 w-[2px] bg-gray-100 mx-2"></div>
                    <h2 className="text-emerald-600 text-xl font-black tracking-tighter">CARDIO<span className="text-emerald-900">MED</span></h2>
                </div>

                <div className="hidden md:flex items-center bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Dossier Actif:</span>
                    <span className="ml-2 text-xs font-bold text-emerald-900">{patient.patient_id}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right mr-2 hidden sm:block">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Connecté en tant que</p>
                        <p className="text-xs font-bold text-emerald-800">Dr. Mbida</p>
                    </div>
                    <div className="size-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black shadow-md border-2 border-white">
                        AM
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto w-full p-6 grid grid-cols-12 gap-8">
                {/* Profile Sidebar */}
                <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm text-center">
                        <div className="size-24 rounded-2xl bg-emerald-600 mx-auto flex items-center justify-center text-white text-3xl font-black mb-4 shadow-lg shadow-emerald-200">
                            {(patient.full_name || 'P').charAt(0)}
                        </div>
                        <h1 className="text-xl font-bold text-emerald-950 mb-1">{patient.full_name || 'Patient Inconnu'}</h1>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6">Patient Enregistré</p>
                        
                        <div className="space-y-4 text-left">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Âge / Genre</p>
                                <p className="text-sm font-bold text-emerald-900">{patient.age} ans • {patient.gender}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Tél. Urgence</p>
                                <p className="text-sm font-bold text-emerald-900">{patient.emergency_contact || 'Non renseigné'}</p>
                            </div>
                        </div>

                        <button onClick={() => navigate(`/patients/edit/${id}`)} className="w-full mt-8 py-3 bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all">
                            Modifier Profil
                        </button>
                    </div>
                </aside>

                {/* Dashboard Area */}
                <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-3xl font-black text-emerald-950 tracking-tighter">Santé Cardiaque</h2>
                            <p className="text-emerald-600/70 text-sm font-medium">Suivi clinique et résultats d'examens</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all">
                                <span className="material-symbols-outlined text-lg">download</span> PDF
                            </button>
                            <button onClick={() => navigate(`/consultations/new/${id}`)} className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
                                <span className="material-symbols-outlined text-lg">add</span> Consultation
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <TabButton id="overview" label="Vue d'ensemble" icon="grid_view" />
                        <TabButton id="consultations" label="Historique" icon="history" />
                        <TabButton id="exams" label="Examens & ECG" icon="monitor_heart" />
                        <TabButton id="prescriptions" label="Ordonnances" icon="medication" />
                    </nav>

                    {/* Content Switcher */}
                    <div className="min-h-[400px]">
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* BP Card */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-rose-500">
                                    <div className="flex justify-between mb-4">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Pression Artérielle</span>
                                        <span className="material-symbols-outlined text-rose-500">blood_pressure</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-emerald-950">
                                        {latestExam ? `${latestExam.bp_sys}/${latestExam.bp_dia}` : '--/--'}
                                        <span className="text-xs text-gray-400 ml-2">mmHg</span>
                                    </h3>
                                </div>
                                {/* Heart Rate Card */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-emerald-500">
                                    <div className="flex justify-between mb-4">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Fréquence</span>
                                        <span className="material-symbols-outlined text-emerald-500">favorite</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-emerald-950">
                                        {latestExam?.heart_rate || '--'}
                                        <span className="text-xs text-gray-400 ml-2">bpm</span>
                                    </h3>
                                </div>
                                {/* SpO2 Card */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-blue-500">
                                    <div className="flex justify-between mb-4">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Oxygène (SpO2)</span>
                                        <span className="material-symbols-outlined text-blue-500">air</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-emerald-950">
                                        {latestExam?.spo2 || '--'}
                                        <span className="text-xs text-gray-400 ml-2">%</span>
                                    </h3>
                                </div>

                                {/* Clinical Notes (Large) */}
                                <div className="md:col-span-2 bg-emerald-900 rounded-3xl p-8 text-white shadow-xl shadow-emerald-100">
                                    <div className="flex items-center gap-2 mb-4 opacity-70">
                                        <span className="material-symbols-outlined text-sm">description</span>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest">Observations Cliniques</h4>
                                    </div>
                                    <p className="text-lg font-medium leading-relaxed italic">
                                        "{latestExam?.notes || "Aucune note disponible pour ce patient."}"
                                    </p>
                                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-xs font-bold text-emerald-300">Dernière mise à jour : {latestExam ? new Date(latestExam.created_at).toLocaleDateString() : 'N/A'}</span>
                                        <Button variant="outline" className="border-emerald-400 text-emerald-400 hover:bg-emerald-800 text-[10px]">Historique complet</Button>
                                    </div>
                                </div>

                                {/* Risk Factors */}
                                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                                    <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-4">Facteurs de Risque</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {['HTA', 'Diabète', 'Tabac'].map(f => (
                                            <span key={f} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold border border-rose-100">
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'consultations' && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-emerald-800 uppercase">Date</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-emerald-800 uppercase">Motif</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-emerald-800 uppercase">Diagnostic</th>
                                            <th className="px-6 py-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {consultations.map((c) => (
                                            <tr key={c.id} className="hover:bg-emerald-50/30 transition-colors">
                                                <td className="px-6 py-4 text-sm font-bold text-emerald-950">{new Date(c.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-xs font-medium text-gray-500">{c.reason}</td>
                                                <td className="px-6 py-4 text-xs italic text-emerald-700">{c.diagnostic_result?.diagnosis || 'En attente'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => navigate(`/consultations/${c.id}`)} className="text-emerald-600 hover:scale-110 transition-transform">
                                                        <span className="material-symbols-outlined">visibility</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        {activeTab === 'exams' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                                {exams.length > 0 ? exams.map((exam) => (
                                    <div key={exam.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                                    <span className="material-symbols-outlined text-xl">monitor_heart</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{exam.type}</p>
                                                    <p className="text-sm font-bold text-emerald-950">{exam.date}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-4">
                                            <p className="text-xs font-medium text-gray-600 line-clamp-3">"{exam.result}"</p>
                                        </div>
                                        {exam.file && (
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <span className="material-symbols-outlined text-sm">attachment</span>
                                                    <span className="text-[10px] font-bold truncate max-w-[150px]">{exam.file}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleDownloadFile(exam.file)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-xs">download</span>
                                                    Télécharger
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="col-span-2 py-20 text-center">
                                        <p className="text-gray-400 font-medium italic">Aucun examen enregistré pour ce patient.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'prescriptions' && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                {prescriptionsGrouped.length > 0 ? prescriptionsGrouped.map((p) => (
                                    <div key={p.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-colors">
                                        <div className="flex items-center gap-6">
                                            <div className="size-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                                                <span className="material-symbols-outlined">medication</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-emerald-950">Ordonnance du {p.date}</p>
                                                <p className="text-xs text-gray-500">{p.meds.join(', ')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handlePrintPrescription(p)}
                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                title="Imprimer"
                                            >
                                                <span className="material-symbols-outlined">print</span>
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center">
                                        <p className="text-gray-400 font-medium italic">Historique des ordonnances vide.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Grounded Green Modal */}
            {isExamModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-emerald-600 p-6 text-white">
                            <h3 className="text-xl font-black tracking-tight">Nouvel Examen Rapide</h3>
                            <p className="text-emerald-100 text-xs">Saisie directe des résultats cliniques</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2 block">Type d'examen</label>
                                <select className="w-full bg-emerald-50 border-b-2 border-emerald-200 focus:border-emerald-600 outline-none p-3 text-sm font-bold transition-all">
                                    <option>Electrocardiogramme (ECG)</option>
                                    <option>Echographie (ETT)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2 block">Interprétation clinique</label>
                                <textarea 
                                    className="w-full bg-emerald-50 border-b-2 border-emerald-200 focus:border-emerald-600 outline-none p-3 text-sm min-h-[100px] transition-all"
                                    placeholder="Décrivez les observations..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setIsExamModalOpen(false)} className="flex-1 py-3 text-gray-400 font-bold text-xs uppercase hover:text-gray-600 transition-colors">Annuler</button>
                                <button className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">Enregistrer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};