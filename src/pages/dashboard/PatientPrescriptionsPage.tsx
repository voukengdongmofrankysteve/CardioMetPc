import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { prescriptionService, patientService } from '../../services/api';
import moment from 'moment';

interface Prescription {
    id: number;
    drug: string;
    dosage: string;
    frequency: string;
    duration: string;
    created_at: string;
    consultation_id?: number;
    consultation?: any;
}

export const PatientPrescriptionsPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: patientId } = useParams<{ id: string }>();
    const location = useLocation();

    const [patientInfo, setPatientInfo] = useState<any>(location.state?.patient || null);

    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!patientId) return;
            const dbId = parseInt(patientId);

            try {
                if (!patientInfo) {
                    const patient = await patientService.getPatientById(dbId);
                    setPatientInfo(patient);
                }

                const rawData = await prescriptionService.getPrescriptions(dbId);

                console.log("rawDatarawDatarawDatarawDatarawData");
                console.log(rawData);

                const flattened: Prescription[] = [];
                if (Array.isArray(rawData)) {
                    rawData.forEach((header: any) => {
                        header.items?.forEach((item: any) => {
                            flattened.push({
                                ...item,
                                created_at: header.created_at,
                                consultation_id: header.consultation_id
                            });
                        });
                    });
                }
                setPrescriptions(flattened);
            } catch (error) {
                console.error('Failed to load patient prescriptions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [patientId, patientInfo]);

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-white text-left">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-sm active:scale-95"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Historique Ordonnances</h1>
                        <p className="text-emerald-600 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">
                            Patient: <span className="text-slate-500">{patientInfo?.full_name || '...'}</span> • <span className="text-slate-500">{patientInfo?.patient_id || patientId}</span>
                        </p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="size-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin mb-4"></div>
                    <p className="text-xs font-black text-emerald-800/40 uppercase tracking-widest">Récupération des dossiers...</p>
                </div>
            ) : prescriptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prescriptions.map((px) => (
                        <Card key={px.id} className="p-6 bg-white border-slate-100 hover:border-emerald-200 transition-all shadow-sm hover:shadow-md group relative overflow-hidden rounded-2xl">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Date d'Émission</p>
                                    <p className="text-sm font-black text-slate-900">
                                        {moment(px.created_at).format('DD MMMM YYYY')}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => px.consultation_id && navigate(`/consultations/${px.consultation_id}`)}
                                        className="size-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                                        title="Voir la consultation"
                                    >
                                        <span className="material-symbols-outlined text-lg">medical_services</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                                        <span className="material-symbols-outlined text-lg">pill</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Médicament</p>
                                        <p className="text-xs font-black text-slate-800 line-clamp-1">{px.drug}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dosage</p>
                                        <p className="text-xs font-black text-slate-800">{px.dosage}</p>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fréquence</p>
                                        <p className="text-xs font-black text-slate-800">{px.frequency || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                                    <span className="material-symbols-outlined text-emerald-600 text-base">schedule</span>
                                    <div>
                                        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest leading-none mb-1">Durée du Traitement</p>
                                        <p className="text-xs font-black text-emerald-900">{px.duration || 'À déterminer'}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto mt-10">
                    <div className="size-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 text-emerald-200 border border-slate-50">
                        <span className="material-symbols-outlined text-5xl">history_edu</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Aucune ordonnance</h3>
                    <p className="text-slate-500 text-sm font-bold mt-2">Ce patient n'a pas encore d'historique de prescriptions enregistrées.</p>
                </div>
            )}
        </div>
    );
};