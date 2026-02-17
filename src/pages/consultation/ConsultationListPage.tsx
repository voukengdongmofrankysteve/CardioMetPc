import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { DatabaseService } from '../../services/database';
import moment from 'moment';

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



    return (
        <div className="flex flex-col flex-1 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] font-sans text-[var(--color-text-main)] dark:text-white p-8 overflow-y-auto no-scrollbar">
            <div className="max-w-[1400px] mx-auto w-full text-left space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-[var(--color-text-main)] dark:text-white tracking-tight">Consultations</h2>
                        <p className="text-[var(--color-text-muted)] font-bold mt-2 uppercase tracking-widest text-[10px]">Gérer et suivre toutes les consultations cardiologiques de la fondation.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* Stats Cards */}
                        <div className="flex gap-4">
                            <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl p-4 border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-sm flex items-center gap-4 min-w-[180px]">
                                <div className="size-10 rounded-xl bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)]">
                                    <span className="material-symbols-outlined">check_circle</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Terminées</span>
                                    <span className="text-xl font-black">{stats.completed}</span>
                                </div>
                            </div>
                            <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl p-4 border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-sm flex items-center gap-4 min-w-[180px]">
                                <div className="size-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                    <span className="material-symbols-outlined">pending</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">En Cours</span>
                                    <span className="text-xl font-black">{stats.inProgress}</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            icon="add"
                            onClick={onNewConsultation}
                            className="bg-[var(--color-primary)] hover:brightness-105 text-[var(--color-text-main)] font-black uppercase tracking-widest px-8 h-14 rounded-2xl shadow-lg shadow-[var(--color-primary)]/20"
                        >
                            New Consultation
                        </Button>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] p-4 p-x-6 shadow-sm flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                        <span className="material-symbols-outlined text-xl">filter_list</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Filtres</span>
                    </div>

                    <div className="h-8 w-px bg-[var(--color-border)] dark:bg-[var(--color-dark-border)]"></div>

                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-base">search</span>
                            <input
                                type="text"
                                placeholder="Rechercher un patient ou un ID..."
                                className="w-full h-11 pl-12 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-xl text-xs font-bold text-[var(--color-text-main)] dark:text-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="relative w-48">
                            <select className="w-full h-11 px-4 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-xl text-xs font-bold text-[var(--color-text-main)] dark:text-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all appearance-none">
                                <option>Tous les statuts</option>
                                <option>Completed</option>
                                <option>In Progress</option>
                                <option>Scheduled</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    <button className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors">
                        Effacer les filtres
                    </button>
                </div>

                {/* Table Section */}
                <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-3xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-sm overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)]/50 dark:bg-white/5">
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] w-48">Date & Heure</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Patient</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] w-32">Type</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Cardiologue</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] w-40">Statut</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)] dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-xs font-bold text-[var(--color-text-muted)] animate-pulse">Chargement des consultations...</td>
                                </tr>
                            ) : filteredConsultations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-xs font-bold text-[var(--color-text-muted)]">Aucune consultation trouvée.</td>
                                </tr>
                            ) : filteredConsultations.map((consult) => (
                                <tr key={consult.id} className="group hover:bg-[var(--color-bg-main)]/50 dark:hover:bg-white/5 transition-all duration-300">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-[var(--color-text-main)] dark:text-white leading-none mb-1">{consult.created_at ? moment(consult.created_at, 'YYYY-MM-DD HH:mm:ss.S Z').format('DD/MM/YYYY') : 'N/A'}</span>
                                            <span className="text-[10px] font-black text-[var(--color-text-muted)] tracking-widest leading-none">{consult.created_at ? moment(consult.created_at, 'YYYY-MM-DD HH:mm:ss.S Z').format('HH:mm') : 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-black text-xs border border-[var(--color-primary)]/20">
                                                {consult.patient_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-[var(--color-text-main)] dark:text-white leading-none mb-1">{consult.patient_name}</span>
                                                <span className="text-[10px] font-black text-[var(--color-text-muted)] tracking-widest leading-none uppercase">{consult.patient_code}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className={`
                                            px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest
                                            ${consult.type === 'INITIAL' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' :
                                                consult.type === 'URGENT' ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' :
                                                    'bg-blue-500/10 text-blue-600 dark:text-blue-400'}
                                        `}>
                                            {consult.type || 'FOLLOW-UP'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="size-7 rounded-full bg-[var(--color-bg-main)] dark:bg-white/5 flex items-center justify-center text-[var(--color-text-muted)]">
                                                <span className="material-symbols-outlined text-sm">person</span>
                                            </div>
                                            <span className="text-xs font-bold text-[var(--color-text-main)]/80 dark:text-white/80">{consult.doctor_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className={`size-1.5 rounded-full ${consult.status === 'Completed' ? 'bg-[var(--color-success)]' :
                                                consult.status === 'In Progress' ? 'bg-[var(--color-primary)] shadow-[0_0_8px_rgba(66,240,211,0.5)] animate-pulse' :
                                                    consult.status === 'Scheduled' ? 'bg-[var(--color-text-muted)]' : 'bg-[var(--color-danger)]'
                                                }`}></span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${consult.status === 'Completed' ? 'text-[var(--color-success)]' :
                                                consult.status === 'In Progress' ? 'text-[var(--color-primary)] font-black' :
                                                    'text-[var(--color-text-muted)]'
                                                }`}>
                                                {consult.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {consult.status === 'Completed' ? (
                                            <button
                                                onClick={() => onViewDetails(consult.id)}
                                                className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all underline underline-offset-4 decoration-[var(--color-primary)]/30"
                                            >
                                                View Summary
                                            </button>
                                        ) : consult.status === 'In Progress' ? (
                                            <button
                                                onClick={() => onViewDetails(consult.id)}
                                                className="px-4 py-1.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[var(--color-primary)] hover:text-[var(--color-bg-main)] transition-all"
                                            >
                                                Resume
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onViewDetails(consult.id)}
                                                className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all"
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
                    <div className="p-6 bg-[var(--color-bg-main)]/50 dark:bg-white/5 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex justify-between items-center">
                        <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
                            Affichage de 1 à {filteredConsultations.length} sur {consultations.length} consultations
                        </span>
                        <div className="flex items-center gap-2">
                            <button className="size-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-bg-main)] dark:hover:bg-white/5 transition-all">
                                <span className="material-symbols-outlined text-base">chevron_left</span>
                            </button>
                            <button className="size-8 rounded-lg flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-text-main)] font-black text-xs shadow-sm shadow-[var(--color-primary)]/20">1</button>
                            <button className="size-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-bg-main)] dark:hover:bg-white/5 transition-all">
                                <span className="material-symbols-outlined text-base">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
