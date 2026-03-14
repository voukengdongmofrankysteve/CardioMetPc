import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { Button } from '../../components/ui/Button';
import { patientService } from '../../services/api';

interface Patient {
    id: string; // patient_id from DB (e.g. #FCE-1234)
    db_id: number; // primary key from DB
    name: string;
    email: string;
    gender: 'Male' | 'Female' | 'Other';
    age: number;
    phone: string;
    lastVisit: string;
    avatar: string;
}

const RiskBadge: React.FC<{ level: 'Low' | 'Medium' | 'High' }> = ({ level }) => {
    const styles = {
        Low: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        Medium: 'bg-orange-50 text-orange-600 border-orange-100',
        High: 'bg-rose-50 text-rose-600 border-rose-100',
    };
    const dotColors = {
        Low: 'bg-emerald-500',
        Medium: 'bg-orange-500',
        High: 'bg-rose-500',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[level]}`}>
            <span className={`size-1.5 rounded-full ${dotColors[level]} mr-2`}></span> {level === 'Low' ? 'Géré' : level === 'Medium' ? 'À Suivre' : 'Critique'}
        </span>
    );
};

export const PatientPage: React.FC = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

    const fetchPatients = async () => {
        setIsLoading(true);
        try {
            const data = search
                ? await patientService.searchPatients(search)
                : await patientService.getPatients();

            const formatted: Patient[] = data.map((p: any) => ({
                id: p.patient_id,
                db_id: p.id,
                name: p.full_name,
                email: p.email || 'N/A',
                gender: p.gender,
                age: p.age,
                phone: p.phone,
                lastVisit: p.created_at ? moment(p.created_at).format('DD/MM/YYYY [à] HH:mm') : 'N/A',
                avatar: p.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
            }));
            setPatients(formatted);
        } catch (err) {
            console.error('Failed to fetch patients:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPatients();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="flex flex-col h-full text-left p-8 bg-white">
            {/* Page Heading */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-tight uppercase">Répertoire Patients</h1>
                    <p className="text-emerald-600 text-sm font-bold uppercase tracking-widest leading-none">Gestion de {patients.length} dossiers actifs</p>
                </div>
                <Button 
                    icon="person_add" 
                    className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider shadow-lg shadow-emerald-900/10 transition-all active:scale-95" 
                    onClick={() => navigate('/patients/new')}
                >
                    Nouveau Patient
                </Button>
            </div>

            {/* Search & Filters */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 group-focus-within:text-emerald-700 transition-colors">search</span>
                        <input
                            className="w-full h-12 pl-12 pr-4 bg-white border-2 border-transparent rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-slate-900 font-bold placeholder:text-slate-400 transition-all outline-none"
                            placeholder="Rechercher un dossier par nom, ID ou téléphone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-auto relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="size-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin"></div>
                            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Calcul des dossiers...</p>
                        </div>
                    ) : patients.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr className="border-b border-slate-100">
                                    <th className="px-6 py-4 text-emerald-800/60 text-[10px] font-black uppercase tracking-widest">Identité Patient</th>
                                    <th className="px-6 py-4 text-emerald-800/60 text-[10px] font-black uppercase tracking-widest">Détails</th>
                                    <th className="px-6 py-4 text-emerald-800/60 text-[10px] font-black uppercase tracking-widest">ID Dossier</th>
                                    <th className="px-6 py-4 text-emerald-800/60 text-[10px] font-black uppercase tracking-widest">Dernière Consultation</th>
                                    <th className="px-6 py-4 text-emerald-800/60 text-[10px] font-black uppercase tracking-widest text-center">Score Risque</th>
                                    <th className="px-6 py-4 text-emerald-800/60 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {patients.map((patient) => (
                                    <tr key={patient.db_id} className="hover:bg-emerald-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`size-11 rounded-2xl flex items-center justify-center font-black text-xs border-2 shadow-sm ${patient.gender === 'Male'
                                                    ? 'bg-blue-50 text-blue-500 border-blue-100'
                                                    : 'bg-pink-50 text-pink-500 border-pink-100'
                                                    }`}>
                                                    {patient.avatar}
                                                </div>
                                                <div>
                                                    <div className="text-slate-900 font-black text-base tracking-tight">{patient.name}</div>
                                                    <div className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">{patient.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-700 text-xs font-bold">{patient.age} ans • {patient.gender === 'Male' ? 'H' : 'F'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 text-slate-500 font-mono text-[10px] font-black">{patient.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-400 text-xs font-medium italic">{patient.lastVisit}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <RiskBadge level="Low" />
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={() => setActiveMenuId(activeMenuId === patient.db_id ? null : patient.db_id)}
                                                className="size-9 rounded-xl text-slate-400 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center active:scale-95"
                                            >
                                                <span className="material-symbols-outlined font-black">more_horiz</span>
                                            </button>

                                            {activeMenuId === patient.db_id && (
                                                <>
                                                    <div className="fixed inset-0 z-[100]" onClick={() => setActiveMenuId(null)}></div>
                                                    <div className="absolute right-8 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2.5 z-[110] animate-in fade-in zoom-in-95 duration-150 text-left origin-top-right ring-1 ring-black/5">
                                                        <div className="px-4 py-2 border-b border-slate-50 mb-2">
                                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">{patient.name}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => { setActiveMenuId(null); navigate(`/patients/${patient.db_id}`); }}
                                                            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">folder_shared</span>
                                                            Dossier Complet
                                                        </button>
                                                        <button
                                                            onClick={() => { setActiveMenuId(null); navigate('/consultations/new', { state: { patient } }); }}
                                                            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">add_notes</span>
                                                            Nouvelle Consultation
                                                        </button>
                                                        <button
                                                            onClick={() => { setActiveMenuId(null); navigate(`/patients/${patient.db_id}/prescriptions`); }}
                                                            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">pill</span>
                                                            Ordonnances
                                                        </button>

                                                        <div className="my-2 border-t border-slate-50"></div>
                                                        <button
                                                            onClick={() => { setActiveMenuId(null); navigate(`/patients/edit/${patient.db_id}`); }}
                                                            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">edit</span>
                                                            Modifier le Dossier
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
                            <span className="material-symbols-outlined text-7xl mb-4 text-emerald-200">search_off</span>
                            <p className="text-sm font-black uppercase tracking-widest text-emerald-800">Aucun patient trouvé</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-8 py-4 bg-slate-50 border-t border-slate-100">
                    <p className="text-[10px] text-emerald-800/50 font-black uppercase tracking-widest">Affichage de {patients.length} patients</p>
                    <div className="flex items-center gap-2">
                        <button className="flex size-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-600 transition-all">
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        <button className="text-[10px] font-black size-9 flex items-center justify-center text-white rounded-xl bg-emerald-600 shadow-md shadow-emerald-900/20">1</button>
                        <button className="flex size-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-600 transition-all">
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};