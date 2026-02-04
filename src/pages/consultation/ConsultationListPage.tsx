import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { DatabaseService } from '../../services/database';

interface ConsultationListPageProps {
    onNewConsultation: () => void;
    onViewDetails: (id: string) => void;
}

export const ConsultationListPage: React.FC<ConsultationListPageProps> = ({ onNewConsultation, onViewDetails }) => {
    const [search, setSearch] = useState('');
    const [consultations, setConsultations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadConsultations = async () => {
            try {
                const data = await DatabaseService.getConsultations();
                setConsultations(data);
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

    const filteredConsultations = consultations.filter(c =>
        c.patient_name.toLowerCase().includes(search.toLowerCase()) ||
        c.patient_code.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="flex flex-col flex-1 bg-[#f6f8f8] dark:bg-[#10221f] font-sans text-[#0d1b19] dark:text-white p-8 overflow-y-auto no-scrollbar">
            <div className="max-w-[1400px] mx-auto w-full text-left space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-[#0d1b19] dark:text-white tracking-tight">Consultations</h2>
                        <p className="text-[#4c9a8d] font-bold mt-2 uppercase tracking-widest text-[10px]">Gérer et suivre toutes les consultations cardiologiques de la fondation.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* Stats Cards */}
                        <div className="flex gap-4">
                            <div className="bg-white dark:bg-[#152a26] rounded-2xl p-4 border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm flex items-center gap-4 min-w-[180px]">
                                <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                    <span className="material-symbols-outlined">check_circle</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#4c9a8d]">Terminées</span>
                                    <span className="text-xl font-black">{stats.completed}</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#152a26] rounded-2xl p-4 border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm flex items-center gap-4 min-w-[180px]">
                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">pending</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#4c9a8d]">En Cours</span>
                                    <span className="text-xl font-black">{stats.inProgress}</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            icon="add"
                            onClick={onNewConsultation}
                            className="bg-primary hover:brightness-105 text-[#0d1b19] font-black uppercase tracking-widest px-8 h-14 rounded-2xl shadow-lg shadow-primary/20"
                        >
                            New Consultation
                        </Button>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="bg-white dark:bg-[#152a26] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] p-4 p-x-6 shadow-sm flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 text-[#4c9a8d]">
                        <span className="material-symbols-outlined text-xl">filter_list</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Filtres</span>
                    </div>

                    <div className="h-8 w-px bg-[#e7f3f1] dark:bg-[#1e3a36]"></div>

                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4c9a8d] text-base">search</span>
                            <input
                                type="text"
                                placeholder="Rechercher un patient ou un ID..."
                                className="w-full h-11 pl-12 bg-white dark:bg-[#10221f] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl text-xs font-bold text-[#0d1b19] dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="relative w-48">
                            <select className="w-full h-11 px-4 bg-white dark:bg-[#10221f] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl text-xs font-bold text-[#0d1b19] dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
                                <option>Tous les statuts</option>
                                <option>Completed</option>
                                <option>In Progress</option>
                                <option>Scheduled</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#4c9a8d] pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    <button className="text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] hover:text-red-500 transition-colors">
                        Effacer les filtres
                    </button>
                </div>

                {/* Table Section */}
                <div className="bg-white dark:bg-[#152a26] rounded-3xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f8fcfb] dark:bg-white/5">
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[#4c9a8d] w-48">Date & Heure</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[#4c9a8d]">Patient</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[#4c9a8d] w-32">Type</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[#4c9a8d]">Cardiologue</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[#4c9a8d] w-40">Statut</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-[#4c9a8d] w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f6f8f8] dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-xs font-bold text-[#4c9a8d] animate-pulse">Chargement des consultations...</td>
                                </tr>
                            ) : filteredConsultations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-xs font-bold text-[#4c9a8d]">Aucune consultation trouvée.</td>
                                </tr>
                            ) : filteredConsultations.map((consult) => (
                                <tr key={consult.id} className="group hover:bg-[#f8fcfb] dark:hover:bg-white/5 transition-all duration-300">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-[#0d1b19] dark:text-white leading-none mb-1">{formatDate(consult.created_at)}</span>
                                            <span className="text-[10px] font-black text-[#4c9a8d] tracking-widest leading-none">{formatTime(consult.created_at)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20">
                                                {consult.patient_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-[#0d1b19] dark:text-white leading-none mb-1">{consult.patient_name}</span>
                                                <span className="text-[10px] font-black text-[#4c9a8d] tracking-widest leading-none uppercase">{consult.patient_code}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className={`
                                            px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest
                                            ${consult.type === 'INITIAL' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' :
                                                consult.type === 'URGENT' ? 'bg-red-50 text-red-600 dark:bg-red-500/10' :
                                                    'bg-blue-50 text-blue-600 dark:bg-blue-500/10'}
                                        `}>
                                            {consult.type || 'FOLLOW-UP'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="size-7 rounded-full bg-[#f6f8f8] dark:bg-white/5 flex items-center justify-center text-[#4c9a8d]">
                                                <span className="material-symbols-outlined text-sm">person</span>
                                            </div>
                                            <span className="text-xs font-bold text-[#0d1b19]/80 dark:text-white/80">{consult.doctor_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className={`size-1.5 rounded-full ${consult.status === 'Completed' ? 'bg-green-500' :
                                                consult.status === 'In Progress' ? 'bg-primary shadow-[0_0_8px_rgba(66,240,211,0.5)] animate-pulse' :
                                                    consult.status === 'Scheduled' ? 'bg-gray-400' : 'bg-red-500'
                                                }`}></span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${consult.status === 'Completed' ? 'text-green-500' :
                                                consult.status === 'In Progress' ? 'text-primary font-black' :
                                                    'text-[#4c9a8d]'
                                                }`}>
                                                {consult.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {consult.status === 'Completed' ? (
                                            <button
                                                onClick={() => onViewDetails(consult.id)}
                                                className="text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] hover:text-primary transition-all underline underline-offset-4 decoration-primary/30"
                                            >
                                                View Summary
                                            </button>
                                        ) : consult.status === 'In Progress' ? (
                                            <button
                                                onClick={() => onViewDetails(consult.id)}
                                                className="px-4 py-1.5 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-[#0d1b19] transition-all"
                                            >
                                                Resume
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onViewDetails(consult.id)}
                                                className="text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] hover:text-primary transition-all"
                                            >
                                                Details
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer / Pagination */}
                    <div className="p-6 bg-[#f8fcfb] dark:bg-white/5 border-t border-[#e7f3f1] dark:border-[#1e3a36] flex justify-between items-center">
                        <span className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">
                            Affichage de 1 à {filteredConsultations.length} sur {consultations.length} consultations
                        </span>
                        <div className="flex items-center gap-2">
                            <button className="size-8 rounded-lg flex items-center justify-center text-[#4c9a8d] hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <span className="material-symbols-outlined text-base">chevron_left</span>
                            </button>
                            <button className="size-8 rounded-lg flex items-center justify-center bg-primary text-[#0d1b19] font-black text-xs shadow-sm shadow-primary/20">1</button>
                            <button className="size-8 rounded-lg flex items-center justify-center text-[#4c9a8d] hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <span className="material-symbols-outlined text-base">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
