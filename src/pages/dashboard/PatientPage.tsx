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
        Low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        Medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    const dotColors = {
        Low: 'bg-green-500',
        Medium: 'bg-orange-500',
        High: 'bg-red-500',
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
                lastVisit: p.created_at ? moment(p.created_at).format('DD/MM/YYYY') : 'N/A',
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
        <div className="flex-1 overflow-y-auto p-8 bg-[#f6f8f8] dark:bg-[#10221f] text-left">
            {/* Page Heading */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-[#0d1b19] dark:text-white text-4xl font-black leading-tight tracking-tight">Répertoire des Patients</h1>
                    <p className="text-[#4c9a8d] text-base font-medium">Gérez {patients.length} dossiers de patients cardiovasculaires</p>
                </div>
                <Button icon="add" className="h-12 px-6 bg-primary text-[#0d1b19] font-black uppercase tracking-wider" onClick={onAddPatient}>
                    Ajouter un Patient
                </Button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white dark:bg-[#152a26] rounded-2xl p-4 shadow-sm border border-[#e7f3f1] dark:border-[#1e3a36] mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c9a8d]">search</span>
                        <input
                            className="w-full h-12 pl-10 pr-4 bg-[#f6f8f8] dark:bg-[#10221f] border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-[#0d1b19] dark:text-white font-bold placeholder:text-[#4c9a8d]/50 placeholder:font-medium"
                            placeholder="Rechercher par nom, ID patient, ou téléphone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 h-12 rounded-xl bg-white dark:bg-[#152a26] border border-[#e7f3f1] dark:border-[#1e3a36] text-[#0d1b19] dark:text-white text-sm font-bold hover:bg-[#f6f8f8] dark:hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined text-lg">filter_list</span>
                        Filtres
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-[#152a26] rounded-2xl shadow-sm border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                            <p className="text-xs font-black text-[#4c9a8d] uppercase tracking-widest">Chargement des données...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#f6f8f8] dark:bg-white/5 border-b border-[#e7f3f1] dark:border-[#1e3a36]">
                                    <th className="px-6 py-4 text-[#4c9a8d] text-[10px] font-black uppercase tracking-widest">Nom du Patient</th>
                                    <th className="px-6 py-4 text-[#4c9a8d] text-[10px] font-black uppercase tracking-widest">Genre</th>
                                    <th className="px-6 py-4 text-[#4c9a8d] text-[10px] font-black uppercase tracking-widest">ID Patient</th>
                                    <th className="px-6 py-4 text-[#4c9a8d] text-[10px] font-black uppercase tracking-widest">Dernière Visite</th>
                                    <th className="px-6 py-4 text-[#4c9a8d] text-[10px] font-black uppercase tracking-widest text-center">Statut</th>
                                    <th className="px-6 py-4 text-[#4c9a8d] text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e7f3f1] dark:divide-[#1e3a36]">
                                {patients.map((patient) => (
                                    <tr key={patient.db_id} className="hover:bg-[#f6f8f8] dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 text-left">
                                            <div className="flex items-center gap-3">
                                                <div className={`size-10 rounded-xl flex items-center justify-center font-black text-xs border-2 shadow-sm ${patient.gender === 'Male' ? 'bg-blue-50 text-blue-500 border-blue-100/50' : 'bg-pink-50 text-pink-500 border-pink-100/50'
                                                    }`}>
                                                    {patient.avatar}
                                                </div>
                                                <div>
                                                    <div className="text-[#0d1b19] dark:text-white font-bold text-base">{patient.name}</div>
                                                    <div className="text-[#4c9a8d] text-xs font-semibold">{patient.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[#0d1b19] dark:text-[#4c9a8d] text-sm font-bold">{patient.gender}</td>
                                        <td className="px-6 py-4 text-[#4c9a8d] font-mono text-xs font-bold">{patient.id}</td>
                                        <td className="px-6 py-4 text-[#0d1b19] dark:text-[#4c9a8d] text-sm font-bold">{patient.lastVisit}</td>
                                        <td className="px-6 py-4 text-center">
                                            <RiskBadge level="Low" />
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={() => setActiveMenuId(activeMenuId === patient.id ? null : patient.id)}
                                                className="text-[#4c9a8d] hover:text-primary transition-colors hover:scale-110"
                                            >
                                                <span className="material-symbols-outlined font-black">more_horiz</span>
                                            </button>

                                            {activeMenuId === patient.id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-[100]"
                                                        onClick={() => setActiveMenuId(null)}
                                                    ></div>
                                                    <div className="absolute right-6 top-12 w-64 bg-white dark:bg-[#152a26] rounded-2xl shadow-2xl border border-[#e7f3f1] dark:border-[#1e3a36] py-3 z-[110] overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
                                                        <button
                                                            onClick={() => onStartConsultation()}
                                                            className="w-full px-5 py-3 flex items-center gap-4 text-sm font-black text-[#0d1b19] dark:text-white uppercase tracking-tight hover:bg-[#42f0d3]/10 hover:text-primary transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">add_circle</span>
                                                            Nouvelle Consultation
                                                        </button>
                                                        <button
                                                            onClick={() => onViewDetails(patient.db_id.toString())}
                                                            className="w-full px-5 py-3 flex items-center gap-4 text-sm font-black text-[#0d1b19] dark:text-white uppercase tracking-tight hover:bg-[#42f0d3]/10 hover:text-primary transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                                            Voir le dossier
                                                        </button>
                                                        <button
                                                            onClick={() => onViewPrescriptions?.(patient.id, patient.db_id, patient.name)}
                                                            className="w-full px-5 py-3 flex items-center gap-4 text-sm font-black text-[#0d1b19] dark:text-white uppercase tracking-tight hover:bg-[#42f0d3]/10 hover:text-primary transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">prescriptions</span>
                                                            Ordonnances
                                                        </button>
                                                        <button
                                                            onClick={() => onEditPatient(patient.id)}
                                                            className="w-full px-5 py-3 flex items-center gap-4 text-sm font-black text-[#0d1b19] dark:text-white uppercase tracking-tight hover:bg-[#42f0d3]/10 hover:text-primary transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">edit</span>
                                                            Modifier
                                                        </button>
                                                        <div className="mx-3 my-2 border-t border-[#e7f3f1] dark:border-[#1e3a36]"></div>
                                                        <button
                                                            onClick={() => onArchivePatient(patient.id)}
                                                            className="w-full px-5 py-3 flex items-center gap-4 text-sm font-black text-red-500 uppercase tracking-tight hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">archive</span>
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
                <div className="flex items-center justify-between px-6 py-4 bg-[#f6f8f8] dark:bg-white/5 border-t border-[#e7f3f1] dark:border-[#1e3a36]">
                    <p className="text-xs text-[#4c9a8d] font-bold">Affichage de {patients.length} patients</p>
                    <div className="flex items-center gap-1.5">
                        <button className="flex size-9 items-center justify-center rounded-xl hover:bg-[#42f0d3]/10 hover:text-primary transition-colors text-[#4c9a8d]">
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        <button className="text-xs font-black size-9 flex items-center justify-center text-[#0d1b19] rounded-xl bg-primary shadow-sm">1</button>
                        <button className="flex size-9 items-center justify-center rounded-xl hover:bg-[#42f0d3]/10 hover:text-primary transition-colors text-[#4c9a8d]">
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
