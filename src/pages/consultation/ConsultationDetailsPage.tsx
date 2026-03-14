import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { consultationService } from '../../services/api';
import moment from 'moment';

export const ConsultationDetailsPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: consultationId } = useParams<{ id: string }>();
    const [consultation, setConsultation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (consultationId) {
            consultationService.getConsultationById(parseInt(consultationId))
                .then((data) => {
                    setConsultation(data);
                })
                .catch(err => console.error('Failed to load consultation details:', err))
                .finally(() => setIsLoading(false));
        }
    }, [consultationId]);

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[#f6f8f8] dark:bg-[#10221f]">
                <div className="text-primary font-black animate-pulse uppercase tracking-[0.2em] text-xs">Chargement du rapport...</div>
            </div>
        );
    }

    if (!consultation) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center bg-[#f6f8f8] dark:bg-[#10221f] gap-4">
                <div className="text-[#4c9a8d] font-black uppercase tracking-widest text-sm">Rapport non trouvé.</div>
                <Button onClick={() => navigate(-1)}>Retour</Button>
            </div>
        );
    }

    const secondaryDiagnoses = consultation.diagnostic_result?.secondary_diagnoses
        ? (typeof consultation.diagnostic_result.secondary_diagnoses === 'string' 
            ? JSON.parse(consultation.diagnostic_result.secondary_diagnoses) 
            : consultation.diagnostic_result.secondary_diagnoses)
        : [];

    return (
        <div className="flex flex-col flex-1 bg-white font-sans text-slate-900 min-h-full print:bg-white print:h-auto overflow-y-auto no-scrollbar">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-100 bg-white px-8 py-4 sticky top-0 z-50 print:hidden text-left">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-[#22c55e] hover:bg-green-50 p-2 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-[#22c55e] rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xl">cardiology</span>
                        </div>
                        <h2 className="text-slate-900 text-lg font-bold tracking-tight">CARDIOMED</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-900">Dr. Jean Dupont</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Cardiologue</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-100 border-2 border-white shadow-sm flex items-center justify-center text-[#22c55e] font-bold">JD</div>
                </div>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full p-8 flex gap-10 print:p-0 print:max-w-none print:block">
                <div className="flex-1 flex flex-col gap-8 pb-12 print:pb-0">
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col print:shadow-none print:border-none">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white print:bg-white print:border-b-2 print:border-black">
                            <div className="text-left">
                                <h3 className="text-2xl font-black text-slate-900">Rapport de Consultation</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
                                    Patient: <span className="text-slate-900 font-bold">{consultation.patient?.full_name || 'N/A'}</span> • {moment(consultation.created_at).format('DD/MM/YYYY [à] HH:mm')}
                                </p>
                            </div>
                            <Button icon="print" variant="outline" size="sm" onClick={() => window.print()} className="print:hidden border-slate-200 text-slate-600 hover:text-[#22c55e] hover:border-[#22c55e]">Imprimer</Button>
                        </div>

                        <div className="p-10 space-y-12 print:p-0 print:space-y-6 print:mt-4">
                            {/* Section 1: Examen Clinique */}
                            <section className="print:break-inside-avoid">
                                <div className="flex items-center gap-2 mb-6 print:mb-2">
                                    <span className="material-symbols-outlined text-[#22c55e] print:text-black">clinical_notes</span>
                                    <h4 className="font-bold text-xs uppercase tracking-[0.15em] text-slate-400 print:text-black">Examen Clinique</h4>
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-slate-50/50 rounded-2xl border border-slate-100 print:bg-transparent print:border print:border-black print:grid-cols-4 print:gap-4 print:p-4 text-left">
                                        <div className="space-y-1 text-left">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 print:text-black">Tension Artérielle</p>
                                            <p className="text-lg font-black text-slate-900 print:text-black">{consultation.clinical_exam?.bp_sys}/{consultation.clinical_exam?.bp_dia} <span className="text-xs font-normal text-slate-400">mmHg</span></p>
                                        </div>
                                        <div className="space-y-1 text-left">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 print:text-black">Fréquence Cardiaque</p>
                                            <p className="text-lg font-black text-slate-900 print:text-black">{consultation.clinical_exam?.heart_rate} <span className="text-xs font-normal text-slate-400">bpm</span></p>
                                        </div>
                                        <div className="space-y-1 text-left">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 print:text-black">Poids / Taille</p>
                                            <p className="text-lg font-black text-slate-900 print:text-black">{consultation.clinical_exam?.weight}kg / {consultation.clinical_exam?.height}cm</p>
                                        </div>
                                        <div className="space-y-1 text-left">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 print:text-black">SpO₂ / Temp</p>
                                            <p className="text-lg font-black text-[#22c55e] print:text-black">{consultation.clinical_exam?.spo2 || '--'}% / {consultation.clinical_exam?.temp || '--'}°C</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Signes Cardiaques</h5>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Bruits du Cœur</p>
                                                    <p className="text-sm font-bold text-slate-800">{consultation.clinical_exam?.heart_sounds || 'Normal'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">JVP</p>
                                                    <p className="text-sm font-bold text-slate-800">{consultation.clinical_exam?.jvp || 'Normal'}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Auscultation Details</p>
                                                    <p className="text-sm text-slate-600 line-clamp-2">{consultation.clinical_exam?.auscultation || '--'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Examen Pulmonaire & HF</h5>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Oedèmes (MI)</p>
                                                    <p className="text-sm font-bold text-slate-800">{consultation.clinical_exam?.edema || 'Absence'}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Auscultation Pulmonaire</p>
                                                    <p className="text-sm text-slate-600 line-clamp-2">{consultation.clinical_exam?.pulmonary_auscultation || '--'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: ECG & ETT */}
                            <section className="print:break-inside-avoid">
                                <div className="flex items-center gap-2 mb-6 print:mb-2 text-left">
                                    <span className="material-symbols-outlined text-[#22c55e] print:text-black">monitor_heart</span>
                                    <h4 className="font-bold text-xs uppercase tracking-[0.15em] text-slate-400 print:text-black">Examens Paracliniques</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 text-left">
                                    {/* ECG Details */}
                                    <div className="p-8 bg-slate-50/50 rounded-2xl border border-slate-100 print:bg-transparent print:border print:border-black print:p-4 text-left space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h5 className="text-xs font-black uppercase tracking-widest text-slate-900 print:text-black">Électrocardiogramme</h5>
                                            <span className="px-3 py-1 bg-white rounded-lg text-[10px] font-black uppercase text-[#22c55e] border border-slate-100">{consultation.ecg_ett_exam?.ecg_rhythm || 'Sinusal'}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Axe</p>
                                                <p className="text-xs font-black text-slate-800">{consultation.ecg_ett_exam?.ecg_axis || 'Normal'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">PR (ms)</p>
                                                <p className="text-xs font-black text-slate-800">{consultation.ecg_ett_exam?.ecg_pr_interval || '--'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">QTc (ms)</p>
                                                <p className="text-xs font-black text-slate-800">{consultation.ecg_ett_exam?.ecg_qtc || '--'}</p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200 border-dashed">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Interprétation ECG</p>
                                            <p className="text-sm text-slate-600 italic leading-relaxed print:text-black">"{consultation.ecg_ett_exam?.ecg_interpretation || 'Aucune interprétation saisie.'}"</p>
                                        </div>
                                    </div>

                                    {/* ETT Details */}
                                    <div className="p-8 bg-slate-50/50 rounded-2xl border border-slate-100 print:bg-transparent print:border print:border-black print:p-4 text-left space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h5 className="text-xs font-black uppercase tracking-widest text-slate-900 print:text-black">Échocardiographie (ETT)</h5>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400">FEVG:</span>
                                                <span className="text-lg font-black text-[#22c55e]">{consultation.ecg_ett_exam?.ett_fevg || '--'}%</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">DTDvG</p>
                                                <p className="text-xs font-black text-slate-800">{consultation.ecg_ett_exam?.ett_lvedd || '--'} mm</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">DTSvG</p>
                                                <p className="text-xs font-black text-slate-800">{consultation.ecg_ett_exam?.ett_lvesd || '--'} mm</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Aortique</p>
                                                <p className="text-xs font-black text-slate-800">{consultation.ecg_ett_exam?.ett_aortic_valve || 'Normal'}</p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200 border-dashed">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Interprétation ETT</p>
                                            <p className="text-sm text-slate-600 italic leading-relaxed print:text-black">"{consultation.ecg_ett_exam?.ett_interpretation || 'Aucune interprétation saisie.'}"</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: Diagnostic & Traitement */}
                            <section className="print:break-inside-avoid">
                                <div className="flex items-center gap-2 mb-6 print:mb-2 text-left">
                                    <span className="material-symbols-outlined text-[#22c55e] print:text-black">medical_services</span>
                                    <h4 className="font-bold text-xs uppercase tracking-[0.15em] text-slate-400 print:text-black">Conclusion Clinique</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:grid-cols-2 print:gap-4 print:mb-4 text-left">
                                    <div className="p-8 bg-green-50/50 rounded-2xl border border-green-100 print:bg-transparent print:border print:border-black print:p-4 text-left space-y-4">
                                        <div className="flex items-center gap-2 mb-2 text-left">
                                            <span className="material-symbols-outlined text-[#22c55e] print:text-black">diagnosis</span>
                                            <h5 className="text-xs font-black uppercase tracking-widest text-slate-900 print:text-black">Diagnostic Retenu</h5>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900 print:text-black leading-tight">{consultation.diagnostic_result?.primary_diagnosis || 'Non spécifié'}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {secondaryDiagnoses.map((d: string, i: number) => (
                                                    <span key={i} className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">{d}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-4 pt-2">
                                            <p className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest">NYHA: <span className="font-black">{consultation.diagnostic_result?.nyha_class || 'N/A'}</span></p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">STATUT: <span className="font-black text-slate-900">{consultation.diagnostic_result?.cardiac_status || 'Stable'}</span></p>
                                        </div>
                                    </div>
                                    <div className="p-8 bg-slate-50/50 rounded-2xl border border-slate-100 print:bg-transparent print:border print:border-black print:p-4 text-left">
                                        <div className="flex items-center gap-2 mb-4 text-left">
                                            <span className="material-symbols-outlined text-slate-400 print:text-black">analytics</span>
                                            <h5 className="text-xs font-black uppercase tracking-widest text-slate-900 print:text-black">Scores & Risques</h5>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">CHADS₂-VASc</span>
                                                <p className="font-black text-slate-900 text-lg print:text-black">{consultation.score?.chads_vasc || 0}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">HAS-BLED</span>
                                                <p className="font-black text-red-500 text-lg print:text-black">{consultation.score?.has_bled || 0}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Score GRACE</span>
                                                <p className="font-black text-slate-900 text-lg print:text-black">{consultation.score?.grace_score || '--'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">CV Risk</span>
                                                <p className="font-black text-[#22c55e] text-xs uppercase">{consultation.score?.cv_risk || 'Low'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Prescription Table */}
                                <div className="mt-8 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm print:shadow-none print:border print:border-black print:mt-4 text-left">
                                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 print:bg-transparent print:border-black print:py-2 text-left">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 print:text-black">Détails de l'Ordonnance</h5>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-50 print:border-black">
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 print:text-black print:py-2">Médicament</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 print:text-black print:py-2">Posologie</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 print:text-black print:py-2 text-right">Fréquence/Durée</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 print:divide-black">
                                            {consultation.prescriptions?.flatMap((p: any) => p.items || []).length > 0 ? (
                                                consultation.prescriptions.flatMap((p: any) => p.items || []).map((p: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors print:hover:bg-transparent">
                                                        <td className="px-8 py-5 text-sm font-bold text-slate-900 print:text-black print:py-2">{p.drug}</td>
                                                        <td className="px-8 py-5 text-sm font-black text-[#22c55e] print:text-black print:py-2">{p.dosage}</td>
                                                        <td className="px-8 py-5 text-sm font-medium text-slate-500 print:text-black print:py-2 text-right">
                                                            {p.frequency} <span className="text-slate-300 mx-1">•</span> {p.duration || '--'}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-8 py-10 text-center text-xs text-slate-400 print:text-black print:py-4 italic">Aucune prescription enregistrée.</td>
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
                <aside className="w-80 flex-shrink-0 hidden xl:block print:hidden text-left">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col items-center text-center">
                            <div className="size-24 rounded-[2rem] bg-green-50 flex items-center justify-center text-[#22c55e] text-3xl font-black shadow-inner border-4 border-white mb-6">
                                {consultation.patient?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2">{consultation.patient?.full_name || 'Patient'}</h4>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
                                {consultation.patient?.age || '?'} ANS <span className="mx-2 text-slate-200">•</span> {consultation.patient?.gender === 'Male' ? 'HOMME' : 'FEMME'}
                            </p>
                            
                            <Button
                                className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-100 transition-all group"
                                icon="person"
                                onClick={() => navigate(`/patients/${consultation.patient_id}`)}
                            >
                                Dossier Patient
                            </Button>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};
