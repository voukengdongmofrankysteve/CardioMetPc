import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';


interface ExamFile {
    id: string;
    patientName: string;
    type: 'ECG' | 'ETT';
    date: string;
    status: 'Validé' | 'En attente';
    previewUrl: string;
}

const mockFiles: ExamFile[] = [
    { id: '1', patientName: 'Jean Dupont', type: 'ECG', date: '28 Jan 2024', status: 'Validé', previewUrl: 'https://via.placeholder.com/150?text=ECG' },
    { id: '2', patientName: 'Marie Claire', type: 'ETT', date: '27 Jan 2024', status: 'En attente', previewUrl: 'https://via.placeholder.com/150?text=ETT' },
];

export const ArchivePage: React.FC = () => {
    const [search, setSearch] = useState('');

    return (
        <div className="flex flex-col flex-1 bg-[#f6f8f8] dark:bg-[#10221f] overflow-y-auto font-sans text-[#0d1b19] dark:text-white p-8">
            <div className="max-w-6xl mx-auto w-full text-left">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-[#0d1b19] dark:text-white tracking-tight uppercase">Archives ECG & ETT</h2>
                        <p className="text-[#4c9a8d] font-medium mt-1">Stockage sécurisé et historique des examens cardiologiques.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            icon="upload"
                            className="bg-primary hover:brightness-105 text-[#0d1b19] font-black uppercase tracking-widest px-6 h-11"
                        >
                            Importer un Examen
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#152a26] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] p-6 shadow-sm mb-8 flex gap-4">
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4c9a8d]">search</span>
                        <input
                            type="text"
                            placeholder="Rechercher par patient ou date..."
                            className="w-full h-12 pl-12 pr-4 bg-[#f6f8f8] dark:bg-[#10221f] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        icon="filter_list"
                        className="border-[#e7f3f1] dark:border-[#1e3a36] text-[#4c9a8d] font-bold uppercase tracking-widest h-12 px-6"
                    >
                        Filtres
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {mockFiles.map((file) => (
                        <div
                            key={file.id}
                            className="group bg-white dark:bg-[#152a26] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col"
                        >
                            <div className="aspect-[16/10] bg-[#f6f8f8] dark:bg-[#10221f] relative overflow-hidden">
                                {/* Realistic placeholder for medical imaging */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-6xl text-primary/10 group-hover:scale-110 transition-transform duration-500">
                                        {file.type === 'ECG' ? 'monitor_heart' : 'echo'}
                                    </span>
                                </div>
                                <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-white font-black uppercase tracking-[0.2em]">
                                    {file.type}
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-[#0d1b19] dark:text-white text-base tracking-tight">{file.patientName}</h4>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mt-1">{file.date}</p>
                                    </div>
                                    <span className={`
                                        text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest
                                        ${file.status === 'Validé' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}
                                    `}>
                                        {file.status}
                                    </span>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button className="flex-1 h-10 rounded-xl bg-[#f6f8f8] dark:bg-[#10221f] text-[#4c9a8d] hover:bg-primary/10 hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-base">visibility</span> Voir
                                    </button>
                                    <button className="size-10 rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] text-[#4c9a8d] hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center">
                                        <span className="material-symbols-outlined text-base">download</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
