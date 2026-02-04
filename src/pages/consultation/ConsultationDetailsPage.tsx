import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { DatabaseService } from '../../services/database';

interface ConsultationDetailsPageProps {
    consultationId?: string;
    onBack: () => void;
}

export const ConsultationDetailsPage: React.FC<ConsultationDetailsPageProps> = ({ consultationId, onBack }) => {
    const [consultation, setConsultation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false)
        console.log('consultationId not started', consultationId);

        if (consultationId) {
            console.log('consultationId', consultationId);
            DatabaseService.getConsultationDetails(parseInt(consultationId))
                .then((data) => {
                    console.log('consultation data', data);
                    setConsultation(data)
                })
                .catch(err => console.error('Failed to load consultation details:', err))
                .finally(() => setIsLoading(false));
        }
    }, [consultationId]);

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[#f6f8f8] dark:bg-[#10221f]">
                <div className="text-primary font-black animate-pulse">Chargement du rapport...</div>
            </div>
        );
    }

    if (!consultation) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center bg-[#f6f8f8] dark:bg-[#10221f] gap-4">
                <div className="text-[#4c9a8d] font-black">Rapport non trouvé.</div>
                <Button onClick={onBack}>Retour</Button>
            </div>
        );
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const secondaryDiagnoses = consultation.diagnostic?.secondary_diagnoses
        ? JSON.parse(consultation.diagnostic.secondary_diagnoses)
        : [];

    return (
        <div className="flex flex-col flex-1 bg-[#f6f8f8] dark:bg-[#10221f] font-sans text-[#0d1b19] dark:text-white min-h-full">
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
                    <span className="text-xs font-black uppercase tracking-widest text-[#4c9a8d]">Détails Consultation</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-[#0d1b19] font-black border-2 border-white dark:border-[#1e3a36] shadow-sm">
                        DR
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[1440px] mx-auto w-full p-6 flex gap-8">
                <div className="flex-1 flex flex-col gap-6 pb-12">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] text-left">
                        <span className="hover:text-primary cursor-pointer" onClick={onBack}>Consultations</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="text-[#0d1b19] dark:text-white">Détails du {formatDate(consultation.created_at)}</span>
                    </div>

                    <div className="bg-white dark:bg-[#152a26] rounded-2xl shadow-md border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden flex flex-col text-left">
                        <div className="p-6 border-b border-[#f6f8f8] dark:border-white/5 flex items-center justify-between bg-[#f8fcfb] dark:bg-white/5">
                            <div>
                                <h3 className="text-xl font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">Rapport de Consultation</h3>
                                <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mt-1">Patient: {consultation.patient_name} • {formatDate(consultation.created_at)}</p>
                            </div>
                            <Button icon="print" variant="outline" size="sm">Imprimer</Button>
                        </div>

                        <div className="p-8 space-y-10">
                            {/* Section 1: Examen Clinique */}
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-primary">clinical_notes</span>
                                    <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Examen Clinique</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-[#f6f8f8] dark:bg-[#10221f] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36]">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1">Tension Artérielle</p>
                                        <p className="text-sm font-bold text-[#0d1b19] dark:text-white">{consultation.clinical_exam?.bp_sys}/{consultation.clinical_exam?.bp_dia} mmHg</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1">Fréquence Cardiaque</p>
                                        <p className="text-sm font-bold text-[#0d1b19] dark:text-white">{consultation.clinical_exam?.heart_rate} bpm</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1">Poids / Taille</p>
                                        <p className="text-sm font-bold text-[#0d1b19] dark:text-white">{consultation.clinical_exam?.weight}kg / {consultation.clinical_exam?.height}cm</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1">IMC</p>
                                        <p className="text-sm font-bold text-primary">{consultation.clinical_exam?.bmi}</p>
                                    </div>
                                </div>
                            </section>

                            <hr className="border-[#e7f3f1] dark:border-[#1e3a36]" />

                            {/* Section 2: ECG & ETT */}
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-primary">monitor_heart</span>
                                    <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Examens Paracliniques</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-6 bg-[#f6f8f8] dark:bg-[#10221f] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36]">
                                        <h5 className="text-xs font-black uppercase tracking-widest text-[#0d1b19] dark:text-white mb-4">Interprétation ECG</h5>
                                        <p className="text-xs text-[#0d1b19]/70 dark:text-white/70 italic">"{consultation.ecg_ett?.ecg_interpretation || 'Aucune interprétation saisie.'}"</p>
                                    </div>
                                    <div className="p-6 bg-[#f6f8f8] dark:bg-[#10221f] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36]">
                                        <h5 className="text-xs font-black uppercase tracking-widest text-[#0d1b19] dark:text-white mb-2">Échocardiographie (ETT)</h5>
                                        <div className="flex justify-between items-center text-xs mb-2">
                                            <span className="text-[#4c9a8d] font-bold">FEVG (%)</span>
                                            <span className="text-[#0d1b19] dark:text-white font-black">{consultation.ecg_ett?.ett_fevg || '--'}%</span>
                                        </div>
                                        <p className="text-xs text-[#0d1b19]/70 dark:text-white/70 italic mt-4">"{consultation.ecg_ett?.ett_interpretation || 'Aucune interprétation saisie.'}"</p>
                                    </div>
                                </div>
                            </section>

                            <hr className="border-[#e7f3f1] dark:border-[#1e3a36]" />

                            {/* Section 3: Diagnostic & Traitement */}
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-primary">medical_services</span>
                                    <h4 className="font-black text-xs uppercase tracking-[0.2em] text-[#4c9a8d]">Conclusion Clinique</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="material-symbols-outlined text-primary">diagnosis</span>
                                            <h5 className="text-xs font-black uppercase tracking-widest text-[#0d1b19] dark:text-white">Diagnostic Retenu</h5>
                                        </div>
                                        <p className="text-lg font-black text-[#0d1b19] dark:text-white">{consultation.diagnostic?.primary_diagnosis || 'Non spécifié'}</p>
                                        {secondaryDiagnoses.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {secondaryDiagnoses.map((item: string) => (
                                                    <span key={item} className="px-2 py-1 bg-white/50 dark:bg-[#1e3a36]/50 rounded text-[9px] font-bold text-[#4c9a8d]">
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 bg-[#f6f8f8] dark:bg-[#10221f] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="material-symbols-outlined text-[#4c9a8d]">analytics</span>
                                            <h5 className="text-xs font-black uppercase tracking-widest text-[#0d1b19] dark:text-white">Scores & Risques</h5>
                                        </div>
                                        <ul className="space-y-2">
                                            <li className="flex justify-between text-xs">
                                                <span className="text-[#4c9a8d] font-bold">CHA₂DS₂-VASc</span>
                                                <span className="font-black">{consultation.scores?.chads_vasc || 0}</span>
                                            </li>
                                            <li className="flex justify-between text-xs">
                                                <span className="text-[#4c9a8d] font-bold">HAS-BLED</span>
                                                <span className="font-black">{consultation.scores?.has_bled || 0}</span>
                                            </li>
                                            <li className="flex justify-between text-xs">
                                                <span className="text-[#4c9a8d] font-bold">Risque CV</span>
                                                <span className="font-black text-primary">{consultation.scores?.cv_risk || 'Bas'}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Detailed Prescription Table */}
                                <div className="mt-8 bg-white dark:bg-[#1e3a36] rounded-2xl border border-[#e7f3f1] dark:border-white/5 overflow-hidden shadow-sm">
                                    <div className="px-6 py-4 border-b border-[#f6f8f8] dark:border-white/5 bg-[#f8fcfb] dark:bg-white/5">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-[#4c9a8d]">Détails de l'Ordonnance</h5>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-[#f6f8f8] dark:border-white/5">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4c9a8d]">Médicament</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4c9a8d]">Posologie</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4c9a8d]">Durée</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4c9a8d]">Instructions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#f6f8f8] dark:divide-white/5">
                                            {consultation.prescriptions?.length > 0 ? (
                                                consultation.prescriptions.map((p: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-[#f6f8f8]/50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4 text-xs font-bold text-[#0d1b19] dark:text-white">{p.drug}</td>
                                                        <td className="px-6 py-4 text-xs font-black text-primary">{p.dosage}</td>
                                                        <td className="px-6 py-4 text-xs text-[#4c9a8d]">{p.duration}</td>
                                                        <td className="px-6 py-4 text-xs text-[#0d1b19]/70 dark:text-white/70 italic">{p.frequency}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-10 text-center text-xs text-[#4c9a8d]">Aucune prescription enregistrée.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* Sidebar Summary */}
                <aside className="w-80 flex-shrink-0 hidden xl:block">
                    <div className="sticky top-24 flex flex-col gap-6">
                        <div className="bg-white dark:bg-[#152a26] rounded-2xl p-6 shadow-md border border-[#e7f3f1] dark:border-[#1e3a36] text-left">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="size-16 rounded-2xl bg-[#42f0d3]/10 flex items-center justify-center text-primary text-xl font-black shadow-md border-2 border-white dark:border-[#1e3a36]">
                                    {consultation.patient_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-[#0d1b19] dark:text-white tracking-tight">{consultation.patient_name}</h4>
                                    <p className="text-[#4c9a8d] text-[10px] font-black uppercase tracking-widest">{consultation.patient_age} ans • {consultation.patient_gender} • {consultation.patient_nationality}</p>
                                </div>
                            </div>
                            <Button className="w-full" variant="secondary" icon="edit">Éditer le Dossier</Button>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};
