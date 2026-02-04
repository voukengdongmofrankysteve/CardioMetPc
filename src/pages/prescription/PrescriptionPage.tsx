import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DatabaseService } from '../../services/database';

interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

interface Template {
    id: number | string;
    label: string;
    meds: Omit<Medication, 'id'>[];
}

export const PrescriptionPage: React.FC = () => {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

    // Patient selection state
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    // Consultation selection state
    const [consultations, setConsultations] = useState<any[]>([]);
    const [selectedConsultationId, setSelectedConsultationId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // Modal state
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [newTemplateLabel, setNewTemplateLabel] = useState('');

    // Form state
    const [searchQuery, setSearchQuery] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('Once daily (QD)');
    const [duration, setDuration] = useState('');
    const [instructions, setInstructions] = useState('');

    const selectedConsultation = consultations.find(c => c.id === parseInt(selectedConsultationId));

    useEffect(() => {
        const loadPatients = async () => {
            try {
                const data = await DatabaseService.getPatients();
                setPatients(data);
                // Optionally select the first patient or wait for user
            } catch (error) {
                console.error('Failed to load patients:', error);
            }
        };
        loadPatients();
        const loadTemplates = async () => {
            try {
                const data = await DatabaseService.getTemplates();
                setTemplates(data);
            } catch (error) {
                console.error('Error fetching templates:', error);
            }
        };

        loadTemplates(); // isLoadingTemplates was unused
    }, []);

    useEffect(() => {
        const loadConsultations = async () => {
            if (!selectedPatient) {
                setConsultations([]);
                return;
            }
            try {
                const data = await DatabaseService.getConsultationsByPatient(selectedPatient.id);
                setConsultations(data);
            } catch (error) {
                console.error('Failed to load consultations:', error);
            }
        };
        loadConsultations();
    }, [selectedPatient]);

    const addMedication = () => {
        if (!searchQuery) return;
        const newMed: Medication = {
            id: Math.random().toString(36).substr(2, 9),
            name: searchQuery,
            dosage: dosage || 'N/A',
            frequency,
            duration: duration || '---',
            instructions: instructions || 'Use as directed.'
        };
        setMedications([...medications, newMed]);
        // Reset form
        setSearchQuery('');
        setDosage('');
        setFrequency('Once daily (QD)');
        setDuration('');
        setInstructions('');
    };

    const applyTemplate = (template: Template) => {
        setActiveTemplate(template.id.toString());
        const newMeds = template.meds.map(m => ({
            ...m,
            id: Math.random().toString(36).substr(2, 9)
        }));
        setMedications(newMeds);
    };

    const removeMedication = (id: string) => {
        setMedications(medications.filter(m => m.id !== id));
    };

    const saveTemplate = () => {
        if (!newTemplateLabel || medications.length === 0) return;

        const newTemplate: Template = {
            id: Math.random().toString(36).substr(2, 9),
            label: newTemplateLabel,
            meds: medications.map(({ name, dosage, frequency, duration, instructions }) => ({
                name, dosage, frequency, duration, instructions
            }))
        };

        // In a real app, this would be saved to a DB or local storage
        // For now, we'll just add it to our local list if we had a state for templates
        // Since templates is a constant, we'd need to move it to state to update it
        // Let's assume for this demo we're just closing the modal
        console.log('Template saved:', newTemplate);
        setIsTemplateModalOpen(false);
        setNewTemplateLabel('');
    };

    const handleSavePrescription = async () => {
        if (!selectedPatient || medications.length === 0) {
            alert('Please select a patient and add medications first.');
            return;
        }

        setIsSaving(true);
        try {
            await DatabaseService.savePrescription(
                medications,
                selectedConsultationId ? parseInt(selectedConsultationId) : undefined
            );
            alert('Prescription saved successfully!');
            // Optional: reset page or navigate back
        } catch (error) {
            console.error('Failed to save prescription:', error);
            alert('Failed to save prescription. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#f6f8f8] dark:bg-[#101f22] overflow-hidden">
            {/* Header Context Bar */}
            <header className="bg-white dark:bg-[#152a26] border-b border-[#e7f3f1] dark:border-[#1e3a36] px-8 py-4 shrink-0">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-[#0d1b19] dark:text-white tracking-tight">Smart Prescription Builder</h1>
                        <div className="flex items-center gap-6 mt-2">
                            <div className="relative w-64">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c9a8d] text-sm pointer-events-none">person_search</span>
                                <select
                                    className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-lg py-2 pl-10 pr-4 text-xs font-black uppercase text-[#4c9a8d] tracking-widest focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                                    value={selectedPatient?.id || ''}
                                    onChange={(e) => {
                                        const patient = patients.find(p => p.id === parseInt(e.target.value));
                                        setSelectedPatient(patient);
                                    }}
                                >
                                    <option value="" disabled>Select Patient...</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative w-64">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c9a8d] text-sm pointer-events-none">history_edu</span>
                                <select
                                    className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-lg py-2 pl-10 pr-4 text-xs font-black uppercase text-[#4c9a8d] tracking-widest focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                                    value={selectedConsultationId}
                                    onChange={(e) => setSelectedConsultationId(e.target.value)}
                                    disabled={!selectedPatient}
                                >
                                    <option value="">Link to Consultation (Optional)</option>
                                    {consultations.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {new Date(c.created_at).toLocaleDateString()} - {c.reason || 'No reason'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedPatient && (
                                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 transition-all">
                                    <span className="h-4 w-px bg-[#e7f3f1] dark:bg-[#1e3a36]"></span>
                                    <div className="flex items-center gap-2 text-[11px] text-[#4c9a8d] font-black uppercase tracking-widest">
                                        <span className="text-[#0d1b19] dark:text-white">{selectedPatient.age} ans</span>
                                        <span className="opacity-30">•</span>
                                        <span>{selectedPatient.gender}</span>
                                        <span className="opacity-30">•</span>
                                        <span className="text-primary">{selectedPatient.patient_id}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            icon="save_as"
                            onClick={() => setIsTemplateModalOpen(true)}
                            className="bg-gray-100 dark:bg-white/5 text-[#4c9a8d] border-none px-6 h-10 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                        >
                            Save Template
                        </Button>
                        <Button
                            icon={isSaving ? "sync" : "verified"}
                            onClick={handleSavePrescription}
                            disabled={isSaving || medications.length === 0 || !selectedPatient}
                            className={`bg-primary text-[#0d1b19] border-none px-8 h-10 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all ${isSaving ? 'animate-pulse' : 'hover:brightness-105'}`}
                        >
                            {isSaving ? 'Saving...' : 'Finalize & Save'}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Input Controls */}
                <aside className="w-[480px] border-r border-[#e7f3f1] dark:border-[#1e3a36] flex flex-col overflow-y-auto no-scrollbar p-8">
                    <section className="space-y-10">
                        {/* Templates */}
                        <div>
                            <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-4">Smart Selection Templates</h3>
                            <div className="flex flex-wrap gap-2">
                                {templates.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => applyTemplate(t)}
                                        className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeTemplate === t.id.toString()
                                            ? 'bg-primary border-primary text-[#0d1b19] shadow-lg shadow-primary/20'
                                            : 'bg-white dark:bg-[#152a26] border-[#e7f3f1] dark:border-[#1e3a36] text-[#4c9a8d] hover:border-primary/50'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search & Entry Form */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-3">Search Medication</h3>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4c9a8d] text-lg group-focus-within:text-primary transition-colors">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search drug (e.g. Bisoprolol, Lisinopril, Warfarin)..."
                                        className="w-full bg-white dark:bg-[#152a26] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:border-primary outline-none transition-all shadow-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-2">Dosage</h3>
                                    <input
                                        type="text"
                                        placeholder="e.g. 5mg"
                                        className="w-full bg-white dark:bg-[#152a26] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-2xl py-3.5 px-4 text-sm font-medium focus:border-primary outline-none transition-all shadow-sm"
                                        value={dosage}
                                        onChange={(e) => setDosage(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-2">Frequency</h3>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-white dark:bg-[#152a26] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-2xl py-3.5 px-4 text-sm font-medium focus:border-primary outline-none transition-all appearance-none cursor-pointer shadow-sm"
                                            value={frequency}
                                            onChange={(e) => setFrequency(e.target.value)}
                                        >
                                            <option>Once daily (QD)</option>
                                            <option>Twice daily (BID)</option>
                                            <option>Three times daily (TID)</option>
                                            <option>As needed (PRN)</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#4c9a8d] pointer-events-none">expand_more</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-2">Duration</h3>
                                <input
                                    type="text"
                                    placeholder="e.g. 30 days, 1 week, Life long..."
                                    className="w-full bg-white dark:bg-[#152a26] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-2xl py-3.5 px-4 text-sm font-medium focus:border-primary outline-none transition-all shadow-sm"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-2">Special Instructions</h3>
                                <textarea
                                    placeholder="Take with food, avoid grapefruit..."
                                    className="w-full bg-white dark:bg-[#152a26] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-2xl py-4 px-4 text-sm font-medium focus:border-primary outline-none transition-all h-28 no-scrollbar resize-none shadow-sm"
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                />
                            </div>

                            <Button
                                icon="add"
                                className="w-full bg-[#e0f7f3] dark:bg-primary/20 text-[#0d1b19] dark:text-primary hover:bg-primary hover:text-[#0d1b19] h-14 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/5 transition-all"
                                onClick={addMedication}
                            >
                                Add to Prescription
                            </Button>
                        </div>

                        {/* Active Medications List */}
                        <div>
                            <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-4">Active Medications in List</h3>
                            <div className="space-y-3">
                                {medications.map(med => (
                                    <div key={med.id} className="bg-white dark:bg-[#152a26] p-5 rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] group relative animate-in fade-in slide-in-from-left-2 duration-300 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-xl">pill</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-black text-[#0d1b19] dark:text-white tracking-tight truncate">{med.name}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] font-black text-[#4c9a8d] uppercase">{med.dosage}</span>
                                                    <span className="text-[#4c9a8d] opacity-30">•</span>
                                                    <span className="text-[9px] font-black text-[#4c9a8d] uppercase">{med.frequency}</span>
                                                    <span className="text-[#4c9a8d] opacity-30">•</span>
                                                    <span className="text-[9px] font-black text-primary uppercase">{med.duration}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeMedication(med.id)}
                                            className="absolute top-5 right-5 text-[#4c9a8d] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                ))}
                                {medications.length === 0 && (
                                    <div className="py-12 text-center border-2 border-dashed border-[#e7f3f1] dark:border-[#1e3a36] rounded-2xl">
                                        <p className="text-[10px] font-black text-[#4c9a8d] uppercase opacity-30 tracking-widest">No medications added yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </aside>

                {/* Right: Live Preview */}
                <main className="flex-1 bg-[#f0f4f5] dark:bg-[#0d1b19] p-12 flex flex-col items-center overflow-y-auto no-scrollbar print:p-0 print:bg-white print:overflow-visible print:block">
                    <div className="w-full max-w-[850px] flex justify-between items-center mb-8 print:hidden sticky top-0 z-10 py-4 bg-[#f0f4f5] dark:bg-[#0d1b19] backdrop-blur-sm bg-opacity-90">
                        <div className="flex items-center gap-3 text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">
                            <span className="material-symbols-outlined text-lg text-primary">visibility</span>
                            Live Document Preview
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="size-10 bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] flex items-center justify-center text-[#0d1b19] dark:text-white hover:border-primary transition-all shadow-sm">
                                <span className="material-symbols-outlined text-xl">zoom_in</span>
                            </button>
                            <button className="size-10 bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] flex items-center justify-center text-[#0d1b19] dark:text-white hover:border-primary transition-all shadow-sm" onClick={() => window.print()}>
                                <span className="material-symbols-outlined text-xl">print</span>
                            </button>
                        </div>
                    </div>

                    {/* Paper Preview - Real A4 Dimensions (210mm x 297mm) */}
                    <div id="printable-section" className="w-[210mm] min-h-[297mm] bg-white dark:bg-[#152a26] shadow-2xl p-[25mm] relative overflow-hidden flex flex-col origin-top ring-1 ring-black/5 dark:ring-white/5 print:shadow-none print:p-[20mm] print:w-[210mm] print:min-h-[297mm] print:dark:bg-white print:m-0 shrink-0">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary shadow-[0_2px_10px_rgba(66,240,211,0.3)] print:bg-[#0d1b19] print:shadow-none"></div>

                        {/* Letterhead */}
                        <div className="flex justify-between items-start mb-16">
                            <div className="flex gap-6">
                                <div className="size-20 rounded-2xl bg-[#0d1b19] flex items-center justify-center text-primary shrink-0 shadow-2xl ring-4 ring-[#e7f3f1] dark:ring-white/5 print:ring-gray-100 print:shadow-none">
                                    <span className="material-symbols-outlined text-4xl">medical_services</span>
                                </div>
                                <div className="space-y-1.5">
                                    <h2 className="text-xl font-black text-[#0d1b19] dark:text-white uppercase tracking-tighter leading-none print:text-[#0d1b19]">CardioMed </h2>
                                    <p className="text-[10px] font-bold text-[#4c9a8d] tracking-tight">Clinique de Cardiologie • Yaoundé, Cameroun</p>
                                    <p className="text-[10px] font-bold text-[#4c9a8d] tracking-tight">Tél: (+237) 6xx-xxx-xxx • contact@fce-titus.org</p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                                <p className="text-[11px] font-black text-[#0d1b19] dark:text-white uppercase tracking-widest print:text-[#0d1b19]">Date: {new Date().toLocaleDateString()}</p>
                                <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] opacity-40">Ref: RX-{new Date().getFullYear()}-{Math.floor(Math.random() * 10000)}</p>
                            </div>
                        </div>

                        {/* Patient Information Section */}
                        <div className="border-y border-[#e7f3f1] dark:border-[#1e3a36] py-10 mb-16 relative print:border-gray-200">
                            <div className="absolute -top-3 left-6 px-3 bg-white dark:bg-[#152a26] text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.3em] print:bg-white print:text-gray-400">Patient Information</div>
                            <div className="grid grid-cols-2 gap-x-20 gap-y-6">
                                <div className="flex justify-between items-end border-b border-[#f6f8f8] dark:border-white/5 pb-2 print:border-gray-100">
                                    <span className="text-[10px] font-bold text-[#4c9a8d] uppercase opacity-40">Name:</span>
                                    <span className="text-[11px] font-black text-[#0d1b19] dark:text-white uppercase tracking-wide print:text-[#0d1b19]">{selectedPatient?.full_name || '---'}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-[#f6f8f8] dark:border-white/5 pb-2 print:border-gray-100">
                                    <span className="text-[10px] font-bold text-[#4c9a8d] uppercase opacity-40">Age:</span>
                                    <span className="text-[11px] font-black text-[#0d1b19] dark:text-white uppercase print:text-[#0d1b19]">{selectedPatient?.age ? `${selectedPatient.age} Years` : '---'}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-[#f6f8f8] dark:border-white/5 pb-2 print:border-gray-100">
                                    <span className="text-[10px] font-bold text-[#4c9a8d] uppercase opacity-40">Weight:</span>
                                    <span className="text-[11px] font-black text-[#0d1b19] dark:text-white print:text-[#0d1b19]">{selectedPatient?.weight ? `${selectedPatient.weight} kg` : '---'}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-[#f6f8f8] dark:border-white/5 pb-2 print:border-gray-100">
                                    <span className="text-[10px] font-bold text-[#4c9a8d] uppercase opacity-40">DX:</span>
                                    <span className="text-[11px] font-black text-[#0d1b19] dark:text-white uppercase tracking-tight print:text-[#0d1b19]">{selectedConsultation?.primary_diagnosis || (selectedPatient ? 'New Evaluation' : '---')}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-[#f6f8f8] dark:border-white/5 pb-2 print:border-gray-100">
                                    <span className="text-[10px] font-bold text-[#4c9a8d] uppercase opacity-40">Patient ID:</span>
                                    <span className="text-[11px] font-black text-[#0d1b19] dark:text-white uppercase tracking-tight print:text-[#0d1b19]">{selectedPatient?.patient_id || '---'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Rx Body */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary print:hidden">
                                    <span className="material-symbols-outlined text-2xl font-black">medical_information</span>
                                </div>
                                <h2 className="text-2xl font-black italic text-[#0d1b19] dark:text-white tracking-tighter print:text-[#0d1b19]">Rx Prescription</h2>
                            </div>

                            <div className="space-y-12 pl-6 print:pl-0">
                                {medications.map((med, i) => (
                                    <div key={med.id} className="space-y-3 relative group break-inside-avoid">
                                        <div className="absolute -left-6 top-2 size-2.5 rounded-full border-2 border-primary/20 bg-white dark:bg-[#152a26] transition-all group-hover:bg-primary group-hover:border-primary print:hidden"></div>
                                        <h4 className="text-lg font-black text-[#0d1b19] dark:text-white decoration-primary/10 underline underline-offset-8 decoration-4 print:text-[#0d1b19] print:decoration-gray-200">
                                            {i + 1}. {med.name.toUpperCase()} ({med.dosage})
                                        </h4>
                                        <div className="pl-0 space-y-1.5">
                                            <p className="text-[11px] font-bold text-[#4c9a8d] uppercase tracking-widest flex items-center gap-2">
                                                Dur: {med.duration} <span className="opacity-30">•</span> {med.frequency}
                                            </p>
                                            <p className="text-[12px] font-black text-[#0d1b19] dark:text-white italic leading-relaxed print:text-[#0d1b19]">
                                                SIG: {med.instructions}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer Signature */}
                        <div className="mt-auto pt-16 border-t border-[#e7f3f1] dark:border-[#1e3a36] print:border-gray-200">
                            <div className="flex justify-between items-end">
                                <div className="space-y-4 max-w-sm">
                                    <p className="text-[9px] text-[#4c9a8d] leading-relaxed font-black uppercase tracking-tighter opacity-70">
                                        Caution: Please consult your doctor if you experience dizziness or shortness of breath. This prescription is valid for 6 months.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="px-10 py-4 bg-primary/5 dark:bg-white/5 rounded-2xl italic text-primary font-serif text-3xl tracking-tighter shadow-inner ring-1 ring-primary/20 print:bg-white print:ring-0 print:border-b-2 print:border-gray-100">
                                            Dr. Ebogo T.
                                        </div>
                                        <div className="absolute -top-2 -right-2 rotate-12 scale-110 opacity-20 print:hidden">
                                            <span className="material-symbols-outlined text-4xl text-primary">verified_user</span>
                                        </div>
                                    </div>
                                    <div className="text-center space-y-0.5">
                                        <p className="text-[11px] font-black text-[#0d1b19] dark:text-white uppercase tracking-tighter print:text-[#0d1b19]">Dr. Colonel Titus Ebogo</p>
                                        <p className="text-[8px] font-black text-[#4c9a8d] uppercase tracking-[0.3em] opacity-50">Chief Cardiologist</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            #printable-section, #printable-section * {
                                visibility: visible;
                            }
                            #printable-section {
                                position: absolute;
                                left: 0;
                                top: 0;
                                margin: 0;
                                padding: 20mm !important; /* Added padding for print */
                                width: 210mm !important;
                                min-height: 297mm !important;
                                background-color: white !important;
                                color: black !important;
                                z-index: 9999;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                box-sizing: border-box !important;
                            }
                            
                            #printable-section .dark\\:text-white {
                                color: #000000 !important;
                            }
                            
                            @page {
                                size: A4;
                                margin: 0;
                            }
                        }
                    `}} />

                </main>
            </div>

            {/* Save Template Modal */}
            <Modal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                title="Create Medication Template"
                footer={(
                    <>
                        <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
                        <Button onClick={saveTemplate} disabled={!newTemplateLabel}>Save Template</Button>
                    </>
                )}
            >
                <div className="space-y-6">
                    <p className="text-sm text-[#4c9a8d] font-bold">This will save the current list of {medications.length} medication(s) as a reusable template.</p>
                    <div>
                        <h4 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">Template Name</h4>
                        <input
                            type="text"
                            placeholder="e.g., Heart Failure Protocol"
                            className="w-full bg-[#f6f8f8] dark:bg-[#10221f] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-2xl py-4 px-6 text-sm font-bold text-[#0d1b19] dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={newTemplateLabel}
                            onChange={(e) => setNewTemplateLabel(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};
