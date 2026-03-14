import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { prescriptionService, patientService, consultationService } from '../../services/api';

interface Medication {
    id: string;
    drug: string;
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

    const [consultations, setConsultations] = useState<any[]>([]);
    const [selectedConsultationId, setSelectedConsultationId] = useState<string>('');
    const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

  

    // Form state
    const [searchQuery, setSearchQuery] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('Once daily (QD)');
    const [duration, setDuration] = useState('');
    const [instructions, setInstructions] = useState('');

  
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const patientsData = await patientService.getPatients();
                setPatients(patientsData);

                const templatesData = await prescriptionService.getTemplates();
                if (templatesData && Array.isArray(templatesData)) {
                    const formattedTemplates = templatesData.map((t: any) => ({
                        id: t.id,
                        label: t.label,
                        meds: (t.medications || []).map((m: any) => ({
                            ...m,
                            drug: m.drug || m.name
                        }))
                    }));
                    setTemplates(formattedTemplates);
                }
            } catch (error) {
                console.error('Failed to load initial data:', error);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const loadConsultations = async () => {
            if (!selectedPatient) {
                setConsultations([]);
                setSelectedConsultationId('');
                return;
            }
            setIsLoadingConsultations(true);
            try {
                const consultationsData = await consultationService.getConsultations(selectedPatient.id);
                setConsultations(consultationsData || []);
                // Automatically select the most recent consultation if available
                if (consultationsData && consultationsData.length > 0) {
                    setSelectedConsultationId(consultationsData[0].id.toString());
                } else {
                    setSelectedConsultationId('');
                }
            } catch (error) {
                console.error('Failed to load consultations:', error);
                setConsultations([]);
            } finally {
                setIsLoadingConsultations(false);
            }
        };
        loadConsultations();
    }, [selectedPatient]);

    const addMedication = () => {
        if (!searchQuery) return;
        const newMed: Medication = {
            id: Math.random().toString(36).substr(2, 9),
            drug: searchQuery,
            dosage: dosage || 'N/A',
            frequency,
            duration: duration || '---',
            instructions: instructions || 'Use as directed.'
        };
        setMedications([...medications, newMed]);
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

    const handleSavePrescription = async () => {
        if (!selectedPatient || medications.length === 0) {
            alert('Please select a patient and add medications first.');
            return;
        }

        setIsSaving(true);
        try {
                const response = await prescriptionService.savePrescription(
                    medications.map(m => ({
                        drug: m.drug,
                        dosage: m.dosage,
                        frequency: m.frequency,
                        duration: m.duration,
                        instructions: m.instructions
                    })),
                    selectedPatient.id,
                    selectedConsultationId ? parseInt(selectedConsultationId) : undefined
                );

                if (response) {
                    alert('Prescription saved successfully!');
                    setMedications([]);
                    setSelectedConsultationId('');
                }
        } catch (error) {
            console.error('Failed to save prescription:', error);
            alert('Failed to save prescription.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden text-[#1a3a34]">
            {/* Header */}
            <header className="bg-white border-b border-green-100 px-8 py-4 shrink-0 shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-[#1a3a34] tracking-tight flex items-center gap-2">
                           <span className="material-symbols-outlined text-green-600">prescriptions</span>
                           Prescription Builder
                        </h1>
                        <div className="flex items-center gap-6 mt-3">
                            <div className="relative w-64">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-green-600 text-sm">person_search</span>
                                <select
                                    className="w-full bg-green-50 border border-green-100 rounded-lg py-2 pl-10 pr-4 text-xs font-bold uppercase text-green-800 focus:ring-2 focus:ring-green-500/20 outline-none appearance-none cursor-pointer"
                                    value={selectedPatient?.id || ''}
                                    onChange={(e) => {
                                        const patient = patients.find(p => p.id === parseInt(e.target.value));
                                        setSelectedPatient(patient);
                                    }}
                                >
                                    <option value="" disabled>Select Patient...</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative w-64">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-green-600 text-sm">history_edu</span>
                                <select
                                    className="w-full bg-green-50 border border-green-100 rounded-lg py-2 pl-10 pr-4 text-xs font-bold uppercase text-green-800 focus:ring-2 focus:ring-green-500/20 outline-none appearance-none cursor-pointer"
                                    value={selectedConsultationId}
                                    onChange={(e) => setSelectedConsultationId(e.target.value)}
                                    disabled={!selectedPatient || isLoadingConsultations}
                                >
                                    <option value="">{isLoadingConsultations ? 'Loading...' : (consultations.length > 0 ? 'Link Consultation (Optional)' : 'No Consultations found (Skip)')}</option>
                                    {consultations.map(c => (
                                        <option key={c.id} value={c.id}>{new Date(c.created_at).toLocaleDateString()} - {c.reason?.substring(0, 20)}...</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleSavePrescription}
                            disabled={isSaving || medications.length === 0 || !selectedPatient}
                            className="bg-green-600 hover:bg-green-700 text-white border-none px-8 h-10 text-[11px] font-bold uppercase tracking-widest shadow-md transition-all"
                        >
                            {isSaving ? 'Saving...' : 'Finalize & Save'}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Controls */}
                <aside className="w-[450px] border-r border-green-50 bg-white flex flex-col overflow-y-auto p-8">
                    <section className="space-y-8">
                        <div>
                            <h3 className="text-[11px] font-bold text-green-700 uppercase tracking-widest mb-4">Quick Templates</h3>
                            <div className="flex flex-wrap gap-2">
                                {templates.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => applyTemplate(t)}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${activeTemplate === t.id.toString()
                                            ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                            : 'bg-white border-green-100 text-green-700 hover:bg-green-50'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <h3 className="text-[11px] font-bold text-green-700 uppercase tracking-widest mb-2">Medication Name</h3>
                                <input
                                    type="text"
                                    placeholder="Search drug..."
                                    className="w-full bg-white border-2 border-green-100 rounded-xl py-3 px-4 text-sm focus:border-green-500 outline-none transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-[11px] font-bold text-green-700 uppercase tracking-widest mb-2">Dosage</h3>
                                    <input
                                        type="text"
                                        placeholder="e.g. 5mg"
                                        className="w-full bg-white border-2 border-green-100 rounded-xl py-3 px-4 text-sm focus:border-green-500 outline-none transition-all"
                                        value={dosage}
                                        onChange={(e) => setDosage(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-bold text-green-700 uppercase tracking-widest mb-2">Frequency</h3>
                                    <select
                                        className="w-full bg-white border-2 border-green-100 rounded-xl py-3 px-4 text-sm focus:border-green-500 outline-none appearance-none cursor-pointer"
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value)}
                                    >
                                        <option>Once daily (QD)</option>
                                        <option>Twice daily (BID)</option>
                                        <option>Three times daily (TID)</option>
                                        <option>As needed (PRN)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[11px] font-bold text-green-700 uppercase tracking-widest mb-2">Duration</h3>
                                <input
                                    type="text"
                                    placeholder="e.g. 7 days"
                                    className="w-full bg-white border-2 border-green-100 rounded-xl py-3 px-4 text-sm focus:border-green-500 outline-none transition-all"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                            </div>

                            <Button
                                icon="add"
                                className="w-full bg-green-50 hover:bg-green-100 text-green-700 h-12 text-[11px] font-bold uppercase tracking-widest border-2 border-green-100"
                                onClick={addMedication}
                            >
                                Add Medication
                            </Button>
                        </div>

                        <div className="pt-4 border-t border-green-50">
                            <h3 className="text-[11px] font-bold text-green-700 uppercase tracking-widest mb-4">Added Items ({medications.length})</h3>
                            <div className="space-y-3">
                                {medications.map(med => (
                                    <div key={med.id} className="bg-green-50/50 p-4 rounded-xl border border-green-100 group relative">
                                        <h4 className="text-sm font-bold text-green-900">{med.drug}</h4>
                                        <p className="text-[10px] text-green-700 font-medium uppercase mt-1">{med.dosage} • {med.frequency}</p>
                                        <button onClick={() => removeMedication(med.id)} className="absolute top-4 right-4 text-green-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </aside>

                {/* Right Preview */}
                <main className="flex-1 bg-green-50/30 p-12 flex flex-col items-center overflow-y-auto">
                    <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl p-[20mm] flex flex-col border border-green-100">
                        {/* Letterhead */}
                        <div className="flex justify-between items-start border-b-4 border-green-600 pb-8 mb-10">
                            <div className="flex gap-4">
                                <div className="size-16 rounded-lg bg-green-600 flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-3xl">medical_services</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-green-900 leading-none">CardioMed Clinic</h2>
                                    <p className="text-[10px] font-bold text-green-600 uppercase mt-2">Cardiology Specialization • Yaoundé</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[12px] font-bold text-green-900">Date: {new Date().toLocaleDateString()}</p>
                                <p className="text-[10px] font-medium text-green-500">RX-{new Date().getFullYear()}-001</p>
                            </div>
                        </div>

                        {/* Patient */}
                        <div className="grid grid-cols-2 gap-8 mb-12 bg-green-50/30 p-6 rounded-lg border border-green-100">
                           <div className="text-[12px]"><span className="font-bold text-green-800 uppercase text-[10px] block">Patient Name</span> {selectedPatient?.full_name || '---'}</div>
                           <div className="text-[12px]"><span className="font-bold text-green-800 uppercase text-[10px] block">Patient ID</span> {selectedPatient?.patient_id || '---'}</div>
                        </div>

                        {/* RX Content */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-8">
                                <span className="text-3xl font-serif italic font-bold text-green-700">Rx</span>
                                <div className="h-px bg-green-100 flex-1"></div>
                            </div>

                            <div className="space-y-8">
                                {medications.map((med, i) => (
                                    <div key={med.id} className="border-l-4 border-green-600 pl-6">
                                        <h4 className="text-[16px] font-bold text-green-900">{i + 1}. {med.drug.toUpperCase()}</h4>
                                        <p className="text-[12px] font-bold text-green-600 mt-1">{med.dosage} — {med.frequency}</p>
                                        <p className="text-[11px] text-gray-600 italic mt-1">Duration: {med.duration}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-20 pt-8 border-t border-green-100 flex justify-between items-end">
                            <div className="text-[10px] text-green-600 font-medium">
                                Valid for 30 days from date of issue.
                            </div>
                            <div className="text-center w-48">
                                <div className="h-px bg-green-900 mb-2"></div>
                                <p className="text-[10px] font-bold text-green-900 uppercase">Doctor's Signature</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};