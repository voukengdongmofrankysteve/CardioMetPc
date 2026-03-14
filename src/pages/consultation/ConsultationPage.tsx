import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientService, consultationService, prescriptionService } from '../../services/api';

interface Prescription {
    id: number;
    drug: string;
    dosage: string;
    frequency: string;
    duration: string;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const ConsultationPage: React.FC = () => {
    const navigate = useNavigate();
    const { patientId: routePatientId } = useParams<{ patientId: string }>();
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [patientId, setPatientId] = useState<string | undefined>(routePatientId);
    const [patientInfo, setPatientInfo] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Patient Search State
    const [patientSearch, setPatientSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Consultation States
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [consultationReason, setConsultationReason] = useState('');
    const [examData, setExamData] = useState({
        bpSys: '', bpDia: '', heartRate: '', weight: '', height: '',
        temp: '', spo2: '', bmi: '',
        auscultation: '', heartSounds: 'Normal', edema: 'None', jvp: 'Normal',
        pulmonaryAuscultation: '', notes: ''
    });
    const [ecgData, setEcgData] = useState({ 
        rhythm: 'Sinusal', axis: 'Normal', prInterval: '', qrsDuration: '', qtc: '', 
        stSegment: 'Isoelectric', tWave: 'Normal', interpretation: '', findings: '',
        filePath: '' as string | null,
        fileObject: null as File | null
    });
    const [ettData, setEttData] = useState({ 
        lvedd: '', lvesd: '', ef: '', 
        aorticValve: 'Normal', mitralValve: 'Normal', tricuspidValve: 'Normal',
        wallMotion: 'Normal', pericardium: 'Normal', interpretation: '',
        filePath: '' as string | null,
        fileObject: null as File | null
    });
    const [scores, setScores] = useState({ 
        chadsVasc: 0, hasBled: 0, cvRisk: 'Low', nyha: 'Classe I',
        graceScore: '', crusadeScore: ''
    });
    const [diagnosticData, setDiagnosticData] = useState({ 
        primaryDiagnosis: '', secondaryDiagnosis: '',
        cardiacStatus: 'Stable', notes: '' 
    });
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [newPrescription, setNewPrescription] = useState({ drug: '', dosage: '', frequency: '', duration: '' });
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

    useEffect(() => {
        if (patientId) {
            console.log(isLoadingTemplates);
            const dbId = parseInt(patientId);
            patientService.getPatientById(dbId).then(data => {
                setPatientInfo(data);
                if (currentStep === 1) setCurrentStep(2);
            });
        }
    }, [patientId]);

    useEffect(() => {
        setIsLoadingTemplates(true);
        prescriptionService.getTemplates()
            .then(data => {
                if (data && Array.isArray(data)) {
                    setTemplates(data);
                }
            })
            .finally(() => setIsLoadingTemplates(false));
    }, []);

    const handlePatientSearch = async (query: string) => {
        setPatientSearch(query);
        if (query.length > 1) {
            setIsSearching(true);
            try {
                const results = await patientService.searchPatients(query);
                setSearchResults(results);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    // Automatic BMI Calculation
    useEffect(() => {
        console.log(errors)
        console.log(isSearching)
        console.log(isLoadingTemplates)
        console.log(patientInfo)
        const weight = parseFloat(examData.weight);
        const height = parseFloat(examData.height) / 100; // cm to m
        if (weight > 0 && height > 0) {
            const bmiValue = (weight / (height * height)).toFixed(1);
            if (examData.bmi !== bmiValue) {
                setExamData(prev => ({ ...prev, bmi: bmiValue }));
            }
        }
    }, [examData.weight, examData.height]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'ecg' | 'ett') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'ecg') {
            setEcgData({ ...ecgData, fileObject: file });
        } else {
            setEttData({ ...ettData, fileObject: file });
        }
    };

    const addPrescription = () => {
        if (newPrescription.drug && newPrescription.dosage) {
            setPrescriptions([...prescriptions, { ...newPrescription, id: Date.now() }]);
            setNewPrescription({ drug: '', dosage: '', frequency: '', duration: '' });
        }
    };

    const applyTemplate = (template: any) => {
        const templateMeds = (template.medications || []).map((m: any) => ({
            id: Date.now() + Math.random(),
            drug: m.drug || m.name,
            dosage: m.dosage || '',
            frequency: m.frequency || '',
            duration: m.duration || ''
        }));
        setPrescriptions([...prescriptions, ...templateMeds]);
    };

    const removePrescription = (id: number) => {
        setPrescriptions(prescriptions.filter(p => p.id !== id));
    };

    const steps = [
        { id: 1, label: 'Sélection Patient' },
        { id: 2, label: 'Interrogatoire' },
        { id: 3, label: 'Examen Clinique' },
        { id: 4, label: 'ECG / ETT' },
        { id: 5, label: 'Scores' },
        { id: 6, label: 'Diagnostic' },
        { id: 7, label: 'Traitement' },
    ];

    const validateStep = (step: Step): boolean => {
        const newErrors: Record<string, string> = {};
        if (step === 1 && !patientId) newErrors.patientId = 'Requis';
        if (step === 2 && !consultationReason.trim()) newErrors.consultationReason = 'Requis';
        if (step === 3 && (!examData.bpSys || !examData.heartRate)) newErrors.exam = 'Requis';
        if (step === 6 && !diagnosticData.primaryDiagnosis) newErrors.primaryDiagnosis = 'Requis';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => validateStep(currentStep) && currentStep < 7 && setCurrentStep((prev) => (prev + 1) as Step);
    const prevStep = () => currentStep > 1 && setCurrentStep((prev) => (prev - 1) as Step);

    const handleComplete = async () => {
        if (!validateStep(currentStep) || !patientId) return;
        setIsSaving(true);
        
        try {
            // Prepare FormData for integrated file upload
            const formData = new FormData();
            formData.append('patient_id', patientId || '');
            formData.append('reason', consultationReason || 'Checkup Cardiology');
            
            // Add Clinical Exam
            Object.entries(examData).forEach(([key, value]) => {
                // Convert camelCase to snake_case for Laravel if necessary, 
                // but let's see what the backend expects. 
                // The backend uses bp_sys, heart_rate, etc.
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                formData.append(`clinical_exam[${snakeKey}]`, (value || '').toString());
            });

            // Add ECG/ETT Exam (Fields)
            formData.append('ecg_ett_exam[ecg_interpretation]', ecgData.interpretation || '');
            formData.append('ecg_ett_exam[ecg_rhythm]', ecgData.rhythm || '');
            formData.append('ecg_ett_exam[ecg_axis]', ecgData.axis || '');
            formData.append('ecg_ett_exam[ecg_pr_interval]', ecgData.prInterval || '');
            formData.append('ecg_ett_exam[ecg_qtc]', ecgData.qtc || '');
            formData.append('ecg_ett_exam[ett_fevg]', ettData.ef || '');
            formData.append('ecg_ett_exam[ett_lvedd]', ettData.lvedd || '');
            formData.append('ecg_ett_exam[ett_lvesd]', ettData.lvesd || '');
            formData.append('ecg_ett_exam[ett_aortic_valve]', ettData.aorticValve || '');
            formData.append('ecg_ett_exam[ett_mitral_valve]', ettData.mitralValve || '');
            formData.append('ecg_ett_exam[ett_wall_motion]', ettData.wallMotion || '');
            formData.append('ecg_ett_exam[ett_interpretation]', ettData.interpretation || '');

            // Add Files (at root or nested? Laravel expects ecg_files[] at root if sent as multipart)
            if (ecgData.fileObject) {
                formData.append('ecg_files[]', ecgData.fileObject);
            }
            if (ettData.fileObject) {
                formData.append('ett_files[]', ettData.fileObject);
            }

            // Add Diagnostic Results
            formData.append('diagnostic_result[primary_diagnosis]', diagnosticData.primaryDiagnosis || '');
            formData.append('diagnostic_result[nyha_class]', scores.nyha || '');
            formData.append('diagnostic_result[cardiac_status]', diagnosticData.cardiacStatus || '');
            formData.append('diagnostic_result[notes]', diagnosticData.notes || '');

            // Add Scores
            formData.append('scores[chads_vasc]', scores.chadsVasc.toString());
            formData.append('scores[has_bled]', scores.hasBled.toString());
            formData.append('scores[cv_risk]', scores.cvRisk);
            formData.append('scores[grace_score]', scores.graceScore || '');
            formData.append('scores[crusade_score]', scores.crusadeScore || '');

            const result = await consultationService.saveConsultation(formData);
            
            if (result && result.success !== false) {
                const consultationId = result.id || result.data?.id;
                // If there are prescriptions, save them separately
                if (prescriptions.length > 0 && consultationId) {
                    await prescriptionService.savePrescription(prescriptions, patientId, consultationId);
                }

                alert('Consultation enregistrée avec succès !');
                navigate(`/patients/${patientId}`);
            } else {
                setErrors({ submit: result?.message || 'Une erreur est survenue lors de l\'enregistrement.' });
            }
        } catch (error) {
            console.error('Failed to save consultation:', error);
            setErrors({ submit: 'Une erreur est survenue lors de l\'enregistrement.' });
        } finally {
            setIsSaving(false);
        }
    };

    // Reusable Input Class for "Grounded Green" UI Pattern
    const inputClasses = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-green-500/10 focus:border-[#22c55e] text-slate-800 transition-all outline-none placeholder:text-slate-400";

    return (
        <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900">
            {/* Navigation Header */}
            <header className="flex items-center justify-between border-b border-slate-100 bg-white px-8 py-4 sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="text-[#22c55e] hover:bg-green-50 p-2 rounded-full transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-[#22c55e] rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xl">cardiology</span>
                        </div>
                        <h2 className="text-slate-900 text-lg font-bold tracking-tight">CARDIOMED</h2>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-900">Dr. Jean Dupont</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">Cardiologue</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-100 border-2 border-white shadow-sm flex items-center justify-center text-[#22c55e] font-bold">JD</div>
                </div>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full p-8 flex flex-col gap-8">
                {/* Stepper (White Background, Green Progress) */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="relative flex justify-between items-center px-4">
                        <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-100 -translate-y-1/2 -z-0">
                            <div className="h-full bg-[#22c55e] transition-all duration-500" style={{ width: `${((currentStep - 1) / 6) * 100}%` }}></div>
                        </div>
                        {steps.map((step) => (
                            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2 ${currentStep >= step.id ? 'bg-[#22c55e] border-[#22c55e] text-white shadow-lg shadow-green-200' : 'bg-white border-slate-200 text-slate-400'}`}>
                                    {currentStep > step.id ? <span className="material-symbols-outlined text-lg">check</span> : step.id}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${currentStep === step.id ? 'text-[#22c55e]' : 'text-slate-400'}`}>{step.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900">{steps[currentStep - 1].label}</h3>
                            <p className="text-sm text-slate-500">Veuillez compléter les informations requises.</p>
                        </div>
                        <span className="px-4 py-1.5 bg-green-50 text-[#22c55e] rounded-full text-xs font-bold uppercase tracking-widest">Étape {currentStep} / 7</span>
                    </div>

                    <div className="p-10 min-h-[400px]">
                        {currentStep === 1 && (
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                                    <input 
                                        className={inputClasses + " pl-12 h-14 text-lg"} 
                                        placeholder="Rechercher par nom ou ID..." 
                                        value={patientSearch}
                                        onChange={(e) => handlePatientSearch(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-3">
                                    {searchResults.map((p) => (
                                        <button key={p.id} onClick={() => { setPatientId(p.id.toString()); nextStep(); }} className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-[#22c55e] hover:bg-green-50/30 transition-all text-left group">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-green-100 text-[#22c55e] flex items-center justify-center font-bold text-xl">{p.full_name[0]}</div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{p.full_name}</p>
                                                    <p className="text-xs text-slate-500 uppercase tracking-tighter">ID: {p.patient_id} • {p.age} ans</p>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-[#22c55e] opacity-0 group-hover:opacity-100 transition-all">arrow_forward</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motif de Consultation</label>
                                    <textarea className={inputClasses + " min-h-[150px] resize-none"} placeholder="Saisir le motif détaillé..." value={consultationReason} onChange={(e) => setConsultationReason(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Classe NYHA</label>
                                        <select className={inputClasses} value={scores.nyha} onChange={e => setScores({ ...scores, nyha: e.target.value })}>
                                            <option>Classe I</option><option>Classe II</option><option>Classe III</option><option>Classe IV</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Systolique (mmHg)</label>
                                        <input type="number" className={inputClasses} placeholder="120" value={examData.bpSys} onChange={e => setExamData({ ...examData, bpSys: e.target.value })} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Diastolique (mmHg)</label>
                                        <input type="number" className={inputClasses} placeholder="80" value={examData.bpDia} onChange={e => setExamData({ ...examData, bpDia: e.target.value })} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fréquence (bpm)</label>
                                        <input type="number" className={inputClasses} placeholder="70" value={examData.heartRate} onChange={e => setExamData({ ...examData, heartRate: e.target.value })} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">SpO2 (%)</label>
                                        <input type="number" className={inputClasses} placeholder="98" value={examData.spo2} onChange={e => setExamData({ ...examData, spo2: e.target.value })} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Poids (kg)</label>
                                        <input type="number" className={inputClasses} placeholder="70" value={examData.weight} onChange={e => setExamData({ ...examData, weight: e.target.value })} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Taille (cm)</label>
                                        <input type="number" className={inputClasses} placeholder="175" value={examData.height} onChange={e => setExamData({ ...examData, height: e.target.value })} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Température (°C)</label>
                                        <input type="number" className={inputClasses} placeholder="37" value={examData.temp} onChange={e => setExamData({ ...examData, temp: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black text-slate-900 border-l-4 border-[#22c55e] pl-3 uppercase tracking-wider">Examen Cardiaque</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bruits du Cœur</label>
                                                <select className={inputClasses} value={examData.heartSounds} onChange={e => setExamData({ ...examData, heartSounds: e.target.value })}>
                                                    <option>Normal</option>
                                                    <option>B3 (S3)</option>
                                                    <option>B4 (S4)</option>
                                                    <option>Souffle (Murmur)</option>
                                                    <option>Frottement</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Turgescence Jugulaire</label>
                                                <select className={inputClasses} value={examData.jvp} onChange={e => setExamData({ ...examData, jvp: e.target.value })}>
                                                    <option>Normal</option>
                                                    <option>Élevée (Elevated)</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Auscultation Cardiaque (Détails)</label>
                                                <textarea className={inputClasses + " h-24 resize-none"} placeholder="Détails de l'auscultation..." value={examData.auscultation} onChange={e => setExamData({ ...examData, auscultation: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black text-slate-900 border-l-4 border-blue-500 pl-3 uppercase tracking-wider">Examen Pulmonaire & Signes HF</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Oedèmes (MI)</label>
                                                <select className={inputClasses} value={examData.edema} onChange={e => setExamData({ ...examData, edema: e.target.value })}>
                                                    <option>Absence</option>
                                                    <option>1+ (Discret)</option>
                                                    <option>2+ (Modéré)</option>
                                                    <option>3+ (Important)</option>
                                                    <option>4+ (Anasarque)</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Auscultation Pulmonaire</label>
                                                <textarea className={inputClasses + " h-24 resize-none"} placeholder="Murmure vésiculaire, râles crépitants..." value={examData.pulmonaryAuscultation} onChange={e => setExamData({ ...examData, pulmonaryAuscultation: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Autres Notes Cliniques</label>
                                    <textarea className={inputClasses + " min-h-[80px]"} value={examData.notes} onChange={e => setExamData({ ...examData, notes: e.target.value })} />
                                </div>
                            </div>
                        )}

                        {currentStep === 7 && (
                            <div className="space-y-6">
                                {/* Templates Section */}
                                {templates.length > 0 && (
                                    <div className="bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100/50">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-symbols-outlined text-emerald-600 text-sm">auto_awesome</span>
                                            <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em]">Protocoles Rapides</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {templates.map(t => (
                                                <button 
                                                    key={t.id}
                                                    onClick={() => applyTemplate(t)}
                                                    className="px-4 py-2 bg-white border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm flex items-center gap-2 group"
                                                >
                                                    {t.label}
                                                    <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-all">add</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-5 gap-4 items-end bg-green-50/50 p-6 rounded-2xl border border-green-100">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Médicament</label>
                                        <input className={inputClasses} placeholder="Ex: Ramipril" value={newPrescription.drug} onChange={e => setNewPrescription({...newPrescription, drug: e.target.value})} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dosage</label>
                                        <input className={inputClasses} placeholder="Ex: 5mg" value={newPrescription.dosage} onChange={e => setNewPrescription({...newPrescription, dosage: e.target.value})} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fréquence</label>
                                        <input className={inputClasses} placeholder="1-0-1" value={newPrescription.frequency} onChange={e => setNewPrescription({...newPrescription, frequency: e.target.value})} />
                                    </div>
                                    <button onClick={addPrescription} className="h-[46px] bg-[#22c55e] text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#16a34a] transition-all">Ajouter</button>
                                </div>
                                <div className="space-y-3">
                                    {prescriptions.map(p => (
                                        <div key={p.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-green-200">
                                            <span className="font-bold text-slate-800">{p.drug} <span className="text-[#22c55e] font-medium mx-2">—</span> {p.dosage} ({p.frequency})</span>
                                            <button onClick={() => removePrescription(p.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {currentStep === 4 && (
                            <div className="space-y-10">
                                {/* ECG Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                        <div className="size-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined">ecg_heart</span>
                                        </div>
                                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Électrocardiogramme (ECG)</h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rythme</label>
                                                <select className={inputClasses} value={ecgData.rhythm} onChange={e => setEcgData({ ...ecgData, rhythm: e.target.value })}>
                                                    <option>Sinusal</option>
                                                    <option>Fibrillation Atriale (FA)</option>
                                                    <option>Flutter Atrial</option>
                                                    <option>Tachycardie Ventriculaire</option>
                                                    <option>Bloc Auriculo-Ventriculaire (BAV)</option>
                                                    <option>Autre</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Axe QRS</label>
                                                <select className={inputClasses} value={ecgData.axis} onChange={e => setEcgData({ ...ecgData, axis: e.target.value })}>
                                                    <option>Normal</option>
                                                    <option>Déviation Gauche</option>
                                                    <option>Déviation Droite</option>
                                                    <option>Indéterminé</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Espace PR (ms)</label>
                                                <input type="number" className={inputClasses} placeholder="160" value={ecgData.prInterval} onChange={e => setEcgData({ ...ecgData, prInterval: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">QTc (ms)</label>
                                                <input type="number" className={inputClasses} placeholder="420" value={ecgData.qtc} onChange={e => setEcgData({ ...ecgData, qtc: e.target.value })} />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Interprétation ECG</label>
                                                <textarea className={inputClasses + " h-24 resize-none"} placeholder="Saisir l'interprétation..." value={ecgData.interpretation} onChange={e => setEcgData({ ...ecgData, interpretation: e.target.value })} />
                                            </div>
                                        </div>
                                        
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center gap-4 border-dashed">
                                            <div className="size-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400">
                                                <span className="material-symbols-outlined text-3xl">upload_file</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Document ECG</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-black mt-1">PDF, JPG, PNG (Max 5MB)</p>
                                            </div>
                                            <input type="file" id="ecg-upload" className="hidden" onChange={(e) => handleFileSelect(e, 'ecg')} />
                                            <label htmlFor="ecg-upload" className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#22c55e] hover:bg-green-50 transition-all cursor-pointer">
                                                {ecgData.fileObject ? 'Remplacer' : 'Parcourir'}
                                            </label>
                                            {ecgData.fileObject && <p className="text-[10px] font-bold text-[#22c55e] mt-2">✓ {ecgData.fileObject.name}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* ETT Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                        <div className="size-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined">monitor_heart</span>
                                        </div>
                                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Échographie-Doppler Transthoracique (ETT)</h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">FEVG (%)</label>
                                                <input type="number" className={inputClasses} placeholder="60" value={ettData.ef} onChange={e => setEttData({ ...ettData, ef: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">DTDvG (mm)</label>
                                                <input type="number" className={inputClasses} placeholder="45" value={ettData.lvedd} onChange={e => setEttData({ ...ettData, lvedd: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">DTSvG (mm)</label>
                                                <input type="number" className={inputClasses} placeholder="30" value={ettData.lvesd} onChange={e => setEttData({ ...ettData, lvesd: e.target.value })} />
                                            </div>
                                            
                                            <div className="col-span-3 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Valve Aortique</label>
                                                    <select className={inputClasses} value={ettData.aorticValve} onChange={e => setEttData({ ...ettData, aorticValve: e.target.value })}>
                                                        <option>Normal</option>
                                                        <option>Sténose Aortique</option>
                                                        <option>Insuffisance Aortique</option>
                                                        <option>Bicuspidie</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Valve Mitrale</label>
                                                    <select className={inputClasses} value={ettData.mitralValve} onChange={e => setEttData({ ...ettData, mitralValve: e.target.value })}>
                                                        <option>Normal</option>
                                                        <option>Sténose Mitrale</option>
                                                        <option>Insuffisance Mitrale</option>
                                                        <option>Prolapsus</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="col-span-3">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cinétique Segmentaire</label>
                                                <select className={inputClasses} value={ettData.wallMotion} onChange={e => setEttData({ ...ettData, wallMotion: e.target.value })}>
                                                    <option>Normocinétique</option>
                                                    <option>Hypocinésie</option>
                                                    <option>Akinésie</option>
                                                    <option>Dyskinesie</option>
                                                </select>
                                            </div>

                                            <div className="col-span-3">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Interprétation ETT</label>
                                                <textarea className={inputClasses + " h-24 resize-none"} placeholder="Saisir l'interprétation détaillée..." value={ettData.interpretation} onChange={e => setEttData({ ...ettData, interpretation: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center gap-4 border-dashed">
                                            <div className="size-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400">
                                                <span className="material-symbols-outlined text-3xl">image</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Rapport ETT</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-black mt-1">Image ou PDF (Max 10MB)</p>
                                            </div>
                                            <input type="file" id="ett-upload" className="hidden" onChange={(e) => handleFileSelect(e, 'ett')} />
                                            <label htmlFor="ett-upload" className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#22c55e] hover:bg-green-50 transition-all cursor-pointer">
                                                {ettData.fileObject ? 'Remplacer' : 'Parcourir'}
                                            </label>
                                            {ettData.fileObject && <p className="text-[10px] font-bold text-[#22c55e] mt-2">✓ {ettData.fileObject.name}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 5 && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* CHADS-VASC Score */}
                                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                                                    <span className="material-symbols-outlined">calculate</span>
                                                </div>
                                                <h4 className="font-black text-slate-900 uppercase tracking-tight">Score CHADS₂-VASc</h4>
                                            </div>
                                            <div className="text-2xl font-black text-[#22c55e] bg-white size-12 rounded-xl flex items-center justify-center shadow-sm border border-slate-100">{scores.chadsVasc}</div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-wider">Évaluation du risque thromboembolique (FA)</p>
                                            <input 
                                                type="range" min="0" max="9" step="1" 
                                                className="w-full accent-[#22c55e]" 
                                                value={scores.chadsVasc} 
                                                onChange={e => setScores({ ...scores, chadsVasc: parseInt(e.target.value) })} 
                                            />
                                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                                                <span>Risque Faible (0)</span>
                                                <span>Risque Élevé (9)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* HAS-BLED Score */}
                                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                                                    <span className="material-symbols-outlined">blood_pressure</span>
                                                </div>
                                                <h4 className="font-black text-slate-900 uppercase tracking-tight">Score HAS-BLED</h4>
                                            </div>
                                            <div className="text-2xl font-black text-red-500 bg-white size-12 rounded-xl flex items-center justify-center shadow-sm border border-slate-100">{scores.hasBled}</div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-wider">Évaluation du risque hémorragique</p>
                                            <input 
                                                type="range" min="0" max="9" step="1" 
                                                className="w-full accent-red-500" 
                                                value={scores.hasBled} 
                                                onChange={e => setScores({ ...scores, hasBled: parseInt(e.target.value) })} 
                                            />
                                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                                                <span>Risque Faible</span>
                                                <span>Risque Élevé</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3 text-center">Risque Cardiovasculaire</label>
                                        <div className="flex gap-2">
                                            {['Low', 'Moderate', 'High', 'Very High'].map(risk => (
                                                <button 
                                                    key={risk} 
                                                    onClick={() => setScores({...scores, cvRisk: risk})}
                                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scores.cvRisk === risk ? 'bg-[#22c55e] text-white shadow-lg shadow-green-200' : 'bg-white text-slate-400 border border-slate-100 hover:border-green-200'}`}
                                                >
                                                    {risk}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Score GRACE (SCA)</label>
                                        <input type="number" className={inputClasses} placeholder="Score total..." value={scores.graceScore} onChange={e => setScores({ ...scores, graceScore: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Score CRUSADE</label>
                                        <input type="number" className={inputClasses} placeholder="Score total..." value={scores.crusadeScore} onChange={e => setScores({ ...scores, crusadeScore: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 6 && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Diagnostic Principal</label>
                                            <input className={inputClasses} placeholder="Ex: Insuffisance Cardiaque à FE réduite" value={diagnosticData.primaryDiagnosis} onChange={e => setDiagnosticData({ ...diagnosticData, primaryDiagnosis: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Diagnostics Secondaires / Comorbidités</label>
                                            <textarea className={inputClasses + " h-32 resize-none"} placeholder="HTA, Diabète, Tabagisme..." value={diagnosticData.secondaryDiagnosis} onChange={e => setDiagnosticData({ ...diagnosticData, secondaryDiagnosis: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="space-y-6 bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                        <h4 className="text-sm font-black text-slate-900 border-l-4 border-[#22c55e] pl-3 uppercase tracking-wider mb-6">Staut & Planification</h4>
                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold text-slate-500 uppercase">Statut Clinique</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['Stable', 'Amélioration', 'Aggravation', 'Aiguë'].map(status => (
                                                    <button 
                                                        key={status} 
                                                        onClick={() => setDiagnosticData({...diagnosticData, cardiacStatus: status})}
                                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${diagnosticData.cardiacStatus === status ? 'bg-[#22c55e] text-white' : 'bg-white text-slate-400 border border-slate-100 hover:border-green-200'}`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Notes de Suivi / Plan</label>
                                            <textarea className={inputClasses + " h-24 bg-white"} placeholder="Hospitalisation si nécessaire, prochain RDV..." value={diagnosticData.notes} onChange={e => setDiagnosticData({ ...diagnosticData, notes: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <button onClick={() => navigate(-1)} className="text-slate-400 font-bold uppercase text-xs tracking-widest hover:text-slate-600">Annuler</button>
                        <div className="flex gap-4">
                            {currentStep > 1 && (
                                <button onClick={prevStep} className="px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-white hover:border-[#22c55e] hover:text-[#22c55e] transition-all">
                                    Retour
                                </button>
                            )}
                            <button
                                onClick={currentStep === 7 ? handleComplete : nextStep}
                                disabled={isSaving}
                                className="px-10 py-3 bg-[#22c55e] text-white rounded-xl font-bold text-xs uppercase tracking-[0.15em] shadow-lg shadow-green-200 hover:bg-[#16a34a] disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {isSaving ? 'Enregistrement...' : currentStep === 7 ? 'Terminer la consultation' : 'Étape Suivante'}
                                {!isSaving && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};