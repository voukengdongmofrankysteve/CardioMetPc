import React, { useEffect, useState } from 'react';
import { DatabaseService } from '../../services/database';
import moment from 'moment';

const StatCard: React.FC<{ label: string; value: string; icon: string; trend?: string; trendUp?: boolean; detail?: string }> = ({ label, value, icon, trend, trendUp, detail }) => (
    <div className="bg-white dark:bg-[#152a26] p-6 rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm flex flex-col transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
            <p className="text-[#4c9a8d] dark:text-[#4c9a8d] text-sm font-semibold uppercase tracking-wider">{label}</p>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">{icon}</span>
        </div>
        <div className="flex items-baseline gap-2">
            <p className="text-[#0d1b19] dark:text-white text-3xl font-bold">{value}</p>
            {trend && (
                <span className={`${trendUp ? 'text-[#078838]' : 'text-red-500'} text-sm font-bold flex items-center`}>
                    <span className="material-symbols-outlined text-sm">{trendUp ? 'trending_up' : 'trending_down'}</span> {trend}
                </span>
            )}
            {detail && <span className="text-[#4c9a8d] dark:text-slate-500 text-sm font-medium">{detail}</span>}
        </div>
    </div>
);

const ActivityItem: React.FC<{ color: string; icon: string; title: string; time: string; location: string }> = ({ color, icon, title, time, location }) => (
    <div className="p-5 flex items-start gap-4 hover:bg-[#f6f8f8] dark:hover:bg-white/5 transition-colors cursor-pointer group">
        <div className={`${color} p-2 rounded-full mt-1 group-hover:scale-110 transition-transform`}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div className="flex-1 text-left">
            <p className="text-sm text-[#0d1b19] dark:text-white font-medium" dangerouslySetInnerHTML={{ __html: title }} />
            <p className="text-xs text-[#4c9a8d] mt-1">{time} • {location}</p>
        </div>
        <button className="text-[#4c9a8d] hover:text-primary"><span className="material-symbols-outlined">more_horiz</span></button>
    </div>
);

interface DashboardPageProps {
    onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState({
        totalPatients: 0,
        appointmentsToday: 0,
        appointmentsCompletedToday: 0,
        pendingReports: 0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [nextAppointments, setNextAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];

                const [statsData, activityData, appointmentsData] = await Promise.all([
                    DatabaseService.getDashboardStats(),
                    DatabaseService.getRecentActivity(),
                    DatabaseService.getAppointments(today)
                ]);

                setStats(statsData);
                setRecentActivity(activityData);

                // Filter for upcoming or all appointments today
                setNextAppointments(appointmentsData.slice(0, 5));
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f6f8f8] dark:bg-[#10221f]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#4c9a8d] font-black uppercase tracking-widest text-xs">Chargement du tableau de bord...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-[#f6f8f8] dark:bg-[#10221f]">
            {/* Header */}
            <div className="mb-8 text-left">
                <h2 className="text-[#0d1b19] dark:text-white text-3xl font-black tracking-tight">Bienvenue, Dr. Ebogo</h2>
                <p className="text-[#4c9a8d] dark:text-[#4c9a8d] mt-1 font-medium">Voici l'état actuel de votre pratique cardiologique aujourd'hui.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    label="Total Patients"
                    value={stats.totalPatients.toLocaleString()}
                    icon="group"
                    trend="+Nouveau"
                    trendUp
                />
                <StatCard
                    label="Rendez-vous Aujourd'hui"
                    value={stats.appointmentsToday.toString()}
                    icon="calendar_today"
                    detail={`${stats.appointmentsCompletedToday} terminés`}
                />
                <StatCard
                    label="Rapports en Attente"
                    value={stats.pendingReports.toString()}
                    icon="clinical_notes"
                    trend="Consultations en cours"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex items-center justify-between">
                            <h3 className="text-[#0d1b19] dark:text-white font-bold text-lg">Activité Récente</h3>
                            <button className="text-primary text-xs font-bold uppercase hover:underline">Voir Tout</button>
                        </div>
                        <div className="divide-y divide-[#e7f3f1] dark:divide-[#1e3a36]">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity, index) => (
                                    <ActivityItem
                                        key={index}
                                        color={activity.type === 'Consultation' ? "bg-[#42f0d3]/10 text-[#42f0d3]" : "bg-blue-50 dark:bg-blue-900/20 text-blue-500"}
                                        icon={activity.type === 'Consultation' ? "check_circle" : "person_add"}
                                        title={`${activity.type === 'Consultation' ? 'Consultation' : 'Nouveau Patient'} - <strong>${activity.patient_name}</strong>`}
                                        time={moment(activity.created_at).fromNow()}
                                        location={activity.type === 'Consultation' ? (activity.details || 'Cardiologie') : 'Réception'}
                                    />
                                ))
                            ) : (
                                <div className="p-8 text-center text-[#4c9a8d] text-sm">Aucune activité récente.</div>
                            )}
                        </div>
                    </div>

                    {/* Next Appointments */}
                    <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-[#e7f3f1] dark:border-[#1e3a36] text-left">
                            <h3 className="text-[#0d1b19] dark:text-white font-bold text-lg">Prochains Rendez-vous</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#f6f8f8] dark:bg-white/5 text-[11px] uppercase tracking-wider text-[#4c9a8d] font-bold">
                                    <tr>
                                        <th className="px-6 py-3">Patient</th>
                                        <th className="px-6 py-3">Heure</th>
                                        <th className="px-6 py-3">Type</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e7f3f1] dark:divide-[#1e3a36] text-sm">
                                    {nextAppointments.length > 0 ? (
                                        nextAppointments.map((apt) => (
                                            <tr key={apt.id}>
                                                <td className="px-6 py-4 font-bold text-[#0d1b19] dark:text-white">{apt.patient_name}</td>
                                                <td className="px-6 py-4 text-[#4c9a8d] font-medium">{apt.appointment_time}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${apt.type === 'Follow-up'
                                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                        : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                                        }`}>
                                                        {apt.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-primary font-bold hover:underline">Détails</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-[#4c9a8d] text-sm">Aucun rendez-vous prévu aujourd'hui.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right side panel */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#152a26] p-6 rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm text-left">
                        <h3 className="text-[#0d1b19] dark:text-white font-bold text-lg mb-5 uppercase tracking-wider text-xs text-[#4c9a8d]">Actions Rapides</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <QuickActionButton
                                icon="person_add"
                                label="Ajouter Patient"
                                onClick={() => onNavigate('new-patient')}
                            />
                            <QuickActionButton
                                icon="ecg"
                                label="Enregistrer ECG"
                                onClick={() => onNavigate('patients')}
                            />
                            <QuickActionButton
                                icon="print"
                                label="Imprimer Carte ID"
                                onClick={() => setIsPrintModalOpen(true)}
                            />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#42f0d3] to-[#2db6b8] p-6 rounded-xl text-[#0d1b19] shadow-lg relative overflow-hidden">
                        <div className="relative z-10 text-left">
                            <h4 className="font-black text-lg mb-2">Rappel Pratique</h4>
                            <p className="text-[#0d1b19]/80 text-sm leading-relaxed mb-4 font-medium">Vous avez {stats.pendingReports} rapports en attente de finalisation.</p>
                            <button className="bg-white text-[#0d1b19] px-4 py-2 rounded-lg text-xs font-bold uppercase shadow-sm hover:bg-gray-50 transition-colors">Réviser Maintenant</button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <span className="material-symbols-outlined text-[120px]">monitor_heart</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-dashed border-[#e7f3f1] dark:border-[#1e3a36] text-center">
                        <p className="text-[10px] text-[#4c9a8d] font-black uppercase tracking-widest mb-1">Affilié à</p>
                        <p className="text-sm font-bold text-[#0d1b19] dark:text-white/80">CardioMed </p>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PrintIdCardModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
            />
        </div>
    );
};

const QuickActionButton: React.FC<{ icon: string; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex items-center gap-3 w-full p-4 bg-[#f6f8f8] dark:bg-white/5 rounded-xl hover:bg-[#42f0d3]/10 hover:text-primary transition-all group border border-transparent hover:border-[#42f0d3]/20">
        <div className="size-10 rounded-lg bg-white dark:bg-[#152a26] shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="font-bold text-sm text-[#0d1b19] dark:text-white group-hover:text-primary transition-colors">{label}</span>
    </button>
);

// Print ID Card Modal Component
const PrintIdCardModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [search, setSearch] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

    const handleSearch = async (query: string) => {
        setSearch(query);
        if (query.length > 1) {
            const results = await DatabaseService.searchPatients(query);
            setPatients(results);
        } else {
            setPatients([]);
        }
    };

    const handlePrint = () => {
        if (!selectedPatient) return;

        // In a real app, this would generate a PDF or open a print window with specific CSS
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Carte Patient - ${selectedPatient.full_name}</title>
                        <style>
                            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
                            .card { width: 350px; height: 200px; background: linear-gradient(135deg, #42f0d3 0%, #2db6b8 100%); border-radius: 16px; padding: 20px; color: #0d1b19; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                            .logo { font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                            .title { font-size: 10px; font-weight: bold; opacity: 0.8; }
                            .content { display: flex; gap: 15px; }
                            .avatar { width: 60px; height: 60px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 24px; color: #2db6b8; }
                            .info { flex: 1; }
                            .name { font-size: 16px; font-weight: 900; margin: 0 0 5px 0; text-transform: uppercase; }
                            .detail { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
                            .id-number { position: absolute; bottom: 20px; right: 20px; font-family: monospace; font-size: 14px; font-weight: bold; opacity: 0.6; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <div class="header">
                                <div>
                                    <div class="logo">FONDATION EBOGO</div>
                                    <div class="title">CARTE PATIENT</div>
                                </div>
                            </div>
                            <div class="content">
                                <div class="avatar">${selectedPatient.full_name.charAt(0)}</div>
                                <div class="info">
                                    <h2 class="name">${selectedPatient.full_name}</h2>
                                    <p class="detail">Né(e) le: ${new Date(selectedPatient.dob).toLocaleDateString()}</p>
                                    <p class="detail">Sexe: ${selectedPatient.gender}</p>
                                    <p class="detail">Tel: ${selectedPatient.phone}</p>
                                </div>
                            </div>
                            <div class="id-number">${selectedPatient.patient_id}</div>
                        </div>
                        <script>window.print();</script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#152a26] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-white">Imprimer Carte Patient</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {!selectedPatient ? (
                        <>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                <input
                                    type="text"
                                    placeholder="Rechercher un patient..."
                                    className="w-full pl-10 pr-4 py-2 bg-[#f6f8f8] dark:bg-white/5 border border-transparent focus:border-primary rounded-xl outline-none transition-all dark:text-white"
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-[200px] overflow-y-auto space-y-2">
                                {patients.map(p => (
                                    <div
                                        key={p.id}
                                        className="p-3 hover:bg-[#f6f8f8] dark:hover:bg-white/5 rounded-xl cursor-pointer flex items-center gap-3 transition-colors"
                                        onClick={() => setSelectedPatient(p)}
                                    >
                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {p.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-[#0d1b19] dark:text-white">{p.full_name}</p>
                                            <p className="text-xs text-[#4c9a8d]">{p.patient_id}</p>
                                        </div>
                                    </div>
                                ))}
                                {search.length > 1 && patients.length === 0 && (
                                    <p className="text-center text-xs text-gray-400 py-4">Aucun patient trouvé</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="w-[300px] h-[180px] mx-auto bg-gradient-to-br from-[#42f0d3] to-[#2db6b8] rounded-xl p-4 text-left shadow-lg relative text-[#0d1b19]">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-black text-xs opacity-70">FONDATION EBOGO</span>
                                </div>
                                <div className="flex gap-4">
                                    <div className="size-12 bg-white rounded-lg flex items-center justify-center font-black text-xl text-[#2db6b8]">
                                        {selectedPatient.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-lg uppercase leading-none mb-1">{selectedPatient.full_name}</p>
                                        <p className="text-xs font-bold opacity-80">{selectedPatient.patient_id}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-center pt-2">
                                <button
                                    onClick={() => setSelectedPatient(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    Changer
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="px-6 py-2 rounded-xl text-xs font-bold bg-primary text-[#0d1b19] hover:bg-primary/90 transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">print</span>
                                    Imprimer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
