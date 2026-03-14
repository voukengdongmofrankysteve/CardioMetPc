import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { patientService } from '../../services/api';

export const NewPatientPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: patientId } = useParams<{ id: string }>();

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        gender: '',
        dob: '',
        nationality: 'Camerounaise',
        cni: '',
        age: '',
        weight: '',
        height: '',
        phone: '',
        email: '',
        address: '',
        ref_doctor: '',
        insurance: 'none',
        insurance_policy: '',
        consent: false
    });

    const [riskFactors, setRiskFactors] = useState([
        { label: 'Hypertension', id: 'risk-hta', selected: false },
        { label: 'Diabète', id: 'risk-diabetes', selected: false },
        { label: 'Fumeur', id: 'risk-smoker', selected: false },
        { label: 'Sédentaire', id: 'risk-sedentary', selected: false }
    ]);
    const [newRiskLabel, setNewRiskLabel] = useState('');

    const [emergencyContacts, setEmergencyContacts] = useState([
        { name: '', relationship: '', phone: '' }
    ]);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadPatient = async () => {
            if (patientId) {
                setIsLoading(true);
                try {
                    const dbId = parseInt(patientId);
                    if (!isNaN(dbId)) {
                        const patient = await patientService.getPatientById(dbId);
                        if (patient) {
                            setFormData({
                                full_name: patient.full_name || '',
                                gender: patient.gender || '',
                                dob: patient.dob || '',
                                nationality: patient.nationality || 'Camerounaise',
                                cni: patient.cni || '',
                                age: patient.age?.toString() || '',
                                weight: patient.weight?.toString() || '',
                                height: patient.height?.toString() || '',
                                phone: patient.phone || '',
                                email: patient.email || '',
                                address: patient.address || '',
                                ref_doctor: patient.ref_doctor || '',
                                insurance: patient.insurance || 'none',
                                insurance_policy: patient.insurance_policy || '',
                                consent: patient.consent === 1
                            });

                            if (patient.emergency_contacts && Array.isArray(patient.emergency_contacts)) {
                                setEmergencyContacts(patient.emergency_contacts.map((c: any) => ({
                                    name: c.name || '',
                                    relationship: c.relationship || '',
                                    phone: c.phone || ''
                                })));
                            }

                            if (patient.risk_factors && Array.isArray(patient.risk_factors)) {
                                setRiskFactors(prev => {
                                    const updated = prev.map(r => ({
                                        ...r,
                                        selected: patient.risk_factors.includes(r.label)
                                    }));

                                    patient.risk_factors.forEach((factor: string) => {
                                        if (!updated.find(r => r.label === factor)) {
                                            updated.push({
                                                label: factor,
                                                id: `risk-custom-${Date.now()}-${Math.random()}`,
                                                selected: true
                                            });
                                        }
                                    });
                                    return updated;
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error("Failed to load patient", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadPatient();
    }, [patientId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const toggleRiskFactor = (index: number) => {
        const updated = [...riskFactors];
        updated[index].selected = !updated[index].selected;
        setRiskFactors(updated);
    };

    const addRiskFactor = () => {
        if (newRiskLabel.trim() && !riskFactors.find(r => r.label === newRiskLabel.trim())) {
            setRiskFactors([...riskFactors, {
                label: newRiskLabel.trim(),
                id: `risk-custom-${Date.now()}`,
                selected: true
            }]);
            setNewRiskLabel('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const submissionData = {
                ...formData,
                emergency_contacts: emergencyContacts.filter(c => c.name),
                risk_factors: riskFactors.filter(r => r.selected).map(r => r.label)
            };

            if (patientId) {
                await patientService.updatePatient(parseInt(patientId), submissionData);
            } else {
                const generatedId = `#FCE-${Math.floor(1000 + Math.random() * 9000)}`;
                const dataToCreate = { ...submissionData, patient_id: generatedId };
                await patientService.createPatient(dataToCreate);
            }
            navigate('/patients');
        } catch (err) {
            console.error('Failed to save patient:', err);
            alert('Erreur lors de l\'enregistrement du patient.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-white">
                <div className="text-emerald-600 font-bold animate-pulse uppercase tracking-wider text-sm">Chargement du dossier...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 bg-white overflow-y-auto font-sans text-slate-900 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between bg-white border-b border-slate-100 px-8 py-4 shrink-0 shadow-sm">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-emerald-600 hover:text-emerald-700 transition-colors active:scale-95"
                    >
                        <span className="material-symbols-outlined font-black">arrow_back</span>
                    </button>
                    <h2 className="text-slate-900 text-lg font-black tracking-tight uppercase">
                        {patientId ? 'Mise à jour Dossier' : 'Nouveau Dossier Patient'}
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Session Médicale Active</span>
                </div>
            </header>

            <div className="p-8 max-w-6xl mx-auto w-full text-left">
                <div className="mb-10">
                    <h1 className="text-slate-900 text-4xl font-black tracking-tight mb-2 uppercase">
                        {patientId ? 'Modifier Patient' : 'Inscription Patient'}
                    </h1>
                    <p className="text-emerald-600 text-sm font-semibold uppercase tracking-wider">
                        Veuillez renseigner les métriques de santé ci-dessous
                    </p>
                </div>

                <form className="space-y-10" onSubmit={handleSubmit}>
                    {/* Identification Section */}
                    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden group">
                        <div className="px-8 py-5 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-3">
                            <div className="size-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <span className="material-symbols-outlined text-lg">badge</span>
                            </div>
                            <h3 className="font-bold text-emerald-800 uppercase tracking-wider text-xs">Identification du Patient</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-8">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5 ml-0.5">Nom Complet</label>
                                <input
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/70 h-12 px-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    placeholder="ex: Jean Dupont"
                                    type="text"
                                    required
                                />
                            </div>
                            <div className="md:col-span-4">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5 ml-0.5">Genre</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/70 h-12 px-4 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer appearance-none"
                                    required
                                >
                                    <option value="">Sélectionner</option>
                                    <option value="Male">Masculin</option>
                                    <option value="Female">Féminin</option>
                                    <option value="Other">Autre</option>
                                </select>
                            </div>
                            <div className="md:col-span-4">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5 ml-0.5">Date de Naissance</label>
                                <input
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/70 h-12 px-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    type="date"
                                    required
                                />
                            </div>
                            <div className="md:col-span-4">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5 ml-0.5">Âge</label>
                                <input
                                    name="age"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/70 h-12 px-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    placeholder="ex: 45"
                                    type="number"
                                />
                            </div>
                             <div className="md:col-span-4">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5 ml-0.5">N° CNI / Passport</label>
                                <input
                                    name="cni"
                                    value={formData.cni}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/70 h-12 px-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    placeholder="123456789"
                                    type="text"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-3">
                            <div className="size-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <span className="material-symbols-outlined text-lg">alternate_email</span>
                            </div>
                            <h3 className="font-bold text-emerald-800 uppercase tracking-wider text-xs">Contact & Résidence</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5 ml-0.5">Téléphone</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/70 h-12 px-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    placeholder="+237 ..."
                                    type="tel"
                                    required
                                />
                            </div>
                             <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5 ml-0.5">Email</label>
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/70 h-12 px-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    placeholder="patient@email.com"
                                    type="email"
                                />
                            </div>
                             <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5 ml-0.5">Adresse</label>
                                <input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/70 h-12 px-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                    placeholder="Quartier, Rue, Ville"
                                    type="text"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Risk Factors Section */}
                    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-3">
                            <div className="size-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <span className="material-symbols-outlined text-lg">bolt</span>
                            </div>
                            <h3 className="font-bold text-emerald-800 uppercase tracking-wider text-xs">Facteurs de Risque</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {riskFactors.map((risk, index) => (
                                <label key={risk.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${risk.selected ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200'}`}>
                                    <input
                                        type="checkbox"
                                        checked={risk.selected}
                                        onChange={() => toggleRiskFactor(index)}
                                        className="hidden"
                                    />
                                    <div className={`size-5 rounded-md border-2 flex items-center justify-center transition-all ${risk.selected ? 'bg-emerald-600 border-emerald-600' : 'border-emerald-300'}`}>
                                        {risk.selected && <span className="material-symbols-outlined text-[10px] text-white font-black">check</span>}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-tight ${risk.selected ? 'text-emerald-800' : 'text-slate-600'}`}>{risk.label}</span>
                                </label>
                            ))}

                            <div className="flex items-center gap-2 p-2 bg-emerald-50/70 rounded-xl border-2 border-dashed border-emerald-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all h-12">
                                <input
                                    type="text"
                                    value={newRiskLabel}
                                    onChange={(e) => setNewRiskLabel(e.target.value)}
                                    placeholder="Ajouter un facteur..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none px-2"
                                />
                                <button
                                    type="button"
                                    onClick={addRiskFactor}
                                    className="size-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined font-black">add</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-6 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-8 py-4 rounded-xl text-xs font-black text-slate-400 hover:text-red-500 transition-all uppercase tracking-[0.2em]"
                        >
                            Annuler
                        </button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="px-10 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider shadow-md shadow-emerald-200/50 transition-all w-full md:w-auto rounded-xl"
                            icon={isSaving ? 'sync' : 'check_circle'}
                        >
                            {isSaving ? 'Traitement...' : (patientId ? 'Enregistrer les modifications' : 'Valider le dossier')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};