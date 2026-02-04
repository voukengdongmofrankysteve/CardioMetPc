import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DatabaseService } from '../../services/database';

interface Appointment {
    id: number;
    patient_db_id: number;
    patient_name: string;
    doctor_db_id: number;
    doctor_name: string;
    appointment_date: string;
    appointment_time: string;
    type: string;
    status: string;
}

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const hours = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

export const AppointmentsPage: React.FC<{ onViewDetails?: (id: number) => void }> = ({ onViewDetails }) => {
    const [view, setView] = useState<'day' | 'week' | 'month'>('week');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [agenda, setAgenda] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [typeFilter, setTypeFilter] = useState<string>('All');

    // Search & Form State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
    const [consultType, setConsultType] = useState('New Consultation');
    const [appDate, setAppDate] = useState(new Date().toISOString().split('T')[0]);
    const [appTime, setAppTime] = useState('09:00');
    const [appNotes, setAppNotes] = useState('');
    const [postedBy, setPostedBy] = useState<'Hospital' | 'Client'>('Hospital');
    const [isScheduling, setIsScheduling] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, [selectedDate]);

    const loadInitialData = async () => {
        try {
            const doctorsData = await DatabaseService.getUsers();
            setDoctors(doctorsData.filter(u => u.role === 'Doctor' || u.role === 'Admin'));

            // Load agenda for today
            const today = new Date().toISOString().split('T')[0];
            const agendaData = await DatabaseService.getAppointments(today);
            setAgenda(agendaData);

            // Load appointments for the current view week (simplified for now)
            const allAppts = await DatabaseService.getAppointments();
            setAppointments(allAppts);
        } catch (error) {
            console.error('Failed to load appointments data:', error);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length > 1) {
            try {
                const results = await DatabaseService.searchPatients(query);
                setSearchResults(results);
            } catch (error) {
                console.error('Search failed:', error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleSchedule = async () => {
        if (!selectedPatient) return alert('Please select a patient');

        setIsScheduling(true);
        try {
            await DatabaseService.createAppointment({
                patient_db_id: selectedPatient.id,
                doctor_db_id: selectedDoctorId || undefined,
                appointment_date: appDate,
                appointment_time: appTime,
                type: consultType,
                notes: appNotes,
                posted_by: postedBy,
                created_by_role: 'Hospital Staff' // Default for now
            });

            // Reset & Refresh
            setSelectedPatient(null);
            setSearchQuery('');
            setSearchResults([]);
            setAppNotes('');
            setPostedBy('Hospital');
            loadInitialData();
            alert('Appointment scheduled successfully!');
        } catch (error) {
            console.error('Scheduling failed:', error);
            alert('Failed to schedule appointment');
        } finally {
            setIsScheduling(false);
        }
    };

    const getWeekDays = (baseDate: Date) => {
        const start = new Date(baseDate);
        start.setDate(start.getDate() - start.getDay() + 1); // Monday
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    };

    const currentWeek = getWeekDays(selectedDate);

    const getApptsForSlot = (date: Date, hourString: string) => {
        const dateStr = date.toISOString().split('T')[0];
        // hourString is like "09:00 AM" -> "09:00"
        let hour24 = hourString.split(' ')[0];
        if (hourString.includes('PM') && !hour24.startsWith('12')) {
            hour24 = (parseInt(hour24) + 12).toString().padStart(2, '0');
        } else if (hourString.includes('AM') && hour24.startsWith('12')) {
            hour24 = '00';
        }
        const timePrefix = hour24.includes(':') ? hour24.split(':')[0] : hour24;

        return appointments.filter(a =>
            a.appointment_date === dateStr &&
            a.appointment_time.startsWith(timePrefix)
        );
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'New Consultation': return 'bg-primary';
            case 'ECG / ETT': return 'bg-orange-400';
            case 'Follow-up': return 'bg-purple-500';
            default: return 'bg-primary';
        }
    };

    return (
        <div className="flex h-screen bg-[#f6f8f8] dark:bg-[#101f22] overflow-hidden">
            {/* Left Sidebar: New Appointment */}
            <aside className="w-80 border-r border-[#e7f3f1] dark:border-[#1e3a36] bg-white dark:bg-[#152a26] flex flex-col overflow-y-auto no-scrollbar">
                <div className="p-8 space-y-8">
                    <div>
                        <h2 className="text-2xl font-black text-[#0d1b19] dark:text-white tracking-tight mb-6 uppercase">New Appointment</h2>

                        <div className="space-y-6">
                            <div className="relative">
                                <label className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest block mb-2">Patient Search</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c9a8d] text-base">search</span>
                                    <Input
                                        placeholder="Name or File Number..."
                                        className="pl-10 h-11 text-xs font-bold"
                                        value={selectedPatient ? selectedPatient.full_name : searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        readOnly={!!selectedPatient}
                                    />
                                    {selectedPatient && (
                                        <button
                                            onClick={() => { setSelectedPatient(null); setSearchQuery(''); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4c9a8d] hover:text-red-500"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    )}
                                </div>

                                {searchResults.length > 0 && !selectedPatient && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#152a26] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl shadow-xl z-50 overflow-hidden">
                                        {searchResults.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedPatient(p)}
                                                className="w-full p-3 text-left hover:bg-[#f6f8f8] dark:hover:bg-white/5 border-b border-[#f6f8f8] dark:border-white/5 last:border-0 transition-all"
                                            >
                                                <p className="text-xs font-black text-[#0d1b19] dark:text-white">{p.full_name}</p>
                                                <p className="text-[10px] font-bold text-[#4c9a8d]">{p.patient_id}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest block mb-2">Assign Doctor</label>
                                <select
                                    className="w-full h-11 px-4 bg-[#f6f8f8] dark:bg-[#101f22] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl text-xs font-bold outline-none focus:border-primary transition-all cursor-pointer"
                                    value={selectedDoctorId}
                                    onChange={(e) => setSelectedDoctorId(e.target.value ? parseInt(e.target.value) : '')}
                                >
                                    <option value="">Select Doctor (Optional)</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest block mb-4">Consultation Type</label>
                                <div className="space-y-2">
                                    {['New Consultation', 'Follow-up', 'ECG / ETT'].map((type) => (
                                        <label key={type} className="flex items-center gap-3 p-3 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl cursor-pointer hover:bg-[#f6f8f8] dark:hover:bg-white/5 transition-all">
                                            <input
                                                type="radio"
                                                name="consultaion-type"
                                                className="accent-primary"
                                                checked={consultType === type}
                                                onChange={() => setConsultType(type)}
                                            />
                                            <span className="text-xs font-black text-[#0d1b19] dark:text-white uppercase tracking-tighter">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest block mb-2">Date</label>
                                    <Input type="date" className="h-11 text-xs font-bold" value={appDate} onChange={(e) => setAppDate(e.target.value)} />
                                </div>
                                <div className="w-28 mt-auto">
                                    <Input type="time" className="h-11 text-xs font-bold" value={appTime} onChange={(e) => setAppTime(e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest block mb-2">Posted By / Source</label>
                                <div className="flex bg-[#f6f8f8] dark:bg-[#101f22] p-1 rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36]">
                                    {(['Hospital', 'Client'] as const).map(source => (
                                        <button
                                            key={source}
                                            onClick={() => setPostedBy(source)}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${postedBy === source
                                                    ? 'bg-white dark:bg-[#152a26] text-primary shadow-sm'
                                                    : 'text-[#4c9a8d]'
                                                }`}
                                        >
                                            {source}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest block mb-2">Clinical Notes</label>
                                <textarea
                                    placeholder="Add specific notes or reason for visit..."
                                    className="w-full min-h-[100px] p-4 bg-[#f6f8f8] dark:bg-[#101f22] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl text-xs font-bold outline-none focus:border-primary transition-all resize-none dark:text-white"
                                    value={appNotes}
                                    onChange={(e) => setAppNotes(e.target.value)}
                                />
                            </div>

                            <Button
                                onClick={handleSchedule}
                                disabled={isScheduling || !selectedPatient}
                                className={`w-full h-12 bg-primary text-[#0d1b19] font-black uppercase tracking-widest shadow-lg shadow-primary/20 ${isScheduling ? 'animate-pulse' : ''}`}
                                icon="add_circle"
                            >
                                {isScheduling ? 'Scheduling...' : 'Schedule Slot'}
                            </Button>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-dashed border-[#e7f3f1] dark:border-[#1e3a36]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em]">Today's Agenda</h3>
                            <span className="px-2 py-0.5 bg-[#f6f8f8] dark:bg-white/5 rounded-full text-[9px] font-black text-primary uppercase">{agenda.length} Appts</span>
                        </div>

                        <div className="space-y-3">
                            {agenda.map((item) => (
                                <div key={item.id} className="p-4 bg-white dark:bg-[#101f22] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-2xl flex items-center justify-between group hover:border-primary/50 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1 h-8 rounded-full ${getTypeColor(item.type)}`}></div>
                                        <div>
                                            <p className="text-xs font-black text-[#0d1b19] dark:text-white leading-tight">
                                                {item.appointment_time.substring(0, 5)} - {item.patient_name}
                                            </p>
                                            <p className="text-[10px] font-bold text-[#4c9a8d] uppercase tracking-tighter mt-0.5">{item.type}</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-[18px] text-[#4c9a8d] opacity-0 group-hover:opacity-100 transition-all">more_vert</span>
                                </div>
                            ))}
                            {agenda.length === 0 && (
                                <p className="text-center py-8 text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest opacity-50">Empty Agenda</p>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Area: Calendar */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="p-8 border-b border-[#e7f3f1] dark:border-[#1e3a36] bg-white dark:bg-[#152a26] flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div>
                            <h1 className="text-3xl font-black text-[#0d1b19] dark:text-white tracking-tighter leading-none">
                                {selectedDate.toLocaleString('default', { month: 'long' })}
                            </h1>
                            <p className="text-2xl font-black text-primary leading-none mt-1">{selectedDate.getFullYear()}</p>
                        </div>

                        <div className="flex items-center gap-2 h-11 bg-[#f6f8f8] dark:bg-[#101f22] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl px-2">
                            <button
                                onClick={() => {
                                    const d = new Date(selectedDate);
                                    d.setDate(d.getDate() - 7);
                                    setSelectedDate(d);
                                }}
                                className="material-symbols-outlined text-[#4c9a8d] hover:text-primary p-1"
                            >
                                chevron_left
                            </button>
                            <button
                                onClick={() => setSelectedDate(new Date())}
                                className="text-[10px] font-black uppercase tracking-widest px-4 border-l border-r border-[#e7f3f1] dark:border-[#1e3a36]"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => {
                                    const d = new Date(selectedDate);
                                    d.setDate(d.getDate() + 7);
                                    setSelectedDate(d);
                                }}
                                className="material-symbols-outlined text-[#4c9a8d] hover:text-primary p-1"
                            >
                                chevron_right
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-4 border-l border-[#e7f3f1] dark:border-[#1e3a36] pl-8">
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-[#4c9a8d] uppercase tracking-widest pl-1">Status</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-8 bg-[#f6f8f8] dark:bg-[#101f22] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-lg px-3 text-[10px] font-black text-[#0d1b19] dark:text-white outline-none cursor-pointer"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-[#4c9a8d] uppercase tracking-widest pl-1">Type</span>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="h-8 bg-[#f6f8f8] dark:bg-[#101f22] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-lg px-3 text-[10px] font-black text-[#0d1b19] dark:text-white outline-none cursor-pointer"
                                >
                                    <option value="All">All Types</option>
                                    <option value="New Consultation">New Consultation</option>
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="ECG / ETT">ECG / ETT</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex p-1 bg-[#f6f8f8] dark:bg-[#101f22] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl">
                        {(['Day', 'Week', 'Month'] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v.toLowerCase() as any)}
                                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${view === v.toLowerCase() ? 'bg-white dark:bg-[#152a26] text-primary shadow-sm border border-[#e7f3f1] dark:border-[#1e3a36]' : 'text-[#4c9a8d] hover:text-[#0d1b19] dark:hover:text-white'
                                    }`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 bg-white dark:bg-[#152a26]">
                    <div className="min-w-[800px] h-full flex flex-col">
                        {/* Days Header */}
                        <div className="flex border-b border-[#e7f3f1] dark:border-[#1e3a36]">
                            <div className="w-20 shrink-0"></div>
                            {currentWeek.map((date, i) => (
                                <div key={i} className="flex-1 p-4 text-center border-l border-[#e7f3f1] dark:border-[#1e3a36]">
                                    <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-1">{days[i]}</p>
                                    <p className={`text-xl font-black ${date.toDateString() === new Date().toDateString() ? 'text-[#42f0d3]' : 'text-[#0d1b19] dark:text-white'}`}>
                                        {date.getDate()}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="flex-1">
                            {hours.map((hour) => (
                                <div key={hour} className="flex border-b border-[#e7f3f1] dark:border-[#1e3a36] min-h-[100px]">
                                    <div className="w-20 shrink-0 p-4 text-[10px] font-black text-[#4c9a8d] uppercase text-right border-r border-[#e7f3f1] dark:border-[#1e3a36]">
                                        {hour}
                                    </div>
                                    {currentWeek.map((date, i) => (
                                        <div key={i} className="flex-1 p-2 border-l border-[#e7f3f1] dark:border-[#1e3a36] relative hover:bg-[#f6f8f8] dark:hover:bg-white/5 transition-all">
                                            {getApptsForSlot(date, hour).map(app => (
                                                <button
                                                    key={app.id}
                                                    onClick={() => onViewDetails?.(app.id)}
                                                    className={`absolute inset-2 ${getTypeColor(app.type)} opacity-10 border-l-4 ${getTypeColor(app.type).replace('bg-', 'border-')} p-3 rounded-lg shadow-sm z-10 hover:opacity-20 transition-all cursor-pointer`}
                                                >
                                                    <p className={`text-[10px] font-black ${getTypeColor(app.type).replace('bg-', 'text-')} uppercase leading-tight mb-0.5 text-left`}>
                                                        {app.type.replace(' Consultation', '')}
                                                    </p>
                                                    <p className="text-[11px] font-black text-[#0d1b19] dark:text-white truncate text-left">
                                                        {app.patient_name}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-[#4c9a8d] truncate text-left">
                                                        {app.status} • {app.appointment_time.substring(0, 5)}
                                                    </p>
                                                </button>
                                            ))}

                                            {/* We only show the text names if there's space, or just use overlay as above */}
                                            {getApptsForSlot(date, hour).map(app => (
                                                <div key={`text-${app.id}`} className="absolute inset-2 border-l-4 border-transparent p-3 rounded-lg pointer-events-none z-20">
                                                    <p className={`text-[10px] font-black ${getTypeColor(app.type).replace('bg-', 'text-')} uppercase leading-tight mb-0.5`}>
                                                        {app.type.replace(' Consultation', '')}
                                                    </p>
                                                    <p className="text-[11px] font-black text-[#0d1b19] dark:text-white truncate">
                                                        {app.patient_name}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
