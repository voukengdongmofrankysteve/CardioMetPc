import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Button } from '../../components/ui/Button';
import { DatabaseService } from '../../services/database';

interface Patient {
    id: string; // patient_id from DB
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
        Low: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
        Medium: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
        High: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
    };
    const dotColors = {
        Low: 'bg-[var(--color-success)]',
        Medium: 'bg-[var(--color-warning)]',
        High: 'bg-[var(--color-danger)]',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[level]}`}>
            <span className={`size-1.5 rounded-full ${dotColors[level]} mr-2`}></span> {level}
        </span>
    );
};

interface PatientPageProps {
    onAddPatient: () => void;
    onStartConsultation: () => void;
    onViewDetails: (id: string) => void;
    onEditPatient: (id: string) => void;
    onArchivePatient: (id: string) => void;
    onViewPrescriptions?: (id: string, dbId: number, name: string) => void;
}

export const PatientPage: React.FC<PatientPageProps> = ({
    onAddPatient,
    onStartConsultation,
    onViewDetails,
    onEditPatient,
    onArchivePatient,
    onViewPrescriptions
}) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const fetchPatients = async () => {
        setIsLoading(true);
        try {
            const data = search
                ? await DatabaseService.searchPatients(search)
                : await DatabaseService.getPatients();

            const formatted: Patient[] = data.map(p => ({
                id: p.patient_id,
                db_id: p.id,
                name: p.full_name,
                email: p.email || 'N/A',
                gender: p.gender,
                age: p.age,
                phone: p.phone,
                lastVisit: p.created_at ? moment(p.created_at, 'YYYY-MM-DD HH:mm:ss.S Z').format('DD/MM/YYYY [à] HH:mm') : 'N/A',
                avatar: p.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
            }));
            console.log("formatted", formatted);
            console.log("data", data);
            setPatients(formatted);
        } catch (err) {
            console.error('Failed to fetch patients:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [search]);

    return (
        <div className="flex flex-col h-full text-left">
            {/* Page Heading */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-[var(--color-text-main)] dark:text-white text-4xl font-black leading-tight tracking-tight">Répertoire des Patients</h1>
                    <p className="text-[var(--color-text-muted)] text-base font-medium">Gérez {patients.length} dossiers de patients cardiovasculaires</p>
                </div>
                <Button icon="add" className="h-12 px-6 bg-[var(--color-primary)] text-white font-black uppercase tracking-wider" onClick={onAddPatient}>
                    Ajouter un Patient
                </Button>
            </div>

            {/* Search & Filters */}
            <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl p-4 shadow-sm border border-[var(--color-border)] dark:border-[var(--color-dark-border)] mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">search</span>
                        <input
                            className="w-full h-12 pl-10 pr-4 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] border-none rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]/20 text-[var(--color-text-main)] dark:text-white font-bold placeholder:text-[var(--color-text-muted)]/50 placeholder:font-medium"
                            placeholder="Rechercher par nom, ID patient, ou téléphone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 h-12 rounded-xl bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-[var(--color-text-main)] dark:text-white text-sm font-bold hover:bg-[var(--color-bg-main)] dark:hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined text-lg">filter_list</span>
                        Filtres
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] dark:border-[var(--color-dark-border)] overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-auto relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="size-12 rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] animate-spin"></div>
                            <p className="text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest">Chargement des données...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse relative">
                            <thead className="sticky top-0 z-10 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] shadow-sm">
                                <tr className="border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                    <th className="px-6 py-4 text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest">Nom du Patient</th>
                                    <th className="px-6 py-4 text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest">Genre</th>
                                    <th className="px-6 py-4 text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest">ID Patient</th>
                                    <th className="px-6 py-4 text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest">Dernière Visite</th>
                                    <th className="px-6 py-4 text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest text-center">Statut</th>
                                    <th className="px-6 py-4 text-[var(--color-text-muted)] text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)] dark:divide-[var(--color-dark-border)]">
                                {patients.map((patient) => (
                                    <tr key={patient.db_id} className="hover:bg-[var(--color-bg-main)] dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 text-left">
                                            <div className="flex items-center gap-3">
                                                <div className={`size-10 rounded-xl flex items-center justify-center font-black text-xs border-2 shadow-sm ${patient.gender === 'Male'
                                                    ? 'bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/20'
                                                    : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20'
                                                    }`}>
                                                    {patient.avatar}
                                                </div>
                                                <div>
                                                    <div className="text-[var(--color-text-main)] dark:text-white font-bold text-base">{patient.name}</div>
                                                    <div className="text-[var(--color-text-muted)] text-xs font-semibold">{patient.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--color-text-main)] dark:text-[var(--color-text-muted)] text-sm font-bold">{patient.gender}</td>
                                        <td className="px-6 py-4 text-[var(--color-text-muted)] font-mono text-xs font-bold">{patient.id}</td>
                                        <td className="px-6 py-4 text-[var(--color-text-main)] dark:text-[var(--color-text-muted)] text-sm font-bold">{patient.lastVisit}</td>
                                        <td className="px-6 py-4 text-center">
                                            <RiskBadge level="Low" />
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={() => setActiveMenuId(activeMenuId === patient.id ? null : patient.id)}
                                                className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors hover:scale-110"
                                            >
                                                <span className="material-symbols-outlined font-black">more_horiz</span>
                                            </button>

                                            {activeMenuId === patient.id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-[100]"
                                                        onClick={() => setActiveMenuId(null)}
                                                    ></div>
                                                    <div className="absolute right-8 top-8 w-56 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-lg shadow-lg border border-[var(--color-border)] dark:border-[var(--color-dark-border)] py-1.5 z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left origin-top-right ring-1 ring-black/5">
                                                        <div className="px-3 py-2 text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                                                            Actions Rapides
                                                        </div>
                                                        <button
                                                            onClick={() => onStartConsultation()}
                                                            className="w-full px-4 py-2 flex items-center gap-3 text-sm font-medium text-[var(--color-text-main)] dark:text-white hover:bg-[var(--color-bg-main)] dark:hover:bg-white/5 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px] text-[var(--color-text-muted)]">add_circle</span>
                                                            Nouvelle Consultation
                                                        </button>
                                                        <button
                                                            onClick={() => onViewDetails(patient.db_id.toString())}
                                                            className="w-full px-4 py-2 flex items-center gap-3 text-sm font-medium text-[var(--color-text-main)] dark:text-white hover:bg-[var(--color-bg-main)] dark:hover:bg-white/5 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px] text-[var(--color-text-muted)]">visibility</span>
                                                            Voir le dossier
                                                        </button>
                                                        <button
                                                            onClick={() => onViewPrescriptions?.(patient.id, patient.db_id, patient.name)}
                                                            className="w-full px-4 py-2 flex items-center gap-3 text-sm font-medium text-[var(--color-text-main)] dark:text-white hover:bg-[var(--color-bg-main)] dark:hover:bg-white/5 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px] text-[var(--color-text-muted)]">medication</span>
                                                            Ordonnances
                                                        </button>
                                                        <button
                                                            onClick={() => onEditPatient(patient.db_id.toString())}
                                                            className="w-full px-4 py-2 flex items-center gap-3 text-sm font-medium text-[var(--color-text-main)] dark:text-white hover:bg-[var(--color-bg-main)] dark:hover:bg-white/5 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px] text-[var(--color-text-muted)]">edit</span>
                                                            Modifier
                                                        </button>
                                                        <div className="my-1.5 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]"></div>
                                                        <button
                                                            onClick={() => onArchivePatient(patient.id)}
                                                            className="w-full px-4 py-2 flex items-center gap-3 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">archive</span>
                                                            Archiver le patient
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 bg-[var(--color-bg-main)] dark:bg-white/5 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                    <p className="text-xs text-[var(--color-text-muted)] font-bold">Affichage de {patients.length} patients</p>
                    <div className="flex items-center gap-1.5">
                        <button className="flex size-9 items-center justify-center rounded-xl hover:bg-[var(--color-primary-light)]/20 hover:text-[var(--color-primary)] transition-colors text-[var(--color-text-muted)]">
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        <button className="text-xs font-black size-9 flex items-center justify-center text-white rounded-xl bg-[var(--color-primary)] shadow-sm">1</button>
                        <button className="flex size-9 items-center justify-center rounded-xl hover:bg-[var(--color-primary-light)]/20 hover:text-[var(--color-primary)] transition-colors text-[var(--color-text-muted)]">
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
