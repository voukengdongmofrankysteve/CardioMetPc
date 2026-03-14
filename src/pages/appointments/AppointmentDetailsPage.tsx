import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { appointmentService } from '../../services/api';
import moment from 'moment';

export const AppointmentDetailsPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const appointmentId = parseInt(id || '0');
    const [appointment, setAppointment] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadAppointment();
    }, [appointmentId]);

    const loadAppointment = async () => {
        if (!appointmentId) return;
        setIsLoading(true);
        try {
            const data = await appointmentService.getAppointmentById(appointmentId);
            setAppointment(data ?? null);
        } catch (error) {
            console.error('Failed to load appointment:', error);
            setAppointment(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        setIsUpdating(true);
        try {
            await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
            await loadAppointment();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="text-[#4c9a8d] font-black animate-pulse uppercase tracking-widest">Loading Details...</div>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="min-h-screen bg-white p-8">
                <Button 
                    onClick={() => navigate(-1)} 
                    icon="arrow_back" 
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-xl"
                >
                    Back to Calendar
                </Button>
                <p className="mt-8 text-red-500 font-bold">Appointment not found.</p>
            </div>
        );
    }

    const statusOptions = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No Show'];

    return (
        <div className="min-h-screen bg-white p-8">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-6">
                    <Button 
                        onClick={() => navigate(-1)} 
                        icon="arrow_back" 
                        className="rounded-2xl h-12 w-12 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-lg shadow-green-500/20 transition-all"
                    >
                        {""}
                    </Button>
                    <div>
                        <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-1">Appointment Details</p>
                        <h1 className="text-3xl font-black text-[#0d1b19] tracking-tighter">
                            {appointment.patient?.full_name || 'Unknown Patient'}
                        </h1>
                    </div>
                </div>

                <div className="flex flex-col items-start md:items-end">
                    <span className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">Update Status</span>
                    <div className="flex flex-wrap gap-2">
                        {statusOptions.map(status => (
                            <button
                                key={status}
                                onClick={() => handleStatusUpdate(status)}
                                disabled={isUpdating}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                    appointment.status === status
                                        ? 'bg-[#22c55e] border-[#22c55e] text-white shadow-md'
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-[#22c55e] hover:text-[#22c55e]'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info Card */}
                <Card className="lg:col-span-2 p-8 rounded-[32px] border-2 border-[#f0f7f6] bg-white shadow-sm h-fit">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-4">Time & Date</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-[#f0f7f6] rounded-2xl border border-[#4c9a8d]/10">
                                    <span className="material-symbols-outlined text-[#4c9a8d]">calendar_today</span>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">Date</p>
                                        <p className="text-sm font-black text-[#0d1b19]">
                                            {moment(appointment.appointment_date).format('dddd, MMMM Do YYYY')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-[#f0f7f6] rounded-2xl border border-[#4c9a8d]/10">
                                    <span className="material-symbols-outlined text-[#4c9a8d]">schedule</span>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">Time</p>
                                        <p className="text-xl font-black text-[#0d1b19]">
                                            {(appointment.appointment_time || '').toString().substring(0, 5)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-4">Healthcare Professionals</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-[#f0f7f6] rounded-2xl border border-[#4c9a8d]/10">
                                    <span className="material-symbols-outlined text-[#4c9a8d]">medical_services</span>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">Doctor Assigned</p>
                                        <p className="text-sm font-black text-[#0d1b19]">
                                            {appointment.doctor?.name || appointment.doctor?.full_name || 'Not assigned'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-[#f0f7f6] rounded-2xl border border-[#4c9a8d]/10">
                                    <span className="material-symbols-outlined text-[#4c9a8d]">category</span>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">Appointment Type</p>
                                        <p className="text-sm font-black text-[#0d1b19] uppercase">
                                            {appointment.type}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12">
                        <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-4">Notes / Clinical Reason</h3>
                        <div className="p-6 bg-white border-2 border-[#f0f7f6] rounded-3xl min-h-[120px]">
                            <p className="text-sm text-[#0d1b19] leading-relaxed font-medium opacity-90">
                                {appointment.notes || 'No notes provided for this appointment.'}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <Card className="p-8 rounded-[32px] border-2 border-[#f0f7f6] bg-white shadow-sm">
                        <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-6">Patient Info</h3>
                        <div className="space-y-6">
                            <div 
                                className="flex justify-between items-center group cursor-pointer p-3 rounded-xl hover:bg-[#f0f7f6] transition-all"
                                onClick={() => navigate(`/patients/${appointment.patient_id}`)}
                            >
                                <div>
                                    <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">Full Name</p>
                                    <p className="text-sm font-black text-[#0d1b19] group-hover:text-[#4c9a8d] transition-all">
                                        {appointment.patient?.full_name}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-[#4c9a8d]">arrow_forward</span>
                            </div>
                            <div className="px-3">
                                <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">File Number</p>
                                <p className="text-sm font-black text-[#4c9a8d]">
                                    #{appointment.patient?.patient_id}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Status Card - Grounded Green Light */}
                    <Card className="p-8 rounded-[32px] border-none bg-slate-50 shadow-sm text-slate-900 border border-slate-100">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="material-symbols-outlined text-[#4c9a8d]">info</span>
                            <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest leading-none mt-1">Status Overview</h3>
                        </div>
                        <p className="text-[11px] font-bold text-slate-900 leading-relaxed mb-6">
                            Currently marked as <span className="underline font-black text-[#22c55e]">{appointment.status}</span>.
                        </p>
                        <div className="h-px bg-[#4c9a8d]/20 mb-6"></div>
                        <Button 
                            className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white border-none py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-green-500/20" 
                            icon="visibility"
                            onClick={() => navigate(`/patients/${appointment.patient_id}`)}
                        >
                            View Patient File
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};