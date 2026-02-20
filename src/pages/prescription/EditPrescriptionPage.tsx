import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { DatabaseService } from '../../services/database';

interface Prescription {
    id: number;
    drug: string;
    dosage: string;
    frequency: string;
    duration: string;
    consultation_date: string;
    consultation_id: number;
    instructions: string; // Assuming instructions can also be edited
}

interface EditPrescriptionPageProps {
    prescription: Prescription;
    onBack: () => void;
    onSave: (updatedPrescription: Prescription) => void;
}

export const EditPrescriptionPage: React.FC<EditPrescriptionPageProps> = ({
    prescription,
    onBack,
    onSave,
}) => {
    const [editedDrug, setEditedDrug] = useState(prescription.drug);
    const [editedDosage, setEditedDosage] = useState(prescription.dosage);
    const [editedFrequency, setEditedFrequency] = useState(prescription.frequency);
    const [editedDuration, setEditedDuration] = useState(prescription.duration);
    const [editedInstructions, setEditedInstructions] = useState(prescription.instructions || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedPrescription: Prescription = {
                ...prescription,
                drug: editedDrug,
                dosage: editedDosage,
                frequency: editedFrequency,
                duration: editedDuration,
                instructions: editedInstructions,
            };
            // Assuming DatabaseService has an updatePrescription method
            await DatabaseService.updatePrescription(updatedPrescription);
            onSave(updatedPrescription); // Notify parent component of the update
            onBack(); // Go back after saving
        } catch (error) {
            console.error('Failed to update prescription:', error);
            alert('Failed to update prescription. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#f6f8f8] dark:bg-[#101f22] overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="size-10 rounded-xl bg-white dark:bg-[#152a26] border border-[#e7f3f1] dark:border-[#1e3a36] flex items-center justify-center text-[#4c9a8d] hover:text-primary transition-all"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-[#0d1b19] dark:text-white tracking-tight uppercase">
                            Edit Prescription
                        </h1>
                        <p className="text-[#4c9a8d] font-bold uppercase text-xs tracking-widest mt-1">
                            Prescription ID: {prescription.id}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        icon="cancel"
                        onClick={onBack}
                        className="bg-gray-100 dark:bg-white/5 text-[#4c9a8d] border-none px-6 h-10 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                        Cancel
                    </Button>
                    <Button
                        icon={isSaving ? "sync" : "save"}
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`bg-primary text-[#0d1b19] border-none px-8 h-10 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all ${isSaving ? 'animate-pulse' : 'hover:brightness-105'}`}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#152a26] rounded-3xl border border-[#e7f3f1] dark:border-[#1e3a36]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-2">Drug</label>
                        <input
                            type="text"
                            value={editedDrug}
                            onChange={(e) => setEditedDrug(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-2.5 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-2">Dosage</label>
                        <input
                            type="text"
                            value={editedDosage}
                            onChange={(e) => setEditedDosage(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-2.5 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-2">Frequency</label>
                        <input
                            type="text"
                            value={editedFrequency}
                            onChange={(e) => setEditedFrequency(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-2.5 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-2">Duration</label>
                        <input
                            type="text"
                            value={editedDuration}
                            onChange={(e) => setEditedDuration(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-2.5 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-2">Instructions</label>
                        <textarea
                            value={editedInstructions}
                            onChange={(e) => setEditedInstructions(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-2.5 px-4 text-sm font-medium focus:border-primary outline-none transition-all h-32 resize-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
