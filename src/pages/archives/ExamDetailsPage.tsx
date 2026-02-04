import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { DatabaseService } from '../../services/database';

interface ExamDetailsPageProps {
    examId: string;
    patientId: string;
    onBack: () => void;
}

export const ExamDetailsPage: React.FC<ExamDetailsPageProps> = ({ examId, patientId, onBack }) => {
    const [exam, setExam] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadExam = async () => {
            try {
                // examId might be prefixed 'ecg-' or 'ett-' from the list. Remove prefix if present, or better yet, verify how it's passed.
                // In PatientDetailsPage we constructed IDs like `ecg-${e.id}`. We need to strip that.
                const realId = parseInt(examId.replace(/^(ecg-|ett-)/, ''));
                if (isNaN(realId)) {
                    console.error("Invalid Exam ID:", examId);
                    return;
                }

                const data = await DatabaseService.getExamById(realId);
                setExam(data);
            } catch (error) {
                console.error("Error loading exam:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadExam();
    }, [examId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f6f8f8] dark:bg-[#10221f]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#4c9a8d] font-black uppercase tracking-widest text-xs">Chargement de l'examen...</p>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f6f8f8] dark:bg-[#10221f]">
                <p className="text-red-500 font-bold">Examen introuvable.</p>
                <Button onClick={onBack}>Retour</Button>
            </div>
        );
    }

    // Determine type and formatted data
    const isECG = !!exam.ecg_interpretation;
    const typeLabel = isECG ? 'ECG' : 'ETT (Echo cardiaque)';
    const resultText = isECG ? exam.ecg_interpretation : exam.ett_interpretation;

    return (
        <div className="flex flex-col min-h-screen bg-[#f6f8f8] dark:bg-[#10221f] font-sans text-[#0d1b19] dark:text-white overflow-y-auto no-scrollbar pb-12">
            {/* Header Structure Matches PatientDetailsPage */}
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
                            <span className="material-symbols-outlined text-white text-sm">monitor_heart</span>
                        </div>
                        <h2 className="text-[#0d1b19] dark:text-white text-lg font-bold leading-tight tracking-tight uppercase">Détails de l'Examen</h2>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em]">
                        <span>Dossier: {patientId}</span>
                        <span className="opacity-30">/</span>
                        <span className="text-[#0d1b19] dark:text-white underline decoration-primary decoration-2 underline-offset-4">{typeLabel}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-[#0d1b19] font-black border-2 border-white dark:border-[#1e3a36] shadow-sm">
                        DR
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto w-full p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Summary Card */}
                <div className="bg-white dark:bg-[#152a26] rounded-3xl p-8 border border-[#e7f3f1] dark:border-[#1e3a36] shadow-xl shadow-primary/5 flex flex-wrap gap-8 items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className={`size-20 rounded-2xl flex items-center justify-center text-4xl shadow-inner ${isECG ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'}`}>
                            <span className="material-symbols-outlined text-4xl">{isECG ? 'ecg_heart' : 'medical_services'}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black tracking-tight text-[#0d1b19] dark:text-white">{typeLabel}</h1>
                                <span className="px-3 py-1 bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-full text-[10px] font-black text-primary uppercase tracking-widest">{exam.id}</span>
                            </div>
                            <p className="text-[#4c9a8d] font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">calendar_today</span> {new Date(exam.date).toLocaleDateString()} • Effectué par {exam.doctor_name || 'Inconnu'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" icon="download" className="h-12 px-6 text-xs font-black uppercase tracking-widest">Télécharger le PDF</Button>
                        <Button icon="print" className="h-12 px-6 text-xs font-black uppercase tracking-widest bg-primary text-[#0d1b19]">Imprimer Rapport</Button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Detailed Data */}
                    <div className="col-span-12 lg:col-span-7 space-y-8">
                        {/* Result Content */}
                        <div className="bg-white dark:bg-[#152a26] rounded-3xl border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden">
                            <div className="p-6 bg-gray-50/50 dark:bg-white/5 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">analytics</span>
                                <h3 className="font-black text-sm uppercase tracking-widest">Interprétration Médicale</h3>
                            </div>
                            <div className="p-8">
                                {isECG ? (
                                    <div className="space-y-6">
                                        <div className="p-5 bg-[#f6f8f8] dark:bg-[#10221f] rounded-2xl">
                                            <p className="text-[10px] font-black text-[#4c9a8d] uppercase mb-2">Conclusion / Interprétation</p>
                                            <p className="text-sm font-medium leading-relaxed italic whitespace-pre-wrap">"{resultText}"</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex justify-between items-center py-2 px-4 bg-[#f6f8f8] dark:bg-[#10221f] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36]">
                                                <span className="text-[10px] font-black text-[#4c9a8d] uppercase">FEVG</span>
                                                <span className="text-sm font-bold">{exam.ett_fevg ? `${exam.ett_fevg}%` : 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 px-4 bg-[#f6f8f8] dark:bg-[#10221f] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36]">
                                                <span className="text-[10px] font-black text-[#4c9a8d] uppercase">DTDVG</span>
                                                <span className="text-sm font-bold">{exam.ett_lvedd ? `${exam.ett_lvedd} mm` : 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-2">Conclusion ETT</p>
                                            <p className="text-sm font-medium leading-relaxed italic">"{exam.ett_interpretation}"</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Analysis Note */}
                        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <span className="material-symbols-outlined text-8xl text-primary">verified_user</span>
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary">priority_high</span>
                                <h3 className="font-bold text-sm uppercase tracking-widest">Note Automatique</h3>
                            </div>
                            <p className="text-sm italic leading-relaxed text-[#0d1b19] dark:text-white">
                                "Rapport généré automatiquement le {new Date(exam.date).toLocaleDateString()}. Veuillez vérifier les conclusions cliniques."
                            </p>
                        </div>
                    </div>

                    {/* File Preview Placeholder */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
                        <div className="bg-white dark:bg-[#152a26] rounded-3xl border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden shadow-lg h-full flex flex-col">
                            <div className="p-6 bg-gray-50/50 dark:bg-white/5 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex justify-between items-center">
                                <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">attach_file</span> Fichier Joint
                                </h3>
                                <span className="text-[10px] font-bold text-[#4c9a8d] bg-[#f6f8f8] dark:bg-[#10221f] px-2 py-1 rounded-lg">Rapport numérique</span>
                            </div>
                            <div className="flex-1 bg-black/5 dark:bg-black/20 flex flex-col items-center justify-center p-12 text-center">
                                <div className="size-24 rounded-full bg-white dark:bg-[#152a26] shadow-xl flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-5xl text-[#4c9a8d]">
                                        picture_as_pdf
                                    </span>
                                </div>
                                <h4 className="text-lg font-bold mb-2">Prévisualisation non disponible</h4>
                                <p className="text-xs text-[#4c9a8d] max-w-[200px] mb-8 font-medium">Le fichier est stocké de manière sécurisée.</p>
                                <Button variant="outline" icon="open_in_new" className="h-10 px-6 text-[10px] font-black uppercase tracking-widest">Ouvrir le fichier</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
