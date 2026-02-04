import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../../services/database';

interface ConsultationPageProps {
    patientId?: string; // This is the DB ID (number) or Patient Code (string)
    onBack?: () => void;
    onComplete?: () => void;
    onViewDetails?: (id: string) => void;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const ConsultationPage: React.FC<ConsultationPageProps> = ({
    patientId: initialPatientId,
    onBack,
    onComplete,
    onViewDetails
}) => {
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [patientId, setPatientId] = useState<string | undefined>(initialPatientId);
    const [patientInfo, setPatientInfo] = useState<any>(null);
    const [latestExamData, setLatestExamData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Patient Search State
    const [patientSearch, setPatientSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Validation State
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [consultationReason, setConsultationReason] = useState('');

    useEffect(() => {
        if (patientId) {
            const dbId = parseInt(patientId);
            DatabaseService.getPatientById(dbId).then(data => {
                setPatientInfo(data);
                // Auto-advance if patient is already selected (e.g. from PatientPage)
                if (currentStep === 1) setCurrentStep(2);
            });

            DatabaseService.getLatestExamDataForPatient(dbId).then(data => {
                setLatestExamData(data);
            });
        }
    }, [patientId]);

    const handlePatientSearch = async (query: string) => {
        setPatientSearch(query);
        if (query.length > 1) {
            setIsSearching(true);
            try {
                const results = await DatabaseService.searchPatients(query);
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

    const [familyHistoryItems, setFamilyHistoryItems] = useState(['Mort Subite', 'Coronaropathie Précoce', 'Cardiomyopathie']);
    const [newHistoryItem, setNewHistoryItem] = useState('');
    const [lifestyleFactors, setLifestyleFactors] = useState([
        { id: 'smoking', label: 'Statut Tabagique', options: ['Jamais Fumé', 'Ancien Fumeur', 'Fumeur Actuel', 'Tabagisme Passif'] },
        { id: 'alcohol', label: "Consommation d'Alcool", options: ['Aucune', 'Occasionnelle', 'Modérée', 'Elevée'] },
        { id: 'activity', label: 'Activité Physique', options: ['Sédentaire', 'Légère (1-2x/semaine)', 'Modérée (3-5x/semaine)', 'Elevée (Quotidienne)'] }
    ]);
    const [newLifestyleLabel, setNewLifestyleLabel] = useState('');

    // Step 2: Examen Clinique State
    const [examData, setExamData] = useState({
        bpSys: '',
        bpDia: '',
        heartRate: '',
        weight: '',
        height: '',
        temp: '',
        spo2: '',
        bmi: '',
        notes: ''
    });

    // Step 3: ECG / ETT State
    const [ecgData, setEcgData] = useState({
        interpretation: '',
        findings: '',
        hasFile: false
    });
    const [ettData, setEttData] = useState({
        interpretation: '',
        aorticRoot: '',
        leftAtrium: '',
        lvedd: '',
        lvesd: '',
        ef: '',
        hasFile: false
    });

    // Step 4: Scores State
    const [scores, setScores] = useState({
        chadsVasc: 0,
        hasBled: 0,
        cvRisk: 'Low',
        nyha: 'Class I'
    });

    // Step 5: Diagnostic State
    const [diagnosticData, setDiagnosticData] = useState({
        primaryDiagnosis: '',
        secondaryDiagnoses: [] as string[],
        notes: ''
    });

    const [availableDiagnoses] = useState([
        'Hypertension Artérielle',
        'Insuffisance Cardiaque',
        'Fibrillation Atriale',
        'Cardiopathie Ischémique',
        'Valvulopathie Mitrale',
        'Valvulopathie Aortique'
    ]);

    // Step 6: Traitement State
    const [prescriptions, setPrescriptions] = useState([
        { id: 1, drug: 'Ramipril', dosage: '5mg', frequency: '1x/jour', duration: '3 mois' },
        { id: 2, drug: 'Bisoprolol', dosage: '2.5mg', frequency: '1x/jour', duration: '3 mois' }
    ]);

    const handleComplete = async () => {
        if (!validateStep(currentStep)) return;
        if (!patientId) return;
        setIsSaving(true);

        try {
            // Calculate BMI
            let bmiValue: number | null = null;
            if (examData.weight && examData.height) {
                const w = parseFloat(examData.weight);
                const h = parseFloat(examData.height) / 100;
                if (w > 0 && h > 0) {
                    bmiValue = parseFloat((w / (h * h)).toFixed(1));
                }
            }

            await DatabaseService.createConsultation({
                patient_db_id: parseInt(patientId),
                doctor_db_id: 1, // Default admin doctor
                reason: consultationReason || 'Routine Cardiology Follow-up',
                status: 'Completed',
                exam: { ...examData, bmi: bmiValue },
                ecg: ecgData,
                ett: ettData,
                diagnostic: { ...diagnosticData, nyha: scores.nyha },
                scores: scores,
                prescriptions: prescriptions
            });
            if (onComplete) onComplete();
        } catch (error) {
            console.error('Failed to save consultation:', error);
            alert('Erreur lors de la sauvegarde de la consultation : ' + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsSaving(false);
        }
    };

    const [newPrescription, setNewPrescription] = useState({
        drug: '',
        dosage: '',
        frequency: '',
        duration: ''
    });

    const addPrescription = () => {
        if (newPrescription.drug && newPrescription.dosage) {
            setPrescriptions([...prescriptions, { ...newPrescription, id: Date.now() }]);
            setNewPrescription({ drug: '', dosage: '', frequency: '', duration: '' });
        }
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

        if (step === 1) {
            if (!patientId) newErrors.patientId = 'Veuillez sélectionner un patient';
        } else if (step === 2) {
            if (!consultationReason.trim()) newErrors.consultationReason = 'Le motif de consultation est obligatoire';
            if (!scores.nyha || scores.nyha === 'Sélectionner la classe NYHA') newErrors.nyha = 'La classe NYHA est obligatoire';
        } else if (step === 3) {
            if (!examData.bpSys) newErrors.bpSys = 'Requis';
            if (!examData.bpDia) newErrors.bpDia = 'Requis';
            if (!examData.heartRate) newErrors.heartRate = 'Requis';
        } else if (step === 6) {
            if (!diagnosticData.primaryDiagnosis) newErrors.primaryDiagnosis = 'Diagnostic principal requis';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 7) setCurrentStep((prev) => (prev + 1) as Step);
        }
    };

    const prevStep = () => {
        setErrors({}); // Clear errors when going back
        if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as Step);
    };

    const addFamilyHistoryItem = () => {
        if (newHistoryItem.trim() && !familyHistoryItems.includes(newHistoryItem.trim())) {
            setFamilyHistoryItems([...familyHistoryItems, newHistoryItem.trim()]);
            setNewHistoryItem('');
        }
    };

    const addLifestyleFactor = () => {
        if (newLifestyleLabel.trim() && !lifestyleFactors.find(f => f.label === newLifestyleLabel.trim())) {
            setLifestyleFactors([...lifestyleFactors, {
                id: `custom-${Date.now()}`,
                label: newLifestyleLabel.trim(),
                options: ['Non précisé', 'Léger', 'Modéré', 'Elevé']
            }]);
            setNewLifestyleLabel('');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f6f8f8] dark:bg-[#10221f] font-sans text-[#0d1b19] dark:text-white">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e7f3f1] dark:border-[#1e3a36] bg-white dark:bg-[#152a26] px-8 py-3 sticky top-0 z-50 shrink-0">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="flex items-center text-[#4c9a8d] hover:text-[#42f0d3] transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="size-6 bg-[#42f0d3] rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-base">cardiology</span>
                        </div>
                        <h2 className="text-[#0d1b19] dark:text-white text-lg font-bold uppercase tracking-tight">CARDIO-EBOGO</h2>
                    </div>
                    <div className="h-6 w-px bg-[#e7f3f1] dark:bg-[#1e3a36]"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-[#4c9a8d]">Nouvelle Consultation</span>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-[#f6f8f8] dark:bg-white/5 text-[#4c9a8d] hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-[#0d1b19] font-black border-2 border-white dark:border-[#1e3a36] shadow-sm">
                        DR
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[1440px] mx-auto w-full p-6 flex gap-8 overflow-hidden">
                {/* Form Area */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-10">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] text-left">
                        <span className="hover:text-primary cursor-pointer" onClick={onBack}>Patients</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="hover:text-primary cursor-pointer">{patientInfo?.full_name || 'Sélection Patient'}</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="text-[#0d1b19] dark:text-white">Nouvelle Consultation</span>
                    </div>

                    {/* Stepper */}
                    <div className="bg-white dark:bg-[#152a26] rounded-2xl p-6 shadow-sm border border-[#e7f3f1] dark:border-[#1e3a36] shrink-0">
                        <div className="relative flex justify-between items-center max-w-4xl mx-auto px-4">
                            <div className="absolute top-[18px] left-[50px] right-[50px] h-[2px] bg-[#f6f8f8] dark:bg-[#1e3a36] -z-0">
                                <div
                                    className="h-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(66,240,211,0.5)]"
                                    style={{ width: `${((currentStep - 1) / 6) * 100}%` }}
                                ></div>
                            </div>
                            {steps.map((step) => (
                                <div key={step.id} className={`relative flex flex-col items-center gap-2 z-10 transition-all duration-300 ${currentStep < step.id ? 'opacity-40 scale-90' : 'opacity-100 scale-100'}`}>
                                    <div className={`size-9 rounded-full flex items-center justify-center font-black text-xs transition-all ${currentStep === step.id
                                        ? 'bg-primary text-[#0d1b19] shadow-[0_0_12px_rgba(66,240,211,0.4)] border-2 border-white'
                                        : currentStep > step.id
                                            ? 'bg-primary text-[#0d1b19]'
                                            : 'bg-white dark:bg-[#1e3a36] border-2 border-[#e7f3f1] dark:border-[#1e3a36] text-[#4c9a8d]'
                                        }`}>
                                        {currentStep > step.id ? <span className="material-symbols-outlined text-sm">check</span> : step.id}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${currentStep === step.id ? 'text-[#0d1b19] dark:text-white' : 'text-[#4c9a8d]'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="bg-white dark:bg-[#152a26] rounded-2xl shadow-md border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden flex flex-col text-left">
                        <div className="p-6 border-b border-[#f6f8f8] dark:border-white/5 flex items-center justify-between bg-[#f8fcfb] dark:bg-white/5">
                            <div>
                                <h3 className="text-xl font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">{steps[currentStep - 1].label}</h3>
                                <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mt-1">Étape {currentStep} : Évaluation clinique et anamnèse</p>
                            </div>
                            <div className="text-[#4c9a8d] text-[10px] font-black uppercase tracking-widest">Date: 28 Jan 2026</div>
                        </div>

                        <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                            {currentStep === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {errors.patientId && (
                                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2 duration-300">
                                            <span className="material-symbols-outlined">error</span>
                                            <p className="text-xs font-black uppercase tracking-widest">{errors.patientId}</p>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-primary">person_search</span>
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Rechercher un Patient</h4>
                                        </div>

                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#4c9a8d] group-focus-within:text-primary transition-colors">search</span>
                                            <input
                                                className="w-full h-14 rounded-2xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] pl-12 pr-4 text-sm font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white transition-all shadow-sm"
                                                placeholder="Tapez le nom ou le code ID du patient..."
                                                value={patientSearch}
                                                onChange={(e) => handlePatientSearch(e.target.value)}
                                            />
                                            {isSearching && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            {searchResults.length > 0 ? (
                                                searchResults.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => {
                                                            setPatientId(p.id.toString());
                                                            nextStep();
                                                        }}
                                                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#152a26] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-2xl hover:border-primary hover:shadow-lg transition-all text-left group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black group-hover:bg-primary group-hover:text-white transition-all">
                                                                {p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-[#0d1b19] dark:text-white">{p.full_name}</p>
                                                                <p className="text-[10px] font-bold text-[#4c9a8d] uppercase tracking-wide">ID: {p.patient_id} • {p.age} ans • {p.gender}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase text-primary opacity-0 group-hover:opacity-100 transition-all">Sélectionner</span>
                                                            <span className="material-symbols-outlined text-primary">chevron_right</span>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : patientSearch.length > 1 ? (
                                                <div className="py-12 text-center bg-[#f6f8f8] dark:bg-white/5 rounded-2xl border-2 border-dashed border-[#e7f3f1] dark:border-[#1e3a36]">
                                                    <span className="material-symbols-outlined text-4xl text-[#4c9a8d]/30 mb-2">person_off</span>
                                                    <p className="text-xs font-bold text-[#4c9a8d]">Aucun patient trouvé pour "{patientSearch}"</p>
                                                    <button className="mt-4 px-6 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                                                        Créer un nouveau dossier
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="py-20 text-center text-[#4c9a8d]/50">
                                                    <span className="material-symbols-outlined text-6xl mb-4">search_insights</span>
                                                    <p className="text-sm font-bold uppercase tracking-widest">Commencez à taper pour rechercher</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-symbols-outlined text-primary">healing</span>
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Symptômes & Motif de Visite</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="col-span-full">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-2 ml-1">
                                                    Plainte Principale <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    className={`w-full rounded-2xl border ${errors.consultationReason ? 'border-red-500 bg-red-50/10' : 'border-[#e7f3f1] dark:border-[#1e3a36]'} bg-[#f6f8f8] dark:bg-[#10221f] p-4 text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all text-[#0d1b19] dark:text-white min-h-[120px] placeholder:text-[#4c9a8d]/30`}
                                                    placeholder="Décrivez le motif principal de consultation..."
                                                    value={consultationReason}
                                                    onChange={(e) => {
                                                        setConsultationReason(e.target.value);
                                                        if (errors.consultationReason) setErrors(prev => ({ ...prev, consultationReason: '' }));
                                                    }}
                                                ></textarea>
                                                {errors.consultationReason && <p className="text-[9px] font-black text-red-500 uppercase mt-1 ml-1">{errors.consultationReason}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-2 ml-1">
                                                    Statut Fonctionnel (NYHA) <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    className={`w-full h-12 rounded-xl border ${errors.nyha ? 'border-red-500 bg-red-50/10' : 'border-[#e7f3f1] dark:border-[#1e3a36]'} bg-[#f6f8f8] dark:bg-[#10221f] px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white`}
                                                    value={scores.nyha}
                                                    onChange={(e) => {
                                                        setScores(prev => ({ ...prev, nyha: e.target.value }));
                                                        if (errors.nyha) setErrors(prev => ({ ...prev, nyha: '' }));
                                                    }}
                                                >
                                                    <option>Sélectionner la classe NYHA</option>
                                                    <option>Classe I - Aucune limitation</option>
                                                    <option>Classe II - Limitation légère</option>
                                                    <option>Classe III - Limitation marquée</option>
                                                    <option>Classe IV - Incapacité à toute activité</option>
                                                </select>
                                                {errors.nyha && <p className="text-[9px] font-black text-red-500 uppercase mt-1 ml-1">{errors.nyha}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-2 ml-1">Durée des Symptômes</label>
                                                <input className="w-full h-12 rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white" placeholder="ex: 3 jours, 2 semaines" type="text" />
                                            </div>
                                        </div>
                                    </div>
                                    <hr className="border-[#e7f3f1] dark:border-[#1e3a36]" />
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">family_history</span>
                                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Antécédents Familiaux</h4>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            {familyHistoryItems.map(item => (
                                                <label key={item} className="flex items-center gap-3 p-4 bg-[#f6f8f8] dark:bg-[#10221f] rounded-2xl border border-transparent hover:border-primary/30 transition-all cursor-pointer group animate-in fade-in zoom-in duration-300">
                                                    <input className="size-5 rounded-lg text-primary focus:ring-primary bg-white dark:bg-[#1e3a36] border-[#e7f3f1] dark:border-[#1e3a36]" type="checkbox" />
                                                    <span className="text-xs font-black uppercase tracking-tight text-[#4c9a8d] group-hover:text-primary transition-colors">{item}</span>
                                                </label>
                                            ))}
                                            {/* Static placeholder for adding */}
                                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#152a26] rounded-2xl border border-dashed border-[#e7f3f1] dark:border-[#1e3a36] focus-within:border-primary transition-all">
                                                <input
                                                    type="text"
                                                    value={newHistoryItem}
                                                    onChange={(e) => setNewHistoryItem(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && addFamilyHistoryItem()}
                                                    placeholder="Autre antécédent..."
                                                    className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/30"
                                                />
                                                <button
                                                    onClick={addFamilyHistoryItem}
                                                    className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-[#0d1b19] transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-sm font-black">add</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-2 ml-1">Détails Additionnels (Antécédents Familiaux)</label>
                                            <textarea className="w-full rounded-2xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] p-4 text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all text-[#0d1b19] dark:text-white min-h-[100px] placeholder:text-[#4c9a8d]/30" placeholder="Précisions sur les membres de la famille..."></textarea>
                                        </div>
                                    </div>
                                    <hr className="border-[#e7f3f1] dark:border-[#1e3a36]" />
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined text-primary">self_improvement</span>
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Facteurs de Mode de Vie</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {lifestyleFactors.map((factor) => (
                                                <div key={factor.id} className="animate-in fade-in zoom-in duration-300">
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-2 ml-1">{factor.label}</label>
                                                    <select className="w-full h-12 rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white transition-all hover:border-primary/30">
                                                        {factor.options.map((opt) => (
                                                            <option key={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}

                                            {/* Add Factor UI */}
                                            <div className="flex flex-col justify-end">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-2 ml-1">Ajouter un facteur</label>
                                                <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#152a26] rounded-2xl border border-dashed border-[#e7f3f1] dark:border-[#1e3a36] focus-within:border-primary transition-all h-12">
                                                    <input
                                                        type="text"
                                                        value={newLifestyleLabel}
                                                        onChange={(e) => setNewLifestyleLabel(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && addLifestyleFactor()}
                                                        placeholder="ex: Sommeil, Stress..."
                                                        className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/30"
                                                    />
                                                    <button
                                                        onClick={addLifestyleFactor}
                                                        className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-[#0d1b19] transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-sm font-black">add</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined text-primary">monitoring</span>
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Signes Vitaux</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-2 ml-1">
                                                    Pression Systolique (mmHg) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    className={`w-full h-12 rounded-xl border ${errors.bpSys ? 'border-red-500 bg-red-50/10' : 'border-[#e7f3f1] dark:border-[#1e3a36]'} bg-[#f6f8f8] dark:bg-[#10221f] px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white`}
                                                    placeholder="ex: 120"
                                                    type="number"
                                                    value={examData.bpSys}
                                                    onChange={(e) => {
                                                        setExamData({ ...examData, bpSys: e.target.value });
                                                        if (errors.bpSys) setErrors(prev => ({ ...prev, bpSys: '' }));
                                                    }}
                                                />
                                                {errors.bpSys && <p className="text-[9px] font-black text-red-500 uppercase mt-1 ml-1">{errors.bpSys}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-2 ml-1">
                                                    Pression Diastolique (mmHg) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    className={`w-full h-12 rounded-xl border ${errors.bpDia ? 'border-red-500 bg-red-50/10' : 'border-[#e7f3f1] dark:border-[#1e3a36]'} bg-[#f6f8f8] dark:bg-[#10221f] px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white`}
                                                    placeholder="ex: 80"
                                                    type="number"
                                                    value={examData.bpDia}
                                                    onChange={(e) => {
                                                        setExamData({ ...examData, bpDia: e.target.value });
                                                        if (errors.bpDia) setErrors(prev => ({ ...prev, bpDia: '' }));
                                                    }}
                                                />
                                                {errors.bpDia && <p className="text-[9px] font-black text-red-500 uppercase mt-1 ml-1">{errors.bpDia}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-2 ml-1">
                                                    Fréquence Cardiaque (bpm) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    className={`w-full h-12 rounded-xl border ${errors.heartRate ? 'border-red-500 bg-red-50/10' : 'border-[#e7f3f1] dark:border-[#1e3a36]'} bg-[#f6f8f8] dark:bg-[#10221f] px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white`}
                                                    placeholder="ex: 72"
                                                    type="number"
                                                    value={examData.heartRate}
                                                    onChange={(e) => {
                                                        setExamData({ ...examData, heartRate: e.target.value });
                                                        if (errors.heartRate) setErrors(prev => ({ ...prev, heartRate: '' }));
                                                    }}
                                                />
                                                {errors.heartRate && <p className="text-[9px] font-black text-red-500 uppercase mt-1 ml-1">{errors.heartRate}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-2 ml-1">Température (°C)</label>
                                                <input
                                                    className="w-full h-12 rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white"
                                                    placeholder="ex: 37.2"
                                                    type="number"
                                                    value={examData.temp}
                                                    onChange={(e) => setExamData({ ...examData, temp: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] ml-1 mb-2">SpO2 (%)</label>
                                                    <input
                                                        className="w-full h-12 rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white"
                                                        placeholder="ex: 98"
                                                        type="number"
                                                        value={examData.spo2}
                                                        onChange={(e) => setExamData({ ...examData, spo2: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="border-[#e7f3f1] dark:border-[#1e3a36]" />

                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined text-primary">straighten</span>
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Biométrie</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] ml-1">Poids (kg)</label>
                                                <input
                                                    className="w-full h-12 rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white"
                                                    placeholder="ex: 75"
                                                    type="number"
                                                    value={examData.weight}
                                                    onChange={(e) => setExamData({ ...examData, weight: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] ml-1">Taille (cm)</label>
                                                <input
                                                    className="w-full h-12 rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white"
                                                    placeholder="ex: 175"
                                                    type="number"
                                                    value={examData.height}
                                                    onChange={(e) => setExamData({ ...examData, height: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] ml-1">IMC (kg/m²)</label>
                                                <div className="w-full h-12 rounded-xl bg-[#f6f8f8] dark:bg-[#10221f] border border-[#e7f3f1] dark:border-[#1e3a36] px-4 flex items-center text-sm font-black text-primary">
                                                    {examData.weight && examData.height ? (parseFloat(examData.weight) / Math.pow(parseFloat(examData.height) / 100, 2)).toFixed(1) : '--.-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="border-[#e7f3f1] dark:border-[#1e3a36]" />

                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-symbols-outlined text-primary">clinical_notes</span>
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Examen Physique & Notes</h4>
                                        </div>
                                        <textarea
                                            className="w-full rounded-2xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] p-4 text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all text-[#0d1b19] dark:text-white min-h-[150px] placeholder:text-[#4c9a8d]/30"
                                            placeholder="Détaillez vos observations cliniques (auscultation, œdèmes, souffles...)"
                                            value={examData.notes}
                                            onChange={(e) => setExamData({ ...examData, notes: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* ECG Section */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-primary text-xl">ecg_heart</span>
                                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Électrocardiogramme (ECG)</h4>
                                            </div>

                                            <div className="aspect-video rounded-2xl border-2 border-dashed border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] flex flex-col items-center justify-center gap-3 group hover:border-primary/50 transition-all cursor-pointer">
                                                <div className="size-12 rounded-xl bg-white dark:bg-[#152a26] flex items-center justify-center text-[#4c9a8d] group-hover:text-primary transition-all shadow-sm">
                                                    <span className="material-symbols-outlined text-3xl">upload_file</span>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#0d1b19] dark:text-white">Téléverser l'examen ECG</p>
                                                    <p className="text-[9px] font-bold text-[#4c9a8d] mt-1">Images ou PDF (Max 10MB)</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] ml-1">Interprétation ECG</label>
                                                <textarea
                                                    className="w-full rounded-2xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] p-4 text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all text-[#0d1b19] dark:text-white min-h-[120px] placeholder:text-[#4c9a8d]/30"
                                                    placeholder="Rythme sinusal, axe, zones d'ischémie..."
                                                    value={ecgData.interpretation}
                                                    onChange={(e) => setEcgData({ ...ecgData, interpretation: e.target.value })}
                                                ></textarea>
                                            </div>
                                        </div>

                                        {/* ETT Section */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-primary text-xl">echo</span>
                                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Échocardiographie (ETT)</h4>
                                            </div>

                                            <div className="aspect-video rounded-2xl border-2 border-dashed border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] flex flex-col items-center justify-center gap-3 group hover:border-primary/50 transition-all cursor-pointer">
                                                <div className="size-12 rounded-xl bg-white dark:bg-[#152a26] flex items-center justify-center text-[#4c9a8d] group-hover:text-primary transition-all shadow-sm">
                                                    <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#0d1b19] dark:text-white">Téléverser les clichés ETT</p>
                                                    <p className="text-[9px] font-bold text-[#4c9a8d] mt-1">Séquences ou rapports</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[#4c9a8d] ml-1">FEVG (%)</label>
                                                    <input
                                                        className="w-full h-10 rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] px-4 text-xs font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white"
                                                        placeholder="ex: 60"
                                                        value={ettData.ef}
                                                        onChange={(e) => setEttData({ ...ettData, ef: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[#4c9a8d] ml-1">DTDVG (mm)</label>
                                                    <input
                                                        className="w-full h-10 rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] px-4 text-xs font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white"
                                                        placeholder="ex: 45"
                                                        value={ettData.lvedd}
                                                        onChange={(e) => setEttData({ ...ettData, lvedd: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] ml-1">Interprétation ETT</label>
                                                <textarea
                                                    className="w-full rounded-2xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] p-4 text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all text-[#0d1b19] dark:text-white min-h-[100px] placeholder:text-[#4c9a8d]/30"
                                                    placeholder="Valvulopathies, cinétique segmentaire..."
                                                    value={ettData.interpretation}
                                                    onChange={(e) => setEttData({ ...ettData, interpretation: e.target.value })}
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 5 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* CHA2DS2-VASc Score */}
                                        <div className="bg-[#f6f8f8] dark:bg-[#10221f] rounded-2xl p-6 border border-[#e7f3f1] dark:border-[#1e3a36] relative overflow-hidden group hover:border-primary/30 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-black text-[10px] uppercase tracking-widest text-[#4c9a8d] mb-1">CHA₂DS₂-VASc</h4>
                                                    <p className="text-[9px] font-bold text-[#4c9a8d]/60 uppercase tracking-tight">Risque d'accident vasculaire cérébral</p>
                                                </div>
                                                <div className="size-10 rounded-xl bg-white dark:bg-[#152a26] flex items-center justify-center text-primary font-black text-lg shadow-sm">
                                                    {scores.chadsVasc}
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full bg-[#e7f3f1] dark:bg-[#1e3a36] rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: `${(scores.chadsVasc / 9) * 100}%` }}></div>
                                            </div>
                                            <p className="mt-3 text-[9px] font-black text-primary uppercase tracking-widest">Risque estimé: {scores.chadsVasc > 2 ? 'Élevé' : 'Modéré'}</p>
                                        </div>

                                        {/* HAS-BLED Score */}
                                        <div className="bg-[#f6f8f8] dark:bg-[#10221f] rounded-2xl p-6 border border-[#e7f3f1] dark:border-[#1e3a36] relative overflow-hidden group hover:border-primary/30 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-black text-[10px] uppercase tracking-widest text-[#4c9a8d] mb-1">HAS-BLED</h4>
                                                    <p className="text-[9px] font-bold text-[#4c9a8d]/60 uppercase tracking-tight">Risque hémorragique majeur</p>
                                                </div>
                                                <div className="size-10 rounded-xl bg-white dark:bg-[#152a26] flex items-center justify-center text-orange-400 font-black text-lg shadow-sm">
                                                    {scores.hasBled}
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full bg-[#e7f3f1] dark:bg-[#1e3a36] rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-400" style={{ width: `${(scores.hasBled / 9) * 100}%` }}></div>
                                            </div>
                                            <p className="mt-3 text-[9px] font-black text-orange-400 uppercase tracking-widest">Risque de saignement: {scores.hasBled >= 3 ? 'Élevé' : 'Faible'}</p>
                                        </div>

                                        {/* SCORE 2 / SCORE OP */}
                                        <div className="bg-[#f6f8f8] dark:bg-[#10221f] rounded-2xl p-6 border border-[#e7f3f1] dark:border-[#1e3a36] relative overflow-hidden group hover:border-primary/30 transition-all col-span-full">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>
                                                    <h4 className="font-black text-[10px] uppercase tracking-widest text-[#4c9a8d] mb-1">Risque Cardiovasculaire (SCORE 2)</h4>
                                                    <p className="text-[9px] font-bold text-[#4c9a8d]/60 uppercase tracking-tight">Risque à 10 ans d'événements CV majeurs</p>
                                                </div>
                                                <div className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 font-black text-xs uppercase tracking-widest border border-red-500/20">
                                                    Risque Élevé (12.4%)
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-3 bg-[#e7f3f1] dark:bg-[#1e3a36] rounded-full overflow-hidden flex">
                                                    <div className="h-full bg-green-400" style={{ width: '25%' }}></div>
                                                    <div className="h-full bg-yellow-400" style={{ width: '25%' }}></div>
                                                    <div className="h-full bg-orange-400" style={{ width: '25%' }}></div>
                                                    <div className="h-full bg-red-500" style={{ width: '25%' }}></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between mt-2 px-1">
                                                <span className="text-[8px] font-black text-[#4c9a8d] uppercase tracking-tighter">Bas</span>
                                                <span className="text-[8px] font-black text-[#4c9a8d] uppercase tracking-tighter">Modéré</span>
                                                <span className="text-[8px] font-black text-[#4c9a8d] uppercase tracking-tighter">Élevé</span>
                                                <span className="text-[8px] font-black text-[#4c9a8d] uppercase tracking-tighter">Très Élevé</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="material-symbols-outlined text-primary text-sm">info</span>
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#0d1b19] dark:text-white">Note sur le calcul</h5>
                                        </div>
                                        <p className="text-[10px] font-bold text-[#4c9a8d] leading-relaxed">
                                            Les scores sont calculés automatiquement à partir des données saisies dans l'anamnèse et l'examen clinique (âge, sexe, tabagisme, TA, diabète).
                                        </p>
                                    </div>
                                </div>
                            )}

                            {currentStep === 6 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined text-primary">fact_check</span>
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Conclusions Diagnostiques</h4>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] ml-1">Diagnostic Principal</label>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#4c9a8d] group-focus-within:text-primary transition-colors">search</span>
                                                    <input
                                                        className={`w-full h-14 rounded-2xl border ${errors.primaryDiagnosis ? 'border-red-500 bg-red-50/10' : 'border-[#e7f3f1] dark:border-[#1e3a36]'} bg-[#f6f8f8] dark:bg-[#10221f] pl-12 pr-4 text-sm font-bold focus:ring-primary/20 focus:border-primary text-[#0d1b19] dark:text-white transition-all`}
                                                        placeholder="Rechercher ou saisir un diagnostic..."
                                                        value={diagnosticData.primaryDiagnosis}
                                                        onChange={(e) => {
                                                            setDiagnosticData({ ...diagnosticData, primaryDiagnosis: e.target.value });
                                                            if (errors.primaryDiagnosis) setErrors(prev => ({ ...prev, primaryDiagnosis: '' }));
                                                        }}
                                                    />
                                                </div>
                                                {errors.primaryDiagnosis && <p className="text-[9px] font-black text-red-500 uppercase mt-1 ml-1">{errors.primaryDiagnosis}</p>}
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {availableDiagnoses.slice(0, 4).map(d => (
                                                        <button
                                                            key={d}
                                                            onClick={() => setDiagnosticData({ ...diagnosticData, primaryDiagnosis: d })}
                                                            className="px-3 py-1.5 bg-white dark:bg-[#1e3a36] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl text-[9px] font-black uppercase tracking-tight text-[#4c9a8d] hover:border-primary hover:text-primary transition-all shadow-sm"
                                                        >
                                                            {d}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] ml-1">Diagnostics Associés / Comorbidités</label>
                                                <textarea
                                                    className="w-full rounded-2xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] p-4 text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all text-[#0d1b19] dark:text-white min-h-[100px] placeholder:text-[#4c9a8d]/30"
                                                    placeholder="Diabète type 2, IRC stade 3..."
                                                    value={diagnosticData.notes}
                                                    onChange={(e) => setDiagnosticData({ ...diagnosticData, notes: e.target.value })}
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-[#f8fcfb] dark:bg-white/5 rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36]">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-xs">summary</span>
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#4c9a8d]">Résumé de la consultation</h5>
                                            </div>
                                            <button className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Modifier</button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-3 bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36]">
                                                <p className="text-[8px] font-black text-[#4c9a8d] uppercase mb-1">TA</p>
                                                <p className="text-xs font-black text-[#0d1b19] dark:text-white">{examData.bpSys || '--'}/{examData.bpDia || '--'}</p>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36]">
                                                <p className="text-[8px] font-black text-[#4c9a8d] uppercase mb-1">FC</p>
                                                <p className="text-xs font-black text-[#0d1b19] dark:text-white">{examData.heartRate || '--'} bpm</p>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36]">
                                                <p className="text-[8px] font-black text-[#4c9a8d] uppercase mb-1">FEVG</p>
                                                <p className="text-xs font-black text-[#0d1b19] dark:text-white">{ettData.ef || '--'}%</p>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36]">
                                                <p className="text-[8px] font-black text-[#4c9a8d] uppercase mb-1">Symptôme</p>
                                                <p className="text-xs font-black text-[#0d1b19] dark:text-white truncate">Palpitations</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 7 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">medication</span>
                                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Prescription Médicale</h4>
                                            </div>
                                            <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-[#0d1b19] transition-all">
                                                <span className="material-symbols-outlined text-sm">auto_fix</span>
                                                Modèles Intelligents
                                            </button>
                                        </div>

                                        <div className="overflow-hidden rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] bg-white dark:bg-[#152a26]">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-[#f8fcfb] dark:bg-white/5 border-b border-[#e7f3f1] dark:border-[#1e3a36]">
                                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#4c9a8d]">Médicament</th>
                                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#4c9a8d]">Posologie</th>
                                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#4c9a8d]">Fréquence</th>
                                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#4c9a8d]">Durée</th>
                                                        <th className="p-4 w-16"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#f6f8f8] dark:divide-white/5">
                                                    {prescriptions.map((p) => (
                                                        <tr key={p.id} className="group hover:bg-[#f8fcfb] dark:hover:bg-white/5 transition-colors">
                                                            <td className="p-4 text-xs font-bold text-[#0d1b19] dark:text-white">{p.drug}</td>
                                                            <td className="p-4 text-xs font-bold text-[#4c9a8d]">{p.dosage}</td>
                                                            <td className="p-4 text-xs font-bold text-[#4c9a8d]">{p.frequency}</td>
                                                            <td className="p-4 text-xs font-bold text-[#4c9a8d]">{p.duration}</td>
                                                            <td className="p-4">
                                                                <button
                                                                    onClick={() => removePrescription(p.id)}
                                                                    className="size-8 rounded-lg flex items-center justify-center text-[#4c9a8d] hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {/* Add Row */}
                                                    <tr className="bg-[#f6f8f8]/50 dark:bg-[#10221f]/30">
                                                        <td className="p-2">
                                                            <input
                                                                className="w-full h-10 px-3 bg-transparent border-none focus:ring-0 text-xs font-bold text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/30"
                                                                placeholder="ex: Aspirine"
                                                                value={newPrescription.drug}
                                                                onChange={(e) => setNewPrescription({ ...newPrescription, drug: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                className="w-full h-10 px-3 bg-transparent border-none focus:ring-0 text-xs font-bold text-[#4c9a8d] placeholder:text-[#4c9a8d]/30"
                                                                placeholder="ex: 100mg"
                                                                value={newPrescription.dosage}
                                                                onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                className="w-full h-10 px-3 bg-transparent border-none focus:ring-0 text-xs font-bold text-[#4c9a8d] placeholder:text-[#4c9a8d]/30"
                                                                placeholder="ex: 1x/j"
                                                                value={newPrescription.frequency}
                                                                onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                className="w-full h-10 px-3 bg-transparent border-none focus:ring-0 text-xs font-bold text-[#4c9a8d] placeholder:text-[#4c9a8d]/30"
                                                                placeholder="ex: Permanent"
                                                                value={newPrescription.duration}
                                                                onChange={(e) => setNewPrescription({ ...newPrescription, duration: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <button
                                                                onClick={addPrescription}
                                                                className="size-8 rounded-xl bg-primary text-[#0d1b19] flex items-center justify-center hover:brightness-105 shadow-sm transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-sm font-black">add</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] ml-1">Instructions Complémentaires</label>
                                            <textarea className="w-full rounded-2xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] p-4 text-sm font-bold focus:ring-primary/20 focus:border-primary transition-all text-[#0d1b19] dark:text-white min-h-[100px] placeholder:text-[#4c9a8d]/30" placeholder="Conseils hygiéno-diététiques, prochain RDV..."></textarea>
                                        </div>
                                        <div className="bg-primary/5 rounded-2xl border border-dashed border-primary/30 p-6 flex flex-col items-center justify-center text-center">
                                            <span className="material-symbols-outlined text-3xl text-primary mb-2">picture_as_pdf</span>
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#0d1b19] dark:text-white">Générer l'ordonnance</h5>
                                            <p className="text-[9px] font-bold text-[#4c9a8d] mt-1 mb-4">Export PDF automatique avec signature numérique</p>
                                            <button className="px-6 py-2 bg-primary text-[#0d1b19] rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:brightness-105 transition-all">
                                                Prévisualiser
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep > 7 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-300">
                                    <span className="material-symbols-outlined text-6xl text-primary/20 mb-4">construction</span>
                                    <h4 className="text-lg font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">Interface en cours de chargement</h4>
                                    <p className="text-xs font-bold text-[#4c9a8d] mt-2">Le module "{steps[currentStep - 1].label}" est en cours de configuration.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-[#f8fcfb] dark:bg-white/5 border-t border-[#e7f3f1] dark:border-[#1e3a36] flex justify-between items-center mt-auto">
                            <button
                                onClick={onBack}
                                className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] hover:text-red-500 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">close</span> Annuler
                            </button>
                            <div className="flex gap-4">
                                {currentStep > 1 && (
                                    <button
                                        onClick={prevStep}
                                        className="px-6 py-2.5 bg-white dark:bg-[#152a26] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl font-black text-[10px] uppercase tracking-widest text-[#0d1b19] dark:text-white shadow-sm hover:bg-gray-50 transition-all"
                                    >
                                        Retour
                                    </button>
                                )}
                                <button
                                    onClick={currentStep === 7 ? handleComplete : nextStep}
                                    disabled={isSaving || (currentStep === 1 && !patientId)}
                                    className="px-8 py-2.5 bg-primary text-[#0d1b19] rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:brightness-105 transition-all flex items-center gap-2 shadow-primary/20 disabled:opacity-50"
                                >
                                    {isSaving ? 'Enregistrement...' : currentStep === 7 ? 'Terminer' : 'Étape Suivante'}
                                    <span className="material-symbols-outlined text-sm">
                                        {isSaving ? 'sync' : currentStep === 7 ? 'check_circle' : 'arrow_forward'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Summary */}
                <aside className="w-80 flex-shrink-0 hidden xl:block">
                    <div className="sticky top-24 flex flex-col gap-6">
                        {!patientId ? (
                            <div className="bg-white dark:bg-[#152a26] rounded-2xl p-8 shadow-md border border-[#e7f3f1] dark:border-[#1e3a36] text-center flex flex-col items-center gap-4">
                                <div className="size-20 rounded-2xl bg-[#f6f8f8] dark:bg-white/5 flex items-center justify-center text-[#4c9a8d]">
                                    <span className="material-symbols-outlined text-4xl">person_search</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">Patient non sélectionné</h4>
                                    <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mt-2 px-4 leading-relaxed">Veuillez rechercher et sélectionner un patient à gauche pour continuer.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#152a26] rounded-2xl p-6 shadow-md border border-[#e7f3f1] dark:border-[#1e3a36] text-left animate-in fade-in zoom-in duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="size-16 rounded-2xl bg-[#42f0d3]/10 flex items-center justify-center text-primary text-xl font-black shadow-md border-2 border-white dark:border-[#1e3a36]">
                                        {patientInfo?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '...'}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-[#0d1b19] dark:text-white tracking-tight">{patientInfo?.full_name || 'Patient'}</h4>
                                        <p className="text-[#4c9a8d] text-[10px] font-black uppercase tracking-widest">
                                            {patientInfo?.age || '?'} ans • {patientInfo?.gender === 'Male' ? 'Homme' : 'Femme'} • {patientInfo?.nationality || '---'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-[#f6f8f8] dark:bg-[#10221f] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-inner">
                                        <p className="text-[9px] uppercase font-black text-[#4c9a8d] mb-1 tracking-widest">Dernière TA</p>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-2xl font-black text-[#0d1b19] dark:text-white">
                                                {latestExamData ? `${latestExamData.bp_sys}/${latestExamData.bp_dia}` : '--/--'}
                                            </span>
                                            {latestExamData && (
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${parseInt(latestExamData.bp_sys) > 130 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                                                    }`}>
                                                    {parseInt(latestExamData.bp_sys) > 130 ? 'Élevé' : 'Normal'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[#f6f8f8] dark:bg-[#10221f] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-inner">
                                        <p className="text-[9px] uppercase font-black text-[#4c9a8d] mb-1 tracking-widest">Poids Actuel</p>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-2xl font-black text-[#0d1b19] dark:text-white">
                                                {latestExamData?.weight ? `${latestExamData.weight} kg` : '--- kg'}
                                            </span>
                                            <span className="px-1.5 py-0.5 bg-green-50 text-green-500 rounded text-[9px] font-black uppercase">Stable</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-dashed border-[#e7f3f1] dark:border-[#1e3a36]">
                                    <button
                                        onClick={() => patientInfo?.id && onViewDetails?.(patientInfo.id.toString())}
                                        className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline flex items-center justify-center gap-2 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm">open_in_new</span> Voir Dossier Complet
                                    </button>
                                </div>
                            </div>
                        )}

                        {latestExamData && (
                            <div className="bg-primary/10 dark:bg-primary/5 rounded-2xl border border-primary/20 p-5 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-primary text-sm">sticky_note_2</span>
                                    <h5 className="font-black text-[10px] uppercase tracking-widest">Dernière Note</h5>
                                </div>
                                <p className="text-xs text-[#0d1b19]/70 dark:text-white/70 leading-relaxed italic font-medium">
                                    {latestExamData.notes || "Aucune note disponible."}
                                </p>
                            </div>
                        )}
                    </div>
                </aside>
            </main>

            <footer className="mt-auto py-4 px-10 border-t border-[#e7f3f1] dark:border-[#1e3a36] bg-white dark:bg-[#152a26] text-center">
                <p className="text-[10px] text-[#4c9a8d] font-black uppercase tracking-[0.3em]">
                    © 2024 CardioMed . Système de Gestion Médicale Sécurisé.
                </p>
            </footer>
        </div>
    );
};
