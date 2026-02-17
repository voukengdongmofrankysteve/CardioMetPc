import React from 'react';

interface SidebarProps {
    activePage: string;
    onPageChange: (page: any) => void;
    onLogout: () => void;
}

const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'grid_view' },
    { id: 'appointments', label: 'Rendez-vous', icon: 'calendar_month' },
    { id: 'patients', label: 'Patients', icon: 'groups' },
    { id: 'consultations', label: 'Consultations', icon: 'stethoscope' },
    // { id: 'archives', label: 'Archives', icon: 'folder_open' },
    { id: 'prescriptions', label: 'Ordonnances', icon: 'medication' },
    { id: 'prescription-templates', label: 'Modèles Rx', icon: 'description' },
    // { id: 'stats', label: 'Statistiques', icon: 'bar_chart' },
    { id: 'settings', label: 'Paramètres', icon: 'settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange, onLogout }) => {
    return (
        <aside className="w-64 flex flex-col bg-bg-sidebar dark:bg-dark-bg-sidebar border-r border-border dark:border-dark-border shrink-0 h-full transition-colors duration-200">
            {/* Nav Items */}
            <div className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
                <div className="mb-4 px-3 text-[10px] font-bold uppercase text-text-muted/60 dark:text-dark-text-muted/60 tracking-wider">
                    Menu Principal
                </div>
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onPageChange(item.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                            ${activePage === item.id
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-text-muted dark:text-dark-text-muted hover:bg-bg-main dark:hover:bg-dark-bg-main hover:text-text-main dark:hover:text-dark-text-main font-medium'
                            }`}
                    >
                        <span className={`material-symbols-outlined text-[20px] ${activePage === item.id ? 'fill-current' : ''}`}>
                            {item.icon}
                        </span>
                        <span className="text-sm">{item.label}</span>

                        {activePage === item.id && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Profile / User Footer */}
            <div className="p-4 border-t border-border dark:border-dark-border">
                <div className="bg-bg-main dark:bg-dark-bg-main p-3 rounded-lg border border-border dark:border-dark-border flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors">
                    <div className="size-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        AE
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                        <p className="text-xs font-bold text-text-main dark:text-dark-text-main truncate">Dr. Cyrille Mbida</p>
                        <p className="text-[10px] text-text-muted dark:text-dark-text-muted truncate">Cardiologue Senior</p>
                    </div>
                    <button onClick={onLogout} className="material-symbols-outlined text-[18px] text-text-muted hover:text-red-500 transition-colors">logout</button>
                </div>
            </div>
        </aside>
    );
};
