import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, patientService } from '../../services/api';
import moment from 'moment';

const StatCard: React.FC<{ label: string; value: string; icon: string; trend?: string; trendUp?: boolean; detail?: string }> = ({ label, value, icon, trend, trendUp, detail }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col transition-all hover:shadow-md hover:border-emerald-200">
        <div className="flex items-center justify-between mb-4">
            <p className="text-emerald-600 text-sm font-semibold uppercase tracking-wider">{label}</p>
            <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2.5 rounded-xl text-xl">{icon}</span>
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-slate-800 text-3xl font-bold">{value}</p>
            {trend && (
                <span className={`${trendUp ? 'text-emerald-600' : 'text-red-500'} text-sm font-semibold flex items-center gap-0.5`}>
                    <span className="material-symbols-outlined text-sm">{trendUp ? 'trending_up' : 'trending_down'}</span> {trend}
                </span>
            )}
            {detail && <span className="text-slate-500 text-sm font-medium ml-1">{detail}</span>}
        </div>
    </div>
);

const ActivityItem: React.FC<{ color: string; icon: string; title: string; time: string; location: string }> = ({ color, icon, title, time, location }) => (
    <div className="p-4 flex items-start gap-4 hover:bg-emerald-50/50 transition-colors cursor-pointer group rounded-lg">
        <div className={`${color} p-2.5 rounded-xl shrink-0 group-hover:scale-105 transition-transform`}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
            <p className="text-sm text-slate-800 font-medium" dangerouslySetInnerHTML={{ __html: title }} />
            <p className="text-xs text-slate-500 mt-1">{time} • {location}</p>
        </div>
        <button type="button" className="text-slate-400 hover:text-emerald-600 p-1 rounded-lg hover:bg-emerald-50 transition-colors">
            <span className="material-symbols-outlined text-lg">more_horiz</span>
        </button>
    </div>
);

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total_patients: 0,
        total_consultations: 0,
        today_appointments: 0,
        pending_prescriptions: 0,
        appointments_today: 0,
        appointments_completed: 0,
        pending_reports: 0
    });

    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [nextAppointments, setNextAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true);
            try {
                const data = await dashboardService.getStats();
                if (!data) return;

                const s = data.stats || {};
                setStats({
                    total_patients: s.total_patients ?? 0,
                    total_consultations: s.total_consultations ?? 0,
                    today_appointments: s.today_appointments ?? 0,
                    pending_prescriptions: s.pending_prescriptions ?? 0,
                    appointments_today: s.today_appointments ?? 0,
                    appointments_completed: s.completed_appointments ?? 0,
                    pending_reports: s.pending_reports ?? 0,
                });

                setRecentActivity(Array.isArray(data.recent_activity) ? data.recent_activity : []);
                setNextAppointments(Array.isArray(data.upcoming_appointments) ? data.upcoming_appointments : []);
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
            <div className="flex-1 flex flex-col items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-emerald-700 font-semibold text-sm">Chargement du tableau de bord...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-8 text-left">
                <h2 className="text-slate-800 text-2xl md:text-3xl font-bold tracking-tight">Bienvenue, Dr. Cyrille Mbida</h2>
                <p className="text-slate-600 mt-1 text-sm">Voici l'état actuel de votre pratique cardiologique aujourd'hui.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    label="Total Patients"
                    value={stats.total_patients.toLocaleString()}
                    icon="group"
                    trend="+Nouveau"
                    trendUp
                />
                <StatCard
                    label="Rendez-vous Aujourd'hui"
                    value={stats.appointments_today.toString()}
                    icon="calendar_today"
                    detail={`${stats.appointments_completed} terminés`}
                />
                <StatCard
                    label="Rapports en Attente"
                    value={stats.pending_reports.toString()}
                    icon="clinical_notes"
                    trend="Consultations en cours"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-slate-800 font-bold text-lg">Activité Récente</h3>
                            <button type="button" className="text-emerald-600 text-sm font-semibold hover:text-emerald-700">Voir tout</button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity, index) => (
                                    <ActivityItem
                                        key={index}
                                        color={activity.type === 'Consultation' ? "bg-emerald-50 text-emerald-600" : "bg-sky-50 text-sky-600"}
                                        icon={activity.type === 'Consultation' ? "check_circle" : "person_add"}
                                        title={`${activity.type === 'Consultation' ? 'Consultation' : 'Nouveau Patient'} - <strong>${activity.patient_name}</strong>`}
                                        time={activity.created_at ? moment(activity.created_at).fromNow() : 'N/A'}
                                        location={activity.type === 'Consultation' ? (activity.details || 'Cardiologie') : 'Réception'}
                                    />
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-500 text-sm">Aucune activité récente.</div>
                            )}
                        </div>
                    </div>

                    {/* Next Appointments */}
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 text-left">
                            <h3 className="text-slate-800 font-bold text-lg">Prochains Rendez-vous</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-emerald-600 text-xs uppercase tracking-wider text-white font-semibold">
                                    <tr>
                                        <th className="px-6 py-3.5">Patient</th>
                                        <th className="px-6 py-3.5">Date</th>
                                        <th className="px-6 py-3.5">Heure</th>
                                        <th className="px-6 py-3.5">Type</th>
                                        <th className="px-6 py-3.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {nextAppointments.length > 0 ? (
                                        nextAppointments.map((apt) => (
                                            <tr key={apt.id} className="hover:bg-emerald-50/30 transition-colors">
                                                <td className="px-6 py-4 font-semibold text-slate-800">{apt.patient?.full_name || apt.patient_name}</td>
                                                <td className="px-6 py-4 text-slate-600">{apt.appointment_date ? moment(apt.appointment_date).format('DD/MM/YYYY') : '—'}</td>
                                                <td className="px-6 py-4 text-slate-600">{(apt.appointment_time || apt.time || '').toString().substring(0, 5)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${apt.type === 'Follow-up'
                                                        ? 'bg-sky-100 text-sky-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        {apt.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/appointments/${apt.id}`)}
                                                        className="text-emerald-600 font-bold hover:text-emerald-700 py-1"
                                                    >
                                                        Détails
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-sm">Aucun rendez-vous à venir.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right side panel */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
                        <h3 className="text-emerald-600 font-bold text-sm mb-4 uppercase tracking-wider">Actions Rapides</h3>
                        <div className="grid grid-cols-1 gap-2">
                            <QuickActionButton
                                icon="person_add"
                                label="Ajouter Patient"
                                onClick={() => navigate('/patients/new')}
                            />
                            <QuickActionButton
                                icon="ecg"
                                label="Enregistrer ECG"
                                onClick={() => navigate('/patients')}
                            />
                            <QuickActionButton
                                icon="print"
                                label="Imprimer Carte ID"
                                onClick={() => setIsPrintModalOpen(true)}
                            />
                        </div>
                    </div>

                    <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10 text-left">
                            <h4 className="font-bold text-lg mb-2">Rappel Pratique</h4>
                            <p className="text-white/90 text-sm leading-relaxed mb-4">Vous avez {stats.pending_reports} rapport{stats.pending_reports !== 1 ? 's' : ''} en attente de finalisation.</p>
                            <button type="button" className="bg-white text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-50 transition-colors">
                                Réviser maintenant
                            </button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-20">
                            <span className="material-symbols-outlined text-[100px]">monitor_heart</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-dashed border-emerald-200 bg-white text-center">
                        <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-widest mb-1">Affilié à</p>
                        <p className="text-sm font-bold text-slate-700">CardioMed</p>
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
    <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 w-full p-3.5 bg-white hover:bg-emerald-50 rounded-xl transition-all group border border-slate-100 hover:border-emerald-200 text-left"
    >
        <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <span className="font-bold text-sm text-slate-700 group-hover:text-emerald-700 transition-colors">{label}</span>
    </button>
);

const PrintIdCardModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [search, setSearch] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

    const handleSearch = async (query: string) => {
        setSearch(query);
        if (query.length > 1) {
            try {
                const results = await patientService.searchPatients(query);
                setPatients(results);
            } catch (error) {
                console.error("Search failed:", error);
            }
        } else {
            setPatients([]);
        }
    };

    const handlePrint = () => {
        if (!selectedPatient) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Carte Patient - ${selectedPatient.full_name}</title>
                        <style>
                            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fff; }
                            .card { width: 350px; height: 200px; background: #10b981; border-radius: 16px; padding: 20px; color: #fff; position: relative; box-shadow: 0 4px 20px rgba(5,150,105,0.25); }
                            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                            .logo { font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                            .title { font-size: 10px; font-weight: bold; opacity: 0.8; }
                            .content { display: flex; gap: 15px; }
                            .avatar { width: 60px; height: 60px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 24px; color: #059669; }
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
                                <div class="avatar">${(selectedPatient.full_name || 'P').charAt(0)}</div>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Imprimer Carte Patient</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {!selectedPatient ? (
                        <>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                <input
                                    type="text"
                                    placeholder="Rechercher un patient..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl outline-none transition-all text-slate-800"
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-[220px] overflow-y-auto space-y-1 rounded-xl border border-slate-100">
                                {patients.map(p => (
                                    <div
                                        key={p.id}
                                        className="p-3 hover:bg-emerald-50 rounded-lg cursor-pointer flex items-center gap-3 transition-colors"
                                        onClick={() => setSelectedPatient(p)}
                                    >
                                        <div className="size-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                            {(p.full_name || 'P').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{p.full_name}</p>
                                            <p className="text-xs text-slate-500 font-medium">{p.patient_id}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="w-[300px] h-[180px] mx-auto bg-emerald-600 rounded-2xl p-5 text-left shadow-lg relative text-white">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-bold text-xs opacity-90">FONDATION EBOGO</span>
                                </div>
                                <div className="flex gap-4">
                                    <div className="size-12 bg-white rounded-xl flex items-center justify-center font-bold text-xl text-emerald-600">
                                        {(selectedPatient.full_name || 'P').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg uppercase leading-none mb-1">{selectedPatient.full_name}</p>
                                        <p className="text-xs font-semibold opacity-90">{selectedPatient.patient_id}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPatient(null)}
                                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Changer
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrint}
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-md"
                                >
                                    <span className="material-symbols-outlined text-lg">print</span>
                                    Imprimer la carte
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};