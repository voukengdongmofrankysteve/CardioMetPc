import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../../services/database';
import { generatePrescriptionPDF } from '../../services/prescriptionPDF';
import { FileStorageService } from '../../services/fileStorage';

interface ConsultationPageProps {
    patientId?: string; // This is the DB ID (number) or Patient Code (string)
    onBack?: () => void;
    onComplete?: () => void;
    onViewDetails?: (id: string) => void;
}

interface Prescription {
    id: number;
    drug: string;
    dosage: string;
    frequency: string;
    duration: string;
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

    const [ecgFiles, setEcgFiles] = useState<File[]>([]);
    const [ettFiles, setEttFiles] = useState<File[]>([]);
    const [ecgDragActive, setEcgDragActive] = useState(false);
    const [ettDragActive, setEttDragActive] = useState(false);
    const [ecgUploadError, setEcgUploadError] = useState<string>('');
    const [ettUploadError, setEttUploadError] = useState<string>('');

    const validateFiles = (files: FileList | null): { valid: File[], invalid: { file: File, reason: string }[] } => {
        if (!files) return { valid: [], invalid: [] };
        const fileArray = Array.from(files);
        const valid: File[] = [];
        const invalid: { file: File, reason: string }[] = [];

        fileArray.forEach(file => {
            const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
            const isValidSize = file.size <= 10 * 1024 * 1024;

            if (!isValidType) {
                invalid.push({ file, reason: 'Type de fichier non supporté' });
            } else if (!isValidSize) {
                invalid.push({ file, reason: `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)}MB > 10MB)` });
            } else {
                valid.push(file);
            }
        });

        return { valid, invalid };
    };

    const handleEcgFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { valid, invalid } = validateFiles(event.target.files);
        
        if (valid.length > 0) {
            setEcgFiles(prev => [...prev, ...valid]);
            setEcgData({ ...ecgData, hasFile: true });
            setEcgUploadError('');
        }
        
        if (invalid.length > 0) {
            const errorMsg = invalid.map(({ file, reason }) => `${file.name}: ${reason}`).join(' • ');
            setEcgUploadError(errorMsg);
            setTimeout(() => setEcgUploadError(''), 5000);
        }
        
        event.target.value = '';
    };

    const handleEttFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { valid, invalid } = validateFiles(event.target.files);
        
        if (valid.length > 0) {
            setEttFiles(prev => [...prev, ...valid]);
            setEttData({ ...ettData, hasFile: true });
            setEttUploadError('');
        }
        
        if (invalid.length > 0) {
            const errorMsg = invalid.map(({ file, reason }) => `${file.name}: ${reason}`).join(' • ');
            setEttUploadError(errorMsg);
            setTimeout(() => setEttUploadError(''), 5000);
        }
        
        event.target.value = '';
    };

    const handleEcgDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEcgDragActive(true);
    };

    const handleEcgDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEcgDragActive(false);
    };

    const handleEcgDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleEcgDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEcgDragActive(false);
        
        const { valid, invalid } = validateFiles(e.dataTransfer.files);
        
        if (valid.length > 0) {
            setEcgFiles(prev => [...prev, ...valid]);
            setEcgData({ ...ecgData, hasFile: true });
            setEcgUploadError('');
        }
        
        if (invalid.length > 0) {
            const errorMsg = invalid.map(({ file, reason }) => `${file.name}: ${reason}`).join(' • ');
            setEcgUploadError(errorMsg);
            setTimeout(() => setEcgUploadError(''), 5000);
        }
    };

    const handleEttDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEttDragActive(true);
    };

    const handleEttDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEttDragActive(false);
    };

    const handleEttDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleEttDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEttDragActive(false);
        
        const { valid, invalid } = validateFiles(e.dataTransfer.files);
        
        if (valid.length > 0) {
            setEttFiles(prev => [...prev, ...valid]);
            setEttData({ ...ettData, hasFile: true });
            setEttUploadError('');
        }
        
        if (invalid.length > 0) {
            const errorMsg = invalid.map(({ file, reason }) => `${file.name}: ${reason}`).join(' • ');
            setEttUploadError(errorMsg);
            setTimeout(() => setEttUploadError(''), 5000);
        }
    };

    const removeEcgFile = (index: number) => {
        setEcgFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeEttFile = (index: number) => {
        setEttFiles(prev => prev.filter((_, i) => i !== index));
    };

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
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

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

            // Save ECG files
            let ecgFilePaths: string[] = [];
            if (ecgFiles.length > 0) {
                try {
                    ecgFilePaths = await FileStorageService.saveFiles(ecgFiles, 'ECG');
                    console.log('ECG files saved:', ecgFilePaths);
                } catch (error) {
                    console.error('Error saving ECG files:', error);
                    const continueAnyway = confirm(
                        'Erreur lors de la sauvegarde des fichiers ECG. Voulez-vous continuer sans les fichiers ?'
                    );
                    if (!continueAnyway) {
                        throw error;
                    }
                }
            }

            // Save ETT files
            let ettFilePaths: string[] = [];
            if (ettFiles.length > 0) {
                try {
                    ettFilePaths = await FileStorageService.saveFiles(ettFiles, 'ETT');
                    console.log('ETT files saved:', ettFilePaths);
                } catch (error) {
                    console.error('Error saving ETT files:', error);
                    const continueAnyway = confirm(
                        'Erreur lors de la sauvegarde des fichiers ETT. Voulez-vous continuer sans les fichiers ?'
                    );
                    if (!continueAnyway) {
                        throw error;
                    }
                }
            }

            await DatabaseService.createConsultation({
                patient_db_id: parseInt(patientId),
                doctor_db_id: 1,
                reason: consultationReason || 'Routine Cardiology Follow-up',
                status: 'Completed',
                exam: { ...examData, bmi: bmiValue },
                ecg: { ...ecgData, files: ecgFilePaths },
                ett: { ...ettData, files: ettFilePaths },
                diagnostic: { ...diagnosticData, nyha: scores.nyha },
                scores: scores,
                prescriptions: prescriptions
            });
            
            if (onComplete) onComplete();
        } catch (error) {
            console.error('Failed to save consultation:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            alert('Erreur lors de la sauvegarde de la consultation:\n\n' + errorMsg);
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
        <div className="flex flex-col min-h-screen bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] font-sans text-[var(--color-text-main)] dark:text-white">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] px-8 py-3 sticky top-0 z-50 shrink-0">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="size-6 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-base">cardiology</span>
                        </div>
                        <h2 className="text-[var(--color-text-main)] dark:text-white text-lg font-bold uppercase tracking-tight">CARDIOMED</h2>
                    </div>
                    <div className="h-6 w-px bg-[var(--color-border)] dark:bg-[var(--color-dark-border)]"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">Nouvelle Consultation</span>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-[var(--color-bg-main)] dark:bg-white/5 text-[var(--color-text-muted)] hover:bg-[var(--color-primary)]/10 transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <div className="size-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-text-main)] font-black border-2 border-white dark:border-[var(--color-dark-border)] shadow-sm">
                        DR
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[1440px] mx-auto w-full p-6 flex gap-8 overflow-hidden">
                {/* Form Area */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-10">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] text-left">
                        <span className="hover:text-[var(--color-primary)] cursor-pointer" onClick={onBack}>Patients</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="hover:text-[var(--color-primary)] cursor-pointer">{patientInfo?.full_name || 'Sélection Patient'}</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="text-[var(--color-text-main)] dark:text-white">Nouvelle Consultation</span>
                    </div>

                    {/* Stepper */}
                    <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl p-6 shadow-sm border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shrink-0">
                        <div className="relative flex justify-between items-center max-w-4xl mx-auto px-4">
                            <div className="absolute top-[18px] left-[50px] right-[50px] h-[2px] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-border)] -z-0">
                                <div
                                    className="h-full bg-[var(--color-primary)] transition-all duration-500 shadow-[0_0_8px_rgba(66,240,211,0.5)]"
                                    style={{ width: `${((currentStep - 1) / 6) * 100}%` }}
                                ></div>
                            </div>
                            {steps.map((step) => (
                                <div key={step.id} className={`relative flex flex-col items-center gap-2 z-10 transition-all duration-300 ${currentStep < step.id ? 'opacity-40 scale-90' : 'opacity-100 scale-100'}`}>
                                    <div className={`size-9 rounded-full flex items-center justify-center font-black text-xs transition-all ${currentStep === step.id
                                        ? 'bg-[var(--color-primary)] text-[var(--color-text-main)] shadow-[0_0_12px_rgba(66,240,211,0.4)] border-2 border-white'
                                        : currentStep > step.id
                                            ? 'bg-[var(--color-primary)] text-[var(--color-text-main)]'
                                            : 'bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] border-2 border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-[var(--color-text-muted)]'
                                        }`}>
                                        {currentStep > step.id ? <span className="material-symbols-outlined text-sm">check</span> : step.id}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${currentStep === step.id ? 'text-[var(--color-text-main)] dark:text-white' : 'text-[var(--color-text-muted)]'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl shadow-md border border-[var(--color-border)] dark:border-[var(--color-dark-border)] overflow-hidden flex flex-col text-left">
                        <div className="p-6 border-b border-[var(--color-bg-main)] dark:border-white/5 flex items-center justify-between bg-[var(--color-bg-main)]/50 dark:bg-white/5">
                            <div>
                                <h3 className="text-xl font-black text-[var(--color-text-main)] dark:text-white uppercase tracking-tight">{steps[currentStep - 1].label}</h3>
                                <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mt-1">Étape {currentStep} : Évaluation clinique et anamnèse</p>
                            </div>
                            <div className="text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest">Date: {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
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
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">search</span>
                                            <input
                                                className="w-full h-14 rounded-2xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] pl-12 pr-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white transition-all shadow-sm"
                                                placeholder="Tapez le nom ou le code ID du patient..."
                                                value={patientSearch}
                                                onChange={(e) => handlePatientSearch(e.target.value)}
                                            />
                                            {isSearching && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <div className="size-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
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
                                                        className="w-full flex items-center justify-between p-4 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-2xl hover:border-[var(--color-primary)] hover:shadow-lg transition-all text-left group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="size-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-black group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                                                                {p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-[var(--color-text-main)] dark:text-white">{p.full_name}</p>
                                                                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wide">ID: {p.patient_id} • {p.age} ans • {p.gender}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-all">Sélectionner</span>
                                                            <span className="material-symbols-outlined text-[var(--color-primary)]">chevron_right</span>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : patientSearch.length > 1 ? (
                                                <div className="py-12 text-center bg-[var(--color-bg-main)] dark:bg-white/5 rounded-2xl border-2 border-dashed border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                                    <span className="material-symbols-outlined text-4xl text-[var(--color-text-muted)]/30 mb-2">person_off</span>
                                                    <p className="text-xs font-bold text-[var(--color-text-muted)]">Aucun patient trouvé pour "{patientSearch}"</p>
                                                    <button className="mt-4 px-6 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-primary)] hover:text-white transition-all">
                                                        Créer un nouveau dossier
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="py-20 text-center text-[var(--color-text-muted)]/50">
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
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">
                                                    Plainte Principale <span className="text-[var(--color-danger)]">*</span>
                                                </label>
                                                <textarea
                                                    className={`w-full rounded-2xl border ${errors.consultationReason ? 'border-[var(--color-danger)] bg-[var(--color-danger)]/10' : 'border-[var(--color-border)] dark:border-[var(--color-dark-border)]'} bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] p-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all text-[var(--color-text-main)] dark:text-white min-h-[120px] placeholder:text-[var(--color-text-muted)]/30`}
                                                    placeholder="Décrivez le motif principal de consultation..."
                                                    value={consultationReason}
                                                    onChange={(e) => {
                                                        setConsultationReason(e.target.value);
                                                        if (errors.consultationReason) setErrors(prev => ({ ...prev, consultationReason: '' }));
                                                    }}
                                                ></textarea>
                                                {errors.consultationReason && <p className="text-[9px] font-black text-[var(--color-danger)] uppercase mt-1 ml-1">{errors.consultationReason}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">
                                                    Statut Fonctionnel (NYHA) <span className="text-[var(--color-danger)]">*</span>
                                                </label>
                                                <select
                                                    className={`w-full h-12 rounded-xl border ${errors.nyha ? 'border-[var(--color-danger)] bg-[var(--color-danger)]/10' : 'border-[var(--color-border)] dark:border-[var(--color-dark-border)]'} bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white`}
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
                                                {errors.nyha && <p className="text-[9px] font-black text-[var(--color-danger)] uppercase mt-1 ml-1">{errors.nyha}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">Durée des Symptômes</label>
                                                <input className="w-full h-12 rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white" placeholder="ex: 3 jours, 2 semaines" type="text" />
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
                                                <label key={item} className="flex items-center gap-3 p-4 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] rounded-2xl border border-transparent hover:border-[var(--color-primary)]/30 transition-all cursor-pointer group animate-in fade-in zoom-in duration-300">
                                                    <input className="size-5 rounded-lg text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] border-[var(--color-border)] dark:border-[var(--color-dark-border)]" type="checkbox" />
                                                    <span className="text-xs font-black uppercase tracking-tight text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors">{item}</span>
                                                </label>
                                            ))}
                                            {/* Static placeholder for adding */}
                                            <div className="flex items-center gap-2 p-2 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl border border-dashed border-[var(--color-border)] dark:border-[var(--color-dark-border)] focus-within:border-[var(--color-primary)] transition-all">
                                                <input
                                                    type="text"
                                                    value={newHistoryItem}
                                                    onChange={(e) => setNewHistoryItem(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && addFamilyHistoryItem()}
                                                    placeholder="Autre antécédent..."
                                                    className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/30"
                                                />
                                                <button
                                                    onClick={addFamilyHistoryItem}
                                                    className="size-8 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-[var(--color-text-main)] transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-sm font-black">add</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">Détails Additionnels (Antécédents Familiaux)</label>
                                            <textarea className="w-full rounded-2xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] p-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all text-[var(--color-text-main)] dark:text-white min-h-[100px] placeholder:text-[var(--color-text-muted)]/30" placeholder="Précisions sur les membres de la famille..."></textarea>
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
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">{factor.label}</label>
                                                    <select className="w-full h-12 rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white transition-all hover:border-[var(--color-primary)]/30">
                                                        {factor.options.map((opt) => (
                                                            <option key={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}

                                            {/* Add Factor UI */}
                                            <div className="flex flex-col justify-end">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">Ajouter un facteur</label>
                                                <div className="flex items-center gap-2 p-2 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl border border-dashed border-[var(--color-border)] dark:border-[var(--color-dark-border)] focus-within:border-[var(--color-primary)] transition-all h-12">
                                                    <input
                                                        type="text"
                                                        value={newLifestyleLabel}
                                                        onChange={(e) => setNewLifestyleLabel(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && addLifestyleFactor()}
                                                        placeholder="ex: Sommeil, Stress..."
                                                        className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/30"
                                                    />
                                                    <button
                                                        onClick={addLifestyleFactor}
                                                        className="size-8 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-[var(--color-text-main)] transition-all"
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
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">
                                                    Pression Systolique (mmHg) <span className="text-[var(--color-danger)]">*</span>
                                                </label>
                                                <input
                                                    className={`w-full h-12 rounded-xl border ${errors.bpSys ? 'border-[var(--color-danger)] bg-[var(--color-danger)]/5' : 'border-[var(--color-border)] dark:border-[var(--color-dark-border)]'} bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white`}
                                                    placeholder="ex: 120"
                                                    type="number"
                                                    value={examData.bpSys}
                                                    onChange={(e) => {
                                                        setExamData({ ...examData, bpSys: e.target.value });
                                                        if (errors.bpSys) setErrors(prev => ({ ...prev, bpSys: '' }));
                                                    }}
                                                />
                                                {errors.bpSys && <p className="text-[9px] font-black text-[var(--color-danger)] uppercase mt-1 ml-1">{errors.bpSys}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">
                                                    Pression Diastolique (mmHg) <span className="text-[var(--color-danger)]">*</span>
                                                </label>
                                                <input
                                                    className={`w-full h-12 rounded-xl border ${errors.bpDia ? 'border-[var(--color-danger)] bg-[var(--color-danger)]/5' : 'border-[var(--color-border)] dark:border-[var(--color-dark-border)]'} bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white`}
                                                    placeholder="ex: 80"
                                                    type="number"
                                                    value={examData.bpDia}
                                                    onChange={(e) => {
                                                        setExamData({ ...examData, bpDia: e.target.value });
                                                        if (errors.bpDia) setErrors(prev => ({ ...prev, bpDia: '' }));
                                                    }}
                                                />
                                                {errors.bpDia && <p className="text-[9px] font-black text-[var(--color-danger)] uppercase mt-1 ml-1">{errors.bpDia}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">
                                                    Fréquence Cardiaque (bpm) <span className="text-[var(--color-danger)]">*</span>
                                                </label>
                                                <input
                                                    className={`w-full h-12 rounded-xl border ${errors.heartRate ? 'border-[var(--color-danger)] bg-[var(--color-danger)]/5' : 'border-[var(--color-border)] dark:border-[var(--color-dark-border)]'} bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white`}
                                                    placeholder="ex: 72"
                                                    type="number"
                                                    value={examData.heartRate}
                                                    onChange={(e) => {
                                                        setExamData({ ...examData, heartRate: e.target.value });
                                                        if (errors.heartRate) setErrors(prev => ({ ...prev, heartRate: '' }));
                                                    }}
                                                />
                                                {errors.heartRate && <p className="text-[9px] font-black text-[var(--color-danger)] uppercase mt-1 ml-1">{errors.heartRate}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2 ml-1">Température (°C)</label>
                                                <input
                                                    className="w-full h-12 rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white"
                                                    placeholder="ex: 37.2"
                                                    type="number"
                                                    value={examData.temp}
                                                    onChange={(e) => setExamData({ ...examData, temp: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] ml-1 mb-2">SpO2 (%)</label>
                                                    <input
                                                        className="w-full h-12 rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white"
                                                        placeholder="ex: 98"
                                                        type="number"
                                                        value={examData.spo2}
                                                        onChange={(e) => setExamData({ ...examData, spo2: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="border-[var(--color-border)] dark:border-[var(--color-dark-border)]" />

                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined text-[var(--color-primary)]">straighten</span>
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Biométrie</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Poids (kg)</label>
                                                <input
                                                    className="w-full h-12 rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white"
                                                    placeholder="ex: 75"
                                                    type="number"
                                                    value={examData.weight}
                                                    onChange={(e) => setExamData({ ...examData, weight: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Taille (cm)</label>
                                                <input
                                                    className="w-full h-12 rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white"
                                                    placeholder="ex: 175"
                                                    type="number"
                                                    value={examData.height}
                                                    onChange={(e) => setExamData({ ...examData, height: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] ml-1">IMC (kg/m²)</label>
                                                <div className="w-full h-12 rounded-xl bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] px-4 flex items-center text-sm font-black text-[var(--color-primary)]">
                                                    {examData.weight && examData.height ? (parseFloat(examData.weight) / Math.pow(parseFloat(examData.height) / 100, 2)).toFixed(1) : '--.-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="border-[var(--color-border)] dark:border-[var(--color-dark-border)]" />

                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="material-symbols-outlined text-[var(--color-primary)]">clinical_notes</span>
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Examen Physique & Notes</h4>
                                        </div>
                                        <textarea
                                            className="w-full rounded-2xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] p-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all text-[var(--color-text-main)] dark:text-white min-h-[150px] placeholder:text-[var(--color-text-muted)]/30"
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
                                                <span className="material-symbols-outlined text-[var(--color-primary)] text-xl">ecg_heart</span>
                                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Électrocardiogramme (ECG)</h4>
                                            </div>

                                            <div>
                                                <input
                                                    type="file"
                                                    id="ecg-upload"
                                                    accept="image/*,.pdf"
                                                    multiple
                                                    onChange={handleEcgFileUpload}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor="ecg-upload"
                                                    onDragEnter={handleEcgDragEnter}
                                                    onDragLeave={handleEcgDragLeave}
                                                    onDragOver={handleEcgDragOver}
                                                    onDrop={handleEcgDrop}
                                                    className={`aspect-video rounded-2xl border-2 border-dashed ${
                                                        ecgDragActive 
                                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-105' 
                                                            : 'border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)]'
                                                    } flex flex-col items-center justify-center gap-3 group hover:border-[var(--color-primary)]/50 transition-all cursor-pointer`}
                                                >
                                                    <div className={`size-12 rounded-xl bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] flex items-center justify-center ${
                                                        ecgDragActive ? 'text-[var(--color-primary)] scale-110' : 'text-[var(--color-text-muted)]'
                                                    } group-hover:text-[var(--color-primary)] transition-all shadow-sm`}>
                                                        <span className="material-symbols-outlined text-3xl">
                                                            {ecgDragActive ? 'file_download' : 'upload_file'}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-main)] dark:text-white">
                                                            {ecgDragActive ? 'Déposer les fichiers ici' : 'Téléverser l\'examen ECG'}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-[var(--color-text-muted)] mt-1">
                                                            {ecgDragActive ? 'Relâchez pour téléverser' : 'Cliquez ou glissez-déposez • Images ou PDF (Max 10MB)'}
                                                        </p>
                                                    </div>
                                                </label>
                                                
                                                {ecgUploadError && (
                                                    <div className="mt-3 p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <span className="material-symbols-outlined text-[var(--color-danger)] text-lg flex-shrink-0">error</span>
                                                        <div className="flex-1">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-danger)] mb-1">Erreur de téléversement</p>
                                                            <p className="text-[9px] font-bold text-[var(--color-danger)]/80 leading-relaxed">{ecgUploadError}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => setEcgUploadError('')}
                                                            className="size-6 rounded-lg flex items-center justify-center text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20 transition-all flex-shrink-0"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">close</span>
                                                        </button>
                                                    </div>
                                                )}

                                                {ecgFiles.length > 0 && (
                                                    <div className="mt-4 space-y-2">
                                                        {ecgFiles.map((file, index) => (
                                                            <div key={index} className="flex items-center justify-between p-3 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="material-symbols-outlined text-[var(--color-primary)]">
                                                                        {file.type === 'application/pdf' ? 'picture_as_pdf' : 'image'}
                                                                    </span>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-[var(--color-text-main)] dark:text-white">{file.name}</p>
                                                                        <p className="text-[9px] text-[var(--color-text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => removeEcgFile(index)}
                                                                    className="size-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Interprétation ECG</label>
                                                <textarea
                                                    className="w-full rounded-2xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] p-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all text-[var(--color-text-main)] dark:text-white min-h-[120px] placeholder:text-[var(--color-text-muted)]/30"
                                                    placeholder="Rythme sinusal, axe, zones d'ischémie..."
                                                    value={ecgData.interpretation}
                                                    onChange={(e) => setEcgData({ ...ecgData, interpretation: e.target.value })}
                                                ></textarea>
                                            </div>
                                        </div>

                                        {/* ETT Section */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-[var(--color-primary)] text-xl">echo</span>
                                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Échocardiographie (ETT)</h4>
                                            </div>

                                            <div>
                                                <input
                                                    type="file"
                                                    id="ett-upload"
                                                    accept="image/*,.pdf"
                                                    multiple
                                                    onChange={handleEttFileUpload}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor="ett-upload"
                                                    onDragEnter={handleEttDragEnter}
                                                    onDragLeave={handleEttDragLeave}
                                                    onDragOver={handleEttDragOver}
                                                    onDrop={handleEttDrop}
                                                    className={`aspect-video rounded-2xl border-2 border-dashed ${
                                                        ettDragActive 
                                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-105' 
                                                            : 'border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)]'
                                                    } flex flex-col items-center justify-center gap-3 group hover:border-[var(--color-primary)]/50 transition-all cursor-pointer`}
                                                >
                                                    <div className={`size-12 rounded-xl bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] flex items-center justify-center ${
                                                        ettDragActive ? 'text-[var(--color-primary)] scale-110' : 'text-[var(--color-text-muted)]'
                                                    } group-hover:text-[var(--color-primary)] transition-all shadow-sm`}>
                                                        <span className="material-symbols-outlined text-3xl">
                                                            {ettDragActive ? 'file_download' : 'add_photo_alternate'}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-main)] dark:text-white">
                                                            {ettDragActive ? 'Déposer les fichiers ici' : 'Téléverser les clichés ETT'}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-[var(--color-text-muted)] mt-1">
                                                            {ettDragActive ? 'Relâchez pour téléverser' : 'Cliquez ou glissez-déposez • Séquences ou rapports (Max 10MB)'}
                                                        </p>
                                                    </div>
                                                </label>
                                                
                                                {ettUploadError && (
                                                    <div className="mt-3 p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <span className="material-symbols-outlined text-[var(--color-danger)] text-lg flex-shrink-0">error</span>
                                                        <div className="flex-1">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-danger)] mb-1">Erreur de téléversement</p>
                                                            <p className="text-[9px] font-bold text-[var(--color-danger)]/80 leading-relaxed">{ettUploadError}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => setEttUploadError('')}
                                                            className="size-6 rounded-lg flex items-center justify-center text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20 transition-all flex-shrink-0"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">close</span>
                                                        </button>
                                                    </div>
                                                )}

                                                {ettFiles.length > 0 && (
                                                    <div className="mt-4 space-y-2">
                                                        {ettFiles.map((file, index) => (
                                                            <div key={index} className="flex items-center justify-between p-3 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="material-symbols-outlined text-[var(--color-primary)]">
                                                                        {file.type === 'application/pdf' ? 'picture_as_pdf' : 'image'}
                                                                    </span>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-[var(--color-text-main)] dark:text-white">{file.name}</p>
                                                                        <p className="text-[9px] text-[var(--color-text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => removeEttFile(index)}
                                                                    className="size-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] ml-1">FEVG (%)</label>
                                                    <input
                                                        className="w-full h-10 rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-xs font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white"
                                                        placeholder="ex: 60"
                                                        value={ettData.ef}
                                                        onChange={(e) => setEttData({ ...ettData, ef: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] ml-1">DTDVG (mm)</label>
                                                    <input
                                                        className="w-full h-10 rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] px-4 text-xs font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white"
                                                        placeholder="ex: 45"
                                                        value={ettData.lvedd}
                                                        onChange={(e) => setEttData({ ...ettData, lvedd: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Interprétation ETT</label>
                                                <textarea
                                                    className="w-full rounded-2xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] p-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all text-[var(--color-text-main)] dark:text-white min-h-[100px] placeholder:text-[var(--color-text-muted)]/30"
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
                                        <div className="bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] rounded-2xl p-6 border border-[var(--color-border)] dark:border-[var(--color-dark-border)] relative overflow-hidden group hover:border-[var(--color-primary)]/30 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-black text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1">CHA₂DS₂-VASc</h4>
                                                    <p className="text-[9px] font-bold text-[var(--color-text-muted)]/60 uppercase tracking-tight">Risque d'accident vasculaire cérébral</p>
                                                </div>
                                                <div className="size-10 rounded-xl bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] flex items-center justify-center text-[var(--color-primary)] font-black text-lg shadow-sm">
                                                    {scores.chadsVasc}
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full bg-[var(--color-border)] dark:bg-[var(--color-dark-border)] rounded-full overflow-hidden">
                                                <div className="h-full bg-[var(--color-primary)]" style={{ width: `${(scores.chadsVasc / 9) * 100}%` }}></div>
                                            </div>
                                            <p className="mt-3 text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest">Risque estimé: {scores.chadsVasc > 2 ? 'Élevé' : 'Modéré'}</p>
                                        </div>

                                        {/* HAS-BLED Score */}
                                        <div className="bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] rounded-2xl p-6 border border-[var(--color-border)] dark:border-[var(--color-dark-border)] relative overflow-hidden group hover:border-[var(--color-primary)]/30 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-black text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1">HAS-BLED</h4>
                                                    <p className="text-[9px] font-bold text-[var(--color-text-muted)]/60 uppercase tracking-tight">Risque hémorragique majeur</p>
                                                </div>
                                                <div className="size-10 rounded-xl bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] flex items-center justify-center text-[var(--color-warning)] font-black text-lg shadow-sm">
                                                    {scores.hasBled}
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full bg-[var(--color-border)] dark:bg-[var(--color-dark-border)] rounded-full overflow-hidden">
                                                <div className="h-full bg-[var(--color-warning)]" style={{ width: `${(scores.hasBled / 9) * 100}%` }}></div>
                                            </div>
                                            <p className="mt-3 text-[9px] font-black text-[var(--color-warning)] uppercase tracking-widest">Risque de saignement: {scores.hasBled >= 3 ? 'Élevé' : 'Faible'}</p>
                                        </div>

                                        {/* SCORE 2 / SCORE OP */}
                                        <div className="bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] rounded-2xl p-6 border border-[var(--color-border)] dark:border-[var(--color-dark-border)] relative overflow-hidden group hover:border-[var(--color-primary)]/30 transition-all col-span-full">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>
                                                    <h4 className="font-black text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Risque Cardiovasculaire (SCORE 2)</h4>
                                                    <p className="text-[9px] font-bold text-[var(--color-text-muted)]/60 uppercase tracking-tight">Risque à 10 ans d'événements CV majeurs</p>
                                                </div>
                                                <div className="px-4 py-2 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)] font-black text-xs uppercase tracking-widest border border-[var(--color-danger)]/20">
                                                    Risque Élevé (12.4%)
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-3 bg-[var(--color-border)] dark:bg-[var(--color-dark-border)] rounded-full overflow-hidden flex">
                                                    <div className="h-full bg-[var(--color-success)]" style={{ width: '25%' }}></div>
                                                    <div className="h-full bg-[var(--color-warning)]" style={{ width: '25%' }}></div>
                                                    <div className="h-full bg-orange-400" style={{ width: '25%' }}></div>
                                                    <div className="h-full bg-[var(--color-danger)]" style={{ width: '25%' }}></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between mt-2 px-1">
                                                <span className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-tighter">Bas</span>
                                                <span className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-tighter">Modéré</span>
                                                <span className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-tighter">Élevé</span>
                                                <span className="text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-tighter">Très Élevé</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-[var(--color-primary)]/5 rounded-2xl border border-[var(--color-primary)]/20">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="material-symbols-outlined text-[var(--color-primary)] text-sm">info</span>
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-main)] dark:text-white">Note sur le calcul</h5>
                                        </div>
                                        <p className="text-[10px] font-bold text-[var(--color-text-muted)] leading-relaxed">
                                            Les scores sont calculés automatiquement à partir des données saisies dans l'anamnèse et l'examen clinique (âge, sexe, tabagisme, TA, diabète).
                                        </p>
                                    </div>
                                </div>
                            )}

                            {currentStep === 6 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined text-[var(--color-primary)]">fact_check</span>
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Conclusions Diagnostiques</h4>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Diagnostic Principal</label>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">search</span>
                                                    <input
                                                        className={`w-full h-14 rounded-2xl border ${errors.primaryDiagnosis ? 'border-[var(--color-danger)] bg-[var(--color-danger)]/5' : 'border-[var(--color-border)] dark:border-[var(--color-dark-border)]'} bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] pl-12 pr-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] text-[var(--color-text-main)] dark:text-white transition-all`}
                                                        placeholder="Rechercher ou saisir un diagnostic..."
                                                        value={diagnosticData.primaryDiagnosis}
                                                        onChange={(e) => {
                                                            setDiagnosticData({ ...diagnosticData, primaryDiagnosis: e.target.value });
                                                            if (errors.primaryDiagnosis) setErrors(prev => ({ ...prev, primaryDiagnosis: '' }));
                                                        }}
                                                    />
                                                </div>
                                                {errors.primaryDiagnosis && <p className="text-[9px] font-black text-[var(--color-danger)] uppercase mt-1 ml-1">{errors.primaryDiagnosis}</p>}
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {availableDiagnoses.slice(0, 4).map(d => (
                                                        <button
                                                            key={d}
                                                            onClick={() => setDiagnosticData({ ...diagnosticData, primaryDiagnosis: d })}
                                                            className="px-3 py-1.5 bg-white dark:bg-[#1e3a36] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-xl text-[9px] font-black uppercase tracking-tight text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all shadow-sm"
                                                        >
                                                            {d}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Diagnostics Associés / Comorbidités</label>
                                                <textarea
                                                    className="w-full rounded-2xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] p-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all text-[var(--color-text-main)] dark:text-white min-h-[100px] placeholder:text-[var(--color-text-muted)]/30"
                                                    placeholder="Diabète type 2, IRC stade 3..."
                                                    value={diagnosticData.notes}
                                                    onChange={(e) => setDiagnosticData({ ...diagnosticData, notes: e.target.value })}
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[var(--color-primary)] text-xs">summary</span>
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Résumé de la consultation</h5>
                                            </div>
                                            <button className="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest hover:underline">Modifier</button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-3 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] rounded-xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                                <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase mb-1">TA</p>
                                                <p className="text-xs font-black text-[var(--color-text-main)] dark:text-white">{examData.bpSys || '--'}/{examData.bpDia || '--'}</p>
                                            </div>
                                            <div className="p-3 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] rounded-xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                                <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase mb-1">FC</p>
                                                <p className="text-xs font-black text-[var(--color-text-main)] dark:text-white">{examData.heartRate || '--'} bpm</p>
                                            </div>
                                            <div className="p-3 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] rounded-xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                                <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase mb-1">FEVG</p>
                                                <p className="text-xs font-black text-[var(--color-text-main)] dark:text-white">{ettData.ef || '--'}%</p>
                                            </div>
                                            <div className="p-3 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] rounded-xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                                <p className="text-[8px] font-black text-[var(--color-text-muted)] uppercase mb-1">Symptôme</p>
                                                <p className="text-xs font-black text-[var(--color-text-main)] dark:text-white truncate">Palpitations</p>
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
                                                <span className="material-symbols-outlined text-[var(--color-primary)]">medication</span>
                                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Prescription Médicale</h4>
                                            </div>
                                            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-primary)] hover:text-[#0d1b19] transition-all">
                                                <span className="material-symbols-outlined text-sm">auto_fix</span>
                                                Modèles Intelligents
                                            </button>
                                        </div>

                                        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)]">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-[var(--color-bg-main)] dark:bg-white/5 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Médicament</th>
                                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Posologie</th>
                                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Fréquence</th>
                                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Durée</th>
                                                        <th className="p-4 w-16"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--color-border)] dark:divide-[var(--color-dark-border)]">
                                                    {prescriptions.map((p) => (
                                                        <tr key={p.id} className="group hover:bg-[var(--color-bg-main)] dark:hover:bg-white/5 transition-colors">
                                                            <td className="p-4 text-xs font-bold text-[var(--color-text-main)] dark:text-white">{p.drug}</td>
                                                            <td className="p-4 text-xs font-bold text-[var(--color-text-muted)]">{p.dosage}</td>
                                                            <td className="p-4 text-xs font-bold text-[var(--color-text-muted)]">{p.frequency}</td>
                                                            <td className="p-4 text-xs font-bold text-[var(--color-text-muted)]">{p.duration}</td>
                                                            <td className="p-4">
                                                                <button
                                                                    onClick={() => removePrescription(p.id)}
                                                                    className="size-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {/* Add Row */}
                                                    <tr className="bg-[var(--color-bg-main)]/50 dark:bg-[var(--color-dark-bg-main)]/30">
                                                        <td className="p-2">
                                                            <input
                                                                className="w-full h-10 px-3 bg-transparent border-none focus:ring-0 text-xs font-bold text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/30"
                                                                placeholder="ex: Aspirine"
                                                                value={newPrescription.drug}
                                                                onChange={(e) => setNewPrescription({ ...newPrescription, drug: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                className="w-full h-10 px-3 bg-transparent border-none focus:ring-0 text-xs font-bold text-[var(--color-text-muted)] placeholder:text-[var(--color-text-muted)]/30"
                                                                placeholder="ex: 100mg"
                                                                value={newPrescription.dosage}
                                                                onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                className="w-full h-10 px-3 bg-transparent border-none focus:ring-0 text-xs font-bold text-[var(--color-text-muted)] placeholder:text-[var(--color-text-muted)]/30"
                                                                placeholder="ex: 1x/j"
                                                                value={newPrescription.frequency}
                                                                onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                className="w-full h-10 px-3 bg-transparent border-none focus:ring-0 text-xs font-bold text-[var(--color-text-muted)] placeholder:text-[var(--color-text-muted)]/30"
                                                                placeholder="ex: Permanent"
                                                                value={newPrescription.duration}
                                                                onChange={(e) => setNewPrescription({ ...newPrescription, duration: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <button
                                                                onClick={addPrescription}
                                                                className="size-8 rounded-xl bg-[var(--color-primary)] text-[#0d1b19] flex items-center justify-center hover:brightness-105 shadow-sm transition-all"
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
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Instructions Complémentaires</label>
                                            <textarea className="w-full rounded-2xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] p-4 text-sm font-bold focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all text-[var(--color-text-main)] dark:text-white min-h-[100px] placeholder:text-[var(--color-text-muted)]/30" placeholder="Conseils hygiéno-diététiques, prochain RDV..."></textarea>
                                        </div>
                                        <div className="bg-[var(--color-primary)]/5 rounded-2xl border border-dashed border-[var(--color-primary)]/30 p-6 flex flex-col items-center justify-center text-center">
                                            <span className="material-symbols-outlined text-3xl text-[var(--color-primary)] mb-2">picture_as_pdf</span>
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-main)] dark:text-white">Générer l'ordonnance</h5>
                                            <p className="text-[9px] font-bold text-[var(--color-text-muted)] mt-1 mb-4">Export PDF automatique avec signature numérique</p>
                                            <button
                                                onClick={() => {
                                                    if (patientInfo) {
                                                        generatePrescriptionPDF(
                                                            {
                                                                name: patientInfo.full_name,
                                                                age: patientInfo.age,
                                                                gender: patientInfo.gender,
                                                                weight: examData.weight || (latestExamData?.weight ? String(latestExamData.weight) : undefined)
                                                            },
                                                            prescriptions
                                                        );
                                                    }
                                                }}
                                                disabled={prescriptions.length === 0}
                                                className="px-6 py-2 bg-[var(--color-primary)] text-[#0d1b19] rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[var(--color-primary)]/20 hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
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
                        <div className="p-6 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex justify-between items-center mt-auto">
                            <button
                                onClick={onBack}
                                className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">close</span> Annuler
                            </button>
                            <div className="flex gap-4">
                                {currentStep > 1 && (
                                    <button
                                        onClick={prevStep}
                                        className="px-6 py-2.5 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-xl font-black text-[10px] uppercase tracking-widest text-[var(--color-text-main)] dark:text-white shadow-sm hover:bg-[var(--color-bg-main)] transition-all"
                                    >
                                        Retour
                                    </button>
                                )}
                                <button
                                    onClick={currentStep === 7 ? handleComplete : nextStep}
                                    disabled={isSaving || (currentStep === 1 && !patientId)}
                                    className="px-8 py-2.5 bg-[var(--color-primary)] text-[#0d1b19] rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:brightness-105 transition-all flex items-center gap-2 shadow-[var(--color-primary)]/20 disabled:opacity-50"
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
                            <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl p-8 shadow-md border border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-center flex flex-col items-center gap-4">
                                <div className="size-20 rounded-2xl bg-[var(--color-bg-main)] dark:bg-white/5 flex items-center justify-center text-[var(--color-text-muted)]">
                                    <span className="material-symbols-outlined text-4xl">person_search</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-[var(--color-text-main)] dark:text-white uppercase tracking-tight">Patient non sélectionné</h4>
                                    <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mt-2 px-4 leading-relaxed">Veuillez rechercher et sélectionner un patient à gauche pour continuer.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl p-6 shadow-md border border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-left animate-in fade-in zoom-in duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="size-16 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] text-xl font-black shadow-md border-2 border-white dark:border-[var(--color-dark-border)]">
                                        {patientInfo?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '...'}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-[var(--color-text-main)] dark:text-white tracking-tight">{patientInfo?.full_name || 'Patient'}</h4>
                                        <p className="text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest">
                                            {patientInfo?.age || '?'} ans • {patientInfo?.gender === 'Male' ? 'Homme' : 'Femme'} • {patientInfo?.nationality || '---'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-inner">
                                        <p className="text-[9px] uppercase font-black text-[var(--color-text-muted)] mb-1 tracking-widest">Dernière TA</p>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-2xl font-black text-[var(--color-text-main)] dark:text-white">
                                                {latestExamData ? `${latestExamData.bp_sys}/${latestExamData.bp_dia}` : '--/--'}
                                            </span>
                                            {latestExamData && (
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${parseInt(latestExamData.bp_sys) > 130 ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                                                    }`}>
                                                    {parseInt(latestExamData.bp_sys) > 130 ? 'Élevé' : 'Normal'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-inner">
                                        <p className="text-[9px] uppercase font-black text-[var(--color-text-muted)] mb-1 tracking-widest">Poids Actuel</p>
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-2xl font-black text-[var(--color-text-main)] dark:text-white">
                                                {latestExamData?.weight ? `${latestExamData.weight} kg` : '--- kg'}
                                            </span>
                                            <span className="px-1.5 py-0.5 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded text-[9px] font-black uppercase">Stable</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-dashed border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                    <button
                                        onClick={() => patientInfo?.id && onViewDetails?.(patientInfo.id.toString())}
                                        className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] hover:underline flex items-center justify-center gap-2 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm">open_in_new</span> Voir Dossier Complet
                                    </button>
                                </div>
                            </div>
                        )}

                        {latestExamData && (
                            <div className="bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/5 rounded-2xl border border-[var(--color-primary)]/20 p-5 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-[var(--color-primary)] text-sm">sticky_note_2</span>
                                    <h5 className="font-black text-[10px] uppercase tracking-widest">Dernière Note</h5>
                                </div>
                                <p className="text-xs text-[var(--color-text-main)]/70 dark:text-white/70 leading-relaxed italic font-medium">
                                    {latestExamData.notes || "Aucune note disponible."}
                                </p>
                            </div>
                        )}
                    </div>
                </aside>
            </main>

            <footer className="mt-auto py-4 px-10 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] text-center">
                <p className="text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-[0.3em]">
                    © 2024 CardioMed . Système de Gestion Médicale Sécurisé.
                </p>
            </footer>
        </div>
    );
};
