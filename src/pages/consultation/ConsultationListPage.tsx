import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { consultationService } from '../../services/api';
import moment from 'moment';

export const ConsultationListPage: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [consultations, setConsultations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadConsultations = async () => {
            try {
                const data = await consultationService.getConsultations();
                setConsultations(data || []);
            } catch (error) {
                console.error('Failed to load consultations:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadConsultations();
    }, []);

    const stats = {
        completed: consultations.filter(c => c.status === 'Completed').length,
        inProgress: consultations.filter(c => c.status === 'In Progress').length
    };

    const filteredConsultations = consultations.filter(c => {
        const patientName = c.patient?.full_name || '';
        const patientCode = c.patient?.patient_id || '';
        const searchLower = search.toLowerCase();
        return patientName.toLowerCase().includes(searchLower) ||
               patientCode.toLowerCase().includes(searchLower);
    });

    const inputClasses = "w-full h-11 pl-12 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-[#22c55e] transition-all";
    const selectClasses = "w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-[#22c55e] transition-all appearance-none";

    return (
        <div className="flex flex-col flex-1 bg-white font-sans text-slate-900 p-8 overflow-y-auto no-scrollbar">
            <div className="max-w-[1400px] mx-auto w-full text-left space-y-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Consultations</h2>
                        <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-[10px]">Gérer et suivre toutes les consultations cardiologiques de la fondation.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* Stats Cards */}
                        <div className="flex gap-4">
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 min-w-[180px]">
                                <div className="size-10 rounded-xl bg-green-50 flex items-center justify-center text-[#22c55e]">
                                    <span className="material-symbols-outlined">check_circle</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Terminées</span>
                                    <span className="text-xl font-black text-slate-900">{stats.completed}</span>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 min-w-[180px]">
                                <div className="size-10 rounded-xl bg-green-50 flex items-center justify-center text-[#22c55e]">
                                    <span className="material-symbols-outlined">pending</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">En Cours</span>
                                    <span className="text-xl font-black text-slate-900">{stats.inProgress}</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            icon="add"
                            onClick={() => navigate('/consultations/new')}
                            className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-black uppercase tracking-widest px-8 h-14 rounded-2xl shadow-lg shadow-green-100 transition-all"
                        >
                            Nouvelle Consultation
                        </Button>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 px-6 shadow-sm flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="material-symbols-outlined text-xl">filter_list</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Filtres</span>
                    </div>

                    <div className="h-8 w-px bg-slate-200"></div>

                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
                            <input
                                type="text"
                                placeholder="Rechercher un patient ou un ID..."
                                className={inputClasses}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="relative w-48">
                            <select className={selectClasses}>
                                <option>Tous les statuts</option>
                                <option>Completed</option>
                                <option>In Progress</option>
                                <option>Scheduled</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setSearch('')}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                    >
                        Effacer les filtres
                    </button>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-48">Date & Heure</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-32">Type</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cardiologue</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-40">Statut</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-xs font-bold text-slate-400 animate-pulse">Chargement des consultations...</td>
                                </tr>
                            ) : filteredConsultations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-xs font-bold text-slate-400">Aucune consultation trouvée.</td>
                                </tr>
                            ) : filteredConsultations.map((consult) => (
                                <tr key={consult.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-800 leading-none mb-1">{moment(consult.created_at).format('DD/MM/YYYY')}</span>
                                            <span className="text-[10px] font-black text-slate-400 tracking-widest leading-none">{moment(consult.created_at).format('HH:mm')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-full bg-green-50 flex items-center justify-center text-[#22c55e] font-black text-xs border border-green-100">
                                                {consult.patient?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-800 leading-none mb-1">{consult.patient?.full_name || 'Patient Inconnu'}</span>
                                                <span className="text-[10px] font-black text-slate-400 tracking-widest leading-none uppercase">{consult.patient?.patient_id || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className={`
                                            px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest
                                            ${consult.type === 'INITIAL' ? 'bg-green-500/10 text-green-600' :
                                                consult.type === 'URGENT' ? 'bg-red-500/10 text-red-600' :
                                                    'bg-blue-500/10 text-blue-600'}
                                        `}>
                                            {consult.type || 'FOLLOW-UP'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="size-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                <span className="material-symbols-outlined text-sm">person</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">{consult.doctor?.name || 'Dr. Mbida'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className={`size-1.5 rounded-full ${consult.status === 'Completed' ? 'bg-[#22c55e]' :
                                                consult.status === 'In Progress' ? 'bg-green-400 animate-pulse shadow-[0_0_8px_#22c55e50]' :
                                                    consult.status === 'Scheduled' ? 'bg-slate-300' : 'bg-red-500'
                                                }`}></span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${consult.status === 'Completed' ? 'text-[#22c55e]' :
                                                consult.status === 'In Progress' ? 'text-[#22c55e] font-black' :
                                                    'text-slate-400'
                                                }`}>
                                                {consult.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => navigate(`/consultations/${consult.id}`)}
                                            className="text-[10px] font-black uppercase tracking-widest text-[#22c55e] hover:text-[#16a34a] transition-all underline underline-offset-4 decoration-[#22c55e]/30"
                                        >
                                            Voir le résumé
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer / Pagination */}
                    <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Affichage de 1 à {filteredConsultations.length} sur {consultations.length} consultations
                        </span>
                        <div className="flex items-center gap-2">
                            <button className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white hover:border-slate-200 border border-transparent transition-all">
                                <span className="material-symbols-outlined text-base">chevron_left</span>
                            </button>
                            <button className="size-8 rounded-lg flex items-center justify-center bg-[#22c55e] text-white font-black text-xs shadow-lg shadow-green-100">1</button>
                            <button className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white hover:border-slate-200 border border-transparent transition-all">
                                <span className="material-symbols-outlined text-base">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
