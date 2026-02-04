import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DatabaseService } from '../../services/database';

interface AppointmentDetailsProps {
    appointmentId: number;
    onBack: () => void;
}

export const AppointmentDetailsPage: React.FC<AppointmentDetailsProps> = ({ appointmentId, onBack }) => {
    const [appointment, setAppointment] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadAppointment();
    }, [appointmentId]);

    const loadAppointment = async () => {
        setIsLoading(true);
        try {
            const data = await DatabaseService.getAppointmentById(appointmentId);
            setAppointment(data);
        } catch (error) {
            console.error('Failed to load appointment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        setIsUpdating(true);
        try {
            await DatabaseService.updateAppointmentStatus(appointmentId, newStatus);
            await loadAppointment(); // Refresh
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f6f8f8] dark:bg-[#101f22]">
                <div className="text-primary font-black animate-pulse">LOADING DETAILS...</div>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="p-8">
                <Button onClick={onBack} icon="arrow_back">Back to Calendar</Button>
                <p className="mt-8 text-red-500 font-bold">Appointment not found.</p>
            </div>
        );
    }

    const statusOptions = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No Show'];

    return (
        <div className="min-h-screen bg-[#f6f8f8] dark:bg-[#101f22] p-8">
            <header className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <Button variant="outline" onClick={onBack} icon="arrow_back" className="rounded-2xl h-12 w-12 border-none bg-white dark:bg-[#152a26] text-[#4c9a8d] shadow-sm hover:shadow-md transition-all">
                        {""}
                    </Button>
                    <div>
                        <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-1">Appointment Details</p>
                        <h1 className="text-3xl font-black text-[#0d1b19] dark:text-white tracking-tighter">
                            {appointment.patient_name}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-1 text-right">Update Status</span>
                        <div className="flex gap-2">
                            {statusOptions.map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusUpdate(status)}
                                    disabled={isUpdating}
                                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${appointment.status === status
                                        ? 'bg-primary border-primary text-[#0d1b19] shadow-lg shadow-primary/20'
                                        : 'bg-white dark:bg-[#152a26] border-[#e7f3f1] dark:border-[#1e3a36] text-[#4c9a8d] hover:border-primary/50'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-8 rounded-[32px] border-none shadow-sm hover:shadow-md transition-all h-fit">
                    <div className="grid grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-4">Time & Date</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-[#f6f8f8] dark:bg-[#101f22] rounded-2xl">
                                    <span className="material-symbols-outlined text-primary">calendar_today</span>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">Date</p>
                                        <p className="text-sm font-black text-[#0d1b19] dark:text-white">
                                            {new Date(appointment.appointment_date).toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-[#f6f8f8] dark:bg-[#101f22] rounded-2xl">
                                    <span className="material-symbols-outlined text-primary">schedule</span>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">Time</p>
                                        <p className="text-xl font-black text-[#0d1b19] dark:text-white">
                                            {appointment.appointment_time.substring(0, 5)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-4">Healthcare Professionals</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-[#f6f8f8] dark:bg-[#101f22] rounded-2xl">
                                    <span className="material-symbols-outlined text-purple-500">medical_services</span>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">Doctor Assigned</p>
                                        <p className="text-sm font-black text-[#0d1b19] dark:text-white">
                                            {appointment.doctor_name || 'Not assigned'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-[#f6f8f8] dark:bg-[#101f22] rounded-2xl">
                                    <span className="material-symbols-outlined text-orange-400">category</span>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">Appointment Type</p>
                                        <p className="text-sm font-black text-[#0d1b19] dark:text-white uppercase tracking-tighter">
                                            {appointment.type}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-[#f6f8f8] dark:bg-[#101f22] rounded-2xl">
                                    <span className="material-symbols-outlined text-blue-400">share</span>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">Source (Posted By)</p>
                                        <p className="text-sm font-black text-[#0d1b19] dark:text-white uppercase tracking-tighter">
                                            {appointment.posted_by || 'Hospital'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12">
                        <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-4 font-black">Notes / Clinical Reason</h3>
                        <div className="p-6 bg-[#f6f8f8] dark:bg-[#101f22] rounded-3xl min-h-[120px]">
                            <p className="text-sm text-[#0d1b19] dark:text-white leading-relaxed font-bold opacity-80">
                                {appointment.notes || 'No notes provided for this appointment.'}
                            </p>
                        </div>
                    </div>
                </Card>

                <div className="space-y-8">
                    <Card className="p-8 rounded-[32px] border-none shadow-sm hover:shadow-md transition-all">
                        <h3 className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-6">Patient Info</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center group cursor-pointer">
                                <div>
                                    <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">Full Name</p>
                                    <p className="text-sm font-black text-[#0d1b19] dark:text-white group-hover:text-primary transition-all">
                                        {appointment.patient_name}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-all">arrow_forward</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">File Number</p>
                                <p className="text-sm font-black text-primary">
                                    {appointment.patient_file_id}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 rounded-[32px] border-none bg-primary shadow-lg shadow-primary/20">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="material-symbols-outlined text-[#0d1b19]">info</span>
                            <h3 className="text-[10px] font-black text-[#0d1b19] uppercase tracking-widest leading-none mt-1">Status Overview</h3>
                        </div>
                        <p className="text-[11px] font-bold text-[#0d1b19] leading-relaxed mb-6">
                            This appointment is currently marked as <span className="underline">{appointment.status}</span>. You can change this using the controls above.
                        </p>
                        <div className="h-px bg-[#0d1b19]/10 mb-6"></div>
                        <Button className="w-full bg-[#0d1b19] text-white border-none py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:brightness-110" icon="patient_list">
                            View Patient File
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};
