import React from 'react';

interface SidebarProps {
    activePage: string;
    onPageChange: (page: any) => void;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'appointments', label: 'Appointments', icon: 'event_upcoming' },
    { id: 'patients', label: 'Patients', icon: 'group' },
    { id: 'consultations', label: 'Consultations', icon: 'medical_services' },
  /*   { id: 'archives', label: 'Archives', icon: 'folder_open' }, */
    { id: 'prescriptions', label: 'Ordonnances', icon: 'prescriptions' },
    { id: 'prescription-templates', label: 'Modèles Rx', icon: 'description' },
/*     { id: 'stats', label: 'Statistiques', icon: 'query_stats' }, */
    { id: 'settings', label: 'Paramètres', icon: 'settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
    return (
        <aside className="w-64 flex flex-col bg-white dark:bg-[#152a26] border-r border-[#e7f3f1] dark:border-[#1e3a36] shrink-0">
            <div className="flex-1 py-8 px-4 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onPageChange(item.id)}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative ${activePage === item.id
                            ? 'bg-[#42f0d3]/10 text-primary font-black shadow-sm border border-[#42f0d3]/20'
                            : 'text-[#4c9a8d] hover:bg-[#f6f8f8] dark:hover:bg-white/5 hover:text-[#0d1b19] dark:hover:text-white font-bold'
                            }`}
                    >
                        <span className={`material-symbols-outlined text-[22px] transition-transform duration-200 group-hover:scale-110 ${activePage === item.id ? 'font-black scale-110' : ''
                            }`}>
                            {item.icon}
                        </span>
                        <span className="text-sm tracking-tight">{item.label}</span>
                        {activePage === item.id && (
                            <div className="absolute right-2 size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(66,240,211,0.6)]"></div>
                        )}
                    </button>
                ))}
            </div>

            <div className="p-4 mt-auto border-t border-[#e7f3f1] dark:border-[#1e3a36]">
                <div className="bg-[#f6f8f8] dark:bg-white/5 p-4 rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] flex items-center gap-3 group cursor-pointer hover:bg-[#42f0d3]/5 transition-all">
                    <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-[#0d1b19] font-black border-2 border-white dark:border-[#1e3a36] shadow-sm group-hover:scale-110 transition-transform">
                        EB
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-xs font-black text-[#0d1b19] dark:text-white truncate">Dr. Armand Ebogo</p>
                        <p className="text-[10px] font-bold text-[#4c9a8d] truncate">Cardiologue Senior</p>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-[#4c9a8d] group-hover:text-primary transition-colors">logout</span>
                </div>
            </div>
        </aside>
    );
};
