import React, { useState, useEffect } from 'react';

import { Card } from '../../components/ui/Card';
import { DatabaseService } from '../../services/database';

interface Prescription {
    id: number;
    drug: string;
    dosage: string;
    frequency: string;
    duration: string;
    consultation_date: string;
    consultation_id: number;
}

interface PatientPrescriptionsPageProps {
    patientId: string;
    patientDbId: number;
    patientName: string;
    onBack: () => void;
    onEditPrescription: (prescription: any) => void;
}

export const PatientPrescriptionsPage: React.FC<PatientPrescriptionsPageProps> = ({
    patientId,
    patientDbId,
    patientName,
    onBack,
    onEditPrescription
}) => {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadPrescriptions = async () => {
        setIsLoading(true);
        try {
            const data = await DatabaseService.getPrescriptionsByPatient(patientDbId);
            setPrescriptions(data);
        } catch (error) {
            console.error('Failed to load prescriptions:', error);
        } finally {
            setIsLoading(true); // Wait, should be false
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPrescriptions();
    }, [patientDbId]);

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-[#f6f8f8] dark:bg-[#10221f] text-left">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="size-10 rounded-xl bg-white dark:bg-[#152a26] border border-[#e7f3f1] dark:border-[#1e3a36] flex items-center justify-center text-[#4c9a8d] hover:text-primary transition-all"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-[#0d1b19] dark:text-white tracking-tight uppercase">Historique des Ordonnances</h1>
                        <p className="text-[#4c9a8d] font-bold uppercase text-xs tracking-widest mt-1">Patient: {patientName} ({patientId})</p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4"></div>
                    <p className="text-xs font-black text-[#4c9a8d] uppercase tracking-widest">Récupération des ordonnances...</p>
                </div>
            ) : prescriptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prescriptions.map((px) => (
                        <Card key={px.id} className="p-6 border-[#e7f3f1] dark:border-[#1e3a36] hover:border-primary/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">Date de Consultation</p>
                                    <p className="text-sm font-black text-[#0d1b19] dark:text-white">
                                        {new Date(px.consultation_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onEditPrescription(px)}
                                    className="p-2 rounded-lg bg-[#42f0d3]/10 text-primary opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-[#e7f3f1] dark:border-[#1e3a36]">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-base">pill</span>
                                    <div>
                                        <p className="text-[9px] font-bold text-[#4c9a8d] uppercase">Médicament</p>
                                        <p className="text-xs font-black text-[#0d1b19] dark:text-white">{px.drug}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-bold text-[#4c9a8d] uppercase">Dosage</p>
                                        <p className="text-xs font-black text-[#0d1b19] dark:text-white">{px.dosage}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-[#4c9a8d] uppercase">Fréquence</p>
                                        <p className="text-xs font-black text-[#0d1b19] dark:text-white">{px.frequency}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-[#4c9a8d] uppercase">Durée</p>
                                    <p className="text-xs font-black text-[#0d1b19] dark:text-white">{px.duration}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#152a26] rounded-3xl p-12 text-center border-2 border-dashed border-[#e7f3f1] dark:border-[#1e3a36]">
                    <span className="material-symbols-outlined text-6xl text-[#4c9a8d]/20 mb-4">history_edu</span>
                    <h3 className="text-lg font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">Aucune ordonnance</h3>
                    <p className="text-[#4c9a8d] text-sm font-bold mt-2">Ce patient n'a pas encore d'historique de prescriptions.</p>
                </div>
            )}
        </div>
    );
};
