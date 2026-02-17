import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { DatabaseService } from '../../services/database';

interface ExamFile {
    id: number;
    patient_name: string;
    patient_code: string;
    type: 'ECG' | 'ETT'; // Derived from data
    date: string;
    result: string;
    file_status: 'Available' | 'Missing';
}

interface ArchivePageProps {
    onViewExam: (id: string, patientId: string) => void;
}

export const ArchivePage: React.FC<ArchivePageProps> = ({ onViewExam }) => {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'ECG' | 'ETT'>('ALL');
    const [files, setFiles] = useState<ExamFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await DatabaseService.getAllExams();
            // Transform data
            const formatted: ExamFile[] = data.map(item => {
                const isECG = !!item.ecg_interpretation;
                return {
                    id: item.id,
                    patient_name: item.patient_name,
                    patient_code: item.patient_code,
                    type: isECG ? 'ECG' : 'ETT',
                    date: new Date(item.date).toLocaleDateString(),
                    result: isECG ? item.ecg_interpretation : `FEVG: ${item.ett_fevg || '?'}%`,
                    file_status: 'Available' // Assuming available if record exists
                };
            });
            setFiles(formatted);
        } catch (error) {
            console.error("Failed to load archives:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredFiles = files.filter(f => {
        const matchesSearch = f.patient_name.toLowerCase().includes(search.toLowerCase()) ||
            f.patient_code.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === 'ALL' || f.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="flex flex-col flex-1 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] overflow-y-auto font-sans text-[var(--color-text-main)] dark:text-white p-8 animate-in fade-in duration-300">
            <div className="max-w-7xl mx-auto w-full text-left">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-[var(--color-text-main)] dark:text-white tracking-tight uppercase">Archives ECG & ETT</h2>
                        <p className="text-[var(--color-text-muted)] font-medium mt-1">Stockage sécurisé et historique des examens cardiologiques.</p>
                    </div>
                </div>

                <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] p-4 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">search</span>
                        <input
                            type="text"
                            placeholder="Rechercher par patient (Nom ou ID)..."
                            className="w-full h-12 pl-12 pr-4 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all text-sm font-bold text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] p-1 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                        {(['ALL', 'ECG', 'ETT'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filterType === type
                                    ? 'bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] text-[var(--color-primary)] shadow-sm'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] dark:hover:text-white'
                                    }`}
                            >
                                {type === 'ALL' ? 'Tout' : type}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredFiles.map((file) => (
                            <div
                                key={file.id}
                                className="group bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-sm hover:shadow-xl hover:border-[var(--color-primary)]/30 transition-all duration-300 overflow-hidden flex flex-col"
                            >
                                <div className="aspect-[16/10] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] relative overflow-hidden flex items-center justify-center">
                                    <span className={`material-symbols-outlined text-6xl group-hover:scale-110 transition-transform duration-500 ${file.type === 'ECG' ? 'text-red-500/20' : 'text-blue-500/20'
                                        }`}>
                                        {file.type === 'ECG' ? 'monitor_heart' : 'medical_services'}
                                    </span>
                                    <div className={`absolute top-4 left-4 px-2.5 py-1 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border ${file.type === 'ECG'
                                        ? 'bg-red-500/10 text-red-600 border-red-500/20'
                                        : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                        }`}>
                                        {file.type}
                                    </div>
                                </div>
                                <div className="p-5 space-y-3 flex-1 flex flex-col">
                                    <div>
                                        <h4 className="font-bold text-[var(--color-text-main)] dark:text-white text-base tracking-tight truncate" title={file.patient_name}>{file.patient_name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{file.date}</span>
                                            <span className="text-[var(--color-border)] dark:text-[var(--color-dark-border)]">•</span>
                                            <span className="text-[10px] font-bold text-[var(--color-text-muted)] truncate max-w-[100px]" title={file.patient_code}>ID: {file.patient_code}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 italic bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] p-3 rounded-lg border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                                        "{file.result}"
                                    </p>

                                    <div className="mt-auto pt-2 flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-9 text-[10px] uppercase font-black"
                                            onClick={() => {
                                                onViewExam(String(file.id), file.patient_code);
                                            }}
                                        >
                                            Voir Détails
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredFiles.length === 0 && (
                            <div className="col-span-full py-12 text-center text-[var(--color-text-muted)]">
                                <span className="material-symbols-outlined text-4xl mb-4 opacity-50">search_off</span>
                                <p className="font-bold">Aucun examen trouvé.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
