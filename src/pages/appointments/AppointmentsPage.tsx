import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { appointmentService, patientService, userService } from '../../services/api';
import moment from 'moment';

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

export const AppointmentsPage: React.FC = () => {
    const navigate = useNavigate();
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
            const usersData = await userService.getUsers();
            setDoctors(Array.isArray(usersData) ? usersData : []);

            const today = moment().format('YYYY-MM-DD');
            const agendaData = await appointmentService.getAppointments({ date: today });
            const agendaList = Array.isArray(agendaData) ? agendaData : [];
            const normalizedAgenda = agendaList.map((a: any) => normalizeAppointment(a));
            setAgenda(normalizedAgenda);

            const allApptsData = await appointmentService.getAppointments();
            const allList = Array.isArray(allApptsData) ? allApptsData : [];
            const normalizedAppointments = allList.map((a: any) => normalizeAppointment(a));
            setAppointments(normalizedAppointments);
        } catch (error) {
            console.error('Failed to load appointments data:', error);
            setAgenda([]);
            setAppointments([]);
        }
    };

    const normalizeAppointment = (a: any): Appointment => {
        const dateRaw = a.appointment_date ?? '';
        const dateStr = typeof dateRaw === 'string' ? dateRaw.substring(0, 10) : moment(dateRaw).format('YYYY-MM-DD');
        const timeStr = typeof a.appointment_time === 'string' ? a.appointment_time : String(a.appointment_time ?? '');
        return {
            id: a.id,
            patient_db_id: a.patient_id,
            patient_name: a.patient?.full_name ?? '',
            doctor_db_id: a.doctor_id,
            doctor_name: a.doctor?.name ?? a.doctor?.full_name ?? '',
            appointment_date: dateStr,
            appointment_time: timeStr,
            type: a.type ?? '',
            status: a.status ?? '',
        };
    };

    const filteredByStatusAndType = (list: Appointment[]) => {
        return list.filter(a => {
            if (statusFilter !== 'All' && a.status !== statusFilter) return false;
            if (typeFilter !== 'All' && a.type !== typeFilter) return false;
            return true;
        });
    };

    const filteredAgenda = filteredByStatusAndType(agenda);
    const filteredAppointments = filteredByStatusAndType(appointments);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length > 1) {
            try {
                const results = await patientService.searchPatients(query);
                setSearchResults(Array.isArray(results) ? results : []);
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
            await appointmentService.scheduleAppointment({
                patient_id: selectedPatient.id,
                doctor_id: selectedDoctorId || undefined,
                appointment_date: appDate,
                appointment_time: appTime,
                type: consultType,
                notes: appNotes,
            });

            setSelectedPatient(null);
            setSelectedDoctorId('');
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
        start.setDate(start.getDate() - start.getDay() + 1);
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    };

    const currentWeek = getWeekDays(selectedDate);

    const getApptsForSlot = (date: Date, hourString: string) => {
        const dateStr = date.toISOString().split('T')[0];
        let hour24 = hourString.split(' ')[0];
        if (hourString.includes('PM') && !hour24.startsWith('12')) {
            hour24 = (parseInt(hour24) + 12).toString().padStart(2, '0');
        } else if (hourString.includes('AM') && hour24.startsWith('12')) {
            hour24 = '00';
        }
        const timePrefix = hour24.includes(':') ? hour24.split(':')[0] : hour24;

        return filteredAppointments.filter(a =>
            a.appointment_date === dateStr &&
            (a.appointment_time || '').toString().substring(0, 5).startsWith(timePrefix)
        );
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'New Consultation': return 'bg-[#10b981]';
            case 'ECG / ETT': return 'bg-orange-400';
            case 'Follow-up': return 'bg-purple-500';
            default: return 'bg-[#10b981]';
        }
    };

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* Left Sidebar: New Appointment */}
            <aside className="w-80 border-r border-slate-100 bg-white flex flex-col overflow-y-auto no-scrollbar">
                <div className="p-8 space-y-8">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight mb-6 uppercase">New Appointment</h2>

                        <div className="space-y-6">
                            <div className="relative">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Patient Search</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#10b981] text-base">search</span>
                                    <Input
                                        placeholder="Name or File Number..."
                                        className="pl-10 h-11 text-xs font-bold bg-slate-50 border-slate-100 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                                        value={selectedPatient ? selectedPatient.full_name : searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        readOnly={!!selectedPatient}
                                    />
                                    {selectedPatient && (
                                        <button
                                            onClick={() => { setSelectedPatient(null); setSearchQuery(''); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    )}
                                </div>

                                {searchResults.length > 0 && !selectedPatient && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden">
                                        {searchResults.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedPatient(p)}
                                                className="w-full p-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-all"
                                            >
                                                <p className="text-xs font-black text-slate-800">{p.full_name}</p>
                                                <p className="text-[10px] font-bold text-[#10b981]">{p.patient_id}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Assign Doctor</label>
                                <select
                                    className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all cursor-pointer text-slate-700"
                                    value={selectedDoctorId}
                                    onChange={(e) => setSelectedDoctorId(e.target.value ? parseInt(e.target.value) : '')}
                                >
                                    <option value="">Select Doctor (Optional)</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.full_name ?? d.name ?? d.email ?? `User #${d.id}`}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Consultation Type</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['New Consultation', 'Follow-up', 'ECG / ETT'].map((type) => (
                                        <label key={type} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${consultType === type ? 'border-[#10b981] bg-[#10b981]/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                                            <input
                                                type="radio"
                                                name="consultaion-type"
                                                className="accent-[#10b981]"
                                                checked={consultType === type}
                                                onChange={() => setConsultType(type)}
                                            />
                                            <span className={`text-[10px] font-black uppercase tracking-tight ${consultType === type ? 'text-[#10b981]' : 'text-slate-600'}`}>{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Date</label>
                                    <Input type="date" className="h-11 text-xs font-bold bg-slate-50 border-slate-100 focus:border-[#10b981]" value={appDate} onChange={(e) => setAppDate(e.target.value)} />
                                </div>
                                <div className="w-28 mt-auto">
                                    <Input type="time" className="h-11 text-xs font-bold bg-slate-50 border-slate-100 focus:border-[#10b981]" value={appTime} onChange={(e) => setAppTime(e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Posted By</label>
                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                    {(['Hospital', 'Client'] as const).map(source => (
                                        <button
                                            key={source}
                                            onClick={() => setPostedBy(source)}
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${postedBy === source
                                                    ? 'bg-white text-[#10b981] shadow-sm'
                                                    : 'text-slate-400'
                                                }`}
                                        >
                                            {source}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Clinical Notes</label>
                                <textarea
                                    placeholder="Reason for visit..."
                                    className="w-full min-h-[80px] p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-[#10b981] transition-all resize-none text-slate-700"
                                    value={appNotes}
                                    onChange={(e) => setAppNotes(e.target.value)}
                                />
                            </div>

                            <Button
                                type="button"
                                onClick={handleSchedule}
                                disabled={isScheduling}
                                className={`w-full h-12 bg-[#10b981] hover:bg-[#059669] text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#10b981]/20 transition-all ${isScheduling ? 'animate-pulse' : ''} ${!selectedPatient ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isScheduling ? 'Scheduling...' : 'Schedule Slot'}
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Area: Calendar */}
            <main className="flex-1 flex flex-col overflow-hidden bg-white">
                <header className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">
                                {selectedDate.toLocaleString('default', { month: 'long' })}
                            </h1>
                            <p className="text-xl font-black text-[#10b981] leading-none mt-1">{selectedDate.getFullYear()}</p>
                        </div>

                        <div className="flex items-center gap-2 h-10 bg-slate-50 border border-slate-100 rounded-xl px-2">
                            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); }} className="material-symbols-outlined text-[#10b981] hover:bg-white rounded-lg p-1 transition-all">chevron_left</button>
                            <button onClick={() => setSelectedDate(new Date())} className="text-[10px] font-black uppercase tracking-widest px-4 text-slate-600">Today</button>
                            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); }} className="material-symbols-outlined text-[#10b981] hover:bg-white rounded-lg p-1 transition-all">chevron_right</button>
                        </div>
                    </div>

                    <div className="flex p-1 bg-slate-50 border border-slate-100 rounded-xl">
                        {(['Day', 'Week', 'Month'] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v.toLowerCase() as any)}
                                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${view === v.toLowerCase() ? 'bg-white text-[#10b981] shadow-sm' : 'text-slate-400 hover:text-slate-800'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6 bg-white">
                    <div className="min-w-[800px] h-full flex flex-col">
                        <div className="flex border-b border-slate-50">
                            <div className="w-20 shrink-0"></div>
                            {currentWeek.map((date, i) => (
                                <div key={i} className="flex-1 p-4 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{days[i]}</p>
                                    <p className={`text-lg font-black w-10 h-10 flex items-center justify-center mx-auto rounded-full ${date.toDateString() === new Date().toDateString() ? 'bg-[#10b981] text-white' : 'text-slate-800'}`}>
                                        {date.getDate()}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="flex-1">
                            {hours.map((hour) => (
                                <div key={hour} className="flex border-b border-slate-50 min-h-[100px]">
                                    <div className="w-20 shrink-0 p-4 text-[10px] font-black text-slate-400 uppercase text-right border-r border-slate-50">
                                        {hour}
                                    </div>
                                    {currentWeek.map((date, i) => (
                                        <div key={i} className="flex-1 p-2 border-l border-slate-50 relative hover:bg-slate-50 transition-all group">
                                            {getApptsForSlot(date, hour).map(app => (
                                                <button
                                                    key={app.id}
                                                    type="button"
                                                    onClick={() => navigate(`/appointments/${app.id}`)}
                                                    className={`absolute inset-2 ${getTypeColor(app.type)} text-white p-3 rounded-xl shadow-md z-10 hover:scale-[1.02] transition-all cursor-pointer text-left`}
                                                >
                                                    <p className="text-[9px] font-black uppercase opacity-80 leading-tight">{app.type.replace(' Consultation', '')}</p>
                                                    <p className="text-[11px] font-black truncate">{app.patient_name}</p>
                                                    <p className="text-[9px] font-bold opacity-80 truncate">{app.status}</p>
                                                </button>
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