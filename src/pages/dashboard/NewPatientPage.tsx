import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { DatabaseService } from '../../services/database';

interface NewPatientPageProps {
    onBack: () => void;
    onCancel: () => void;
    patientId?: string;
}

export const NewPatientPage: React.FC<NewPatientPageProps> = ({ onBack, onCancel, patientId }) => {
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

    useEffect(() => {
        const loadPatient = async () => {
            if (patientId) {
                try {
                    const dbId = parseInt(patientId);
                    if (!isNaN(dbId)) {
                        const patient = await DatabaseService.getPatientById(dbId);
                        if (patient) {
                            setFormData({
                                full_name: patient.full_name,
                                gender: patient.gender,
                                dob: patient.dob,
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

                            if (patient.emergency_contacts && patient.emergency_contacts.length > 0) {
                                setEmergencyContacts(patient.emergency_contacts.map((c: any) => ({
                                    name: c.name,
                                    relationship: c.relationship,
                                    phone: c.phone
                                })));
                            }

                            if (patient.risk_factors && patient.risk_factors.length > 0) {
                                setRiskFactors(prev => {
                                    const updated = prev.map(r => ({
                                        ...r,
                                        selected: patient.risk_factors.includes(r.label)
                                    }));

                                    // Add custom risks not in default list
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

    const handleContactChange = (index: number, field: string, value: string) => {
        const updated = [...emergencyContacts];
        (updated[index] as any)[field] = value;
        setEmergencyContacts(updated);
    };

    const addEmergencyContact = () => {
        setEmergencyContacts([...emergencyContacts, { name: '', relationship: '', phone: '' }]);
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
            // Generate new ID only if creating a new patient
            const generatedId = `#FCE-${Math.floor(1000 + Math.random() * 9000)}`;

            const submissionData = {
                ...formData,
                patient_id: patientId ? undefined : generatedId, // Only set patient_id if creating
                emergency_contacts: emergencyContacts.filter(c => c.name),
                risk_factors: riskFactors.filter(r => r.selected).map(r => r.label)
            };

            if (patientId) {
                // patientId prop is the DB ID (stringified number)
                await DatabaseService.updatePatient(parseInt(patientId), submissionData);
            } else {
                // For creation, we need patient_id in data
                const dataToCreate = { ...submissionData, patient_id: generatedId };
                await DatabaseService.createPatient(dataToCreate);
            }
            onBack(); // Go back to list on success
        } catch (err) {
            console.error('Failed to save patient:', err);
            alert('Erreur lors de l\'enregistrement du patient.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] overflow-y-auto font-sans text-[var(--color-text-main)] dark:text-white">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between bg-[var(--color-bg-surface)]/80 dark:bg-[var(--color-dark-bg-surface)]/80 backdrop-blur-md border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] px-8 py-3 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-[var(--color-text-main)] dark:text-white text-lg font-bold tracking-tight">{patientId ? 'Modifier le Patient' : 'Enregistrer un Nouveau Patient'}</h2>
                </div>
            </header>

            <div className="p-8 max-w-5xl mx-auto w-full text-left">
                <div className="mb-8">
                    <h1 className="text-[var(--color-text-main)] dark:text-white text-3xl font-black tracking-tight mb-2">{patientId ? 'Modification de Patient' : 'Inscription de Patient'}</h1>
                    <p className="text-[var(--color-text-muted)] text-base font-medium">{patientId ? 'Mettez à jour les informations du dossier médical.' : 'Remplissez les informations ci-dessous pour créer un nouveau dossier médical.'}</p>
                </div>

                <form className="space-y-8" onSubmit={handleSubmit}>
                    {/* Personal Information */}
                    <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[var(--color-bg-main)] dark:bg-white/5 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[var(--color-primary)]">person</span>
                            <h3 className="font-bold text-[var(--color-text-main)] dark:text-white uppercase tracking-wider text-sm">Informations Personnelles</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Nom Complet (Nom, Prénom)</label>
                                <input
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                    placeholder="ex: Cyrille Mbida"
                                    type="text"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Genre</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white"
                                    required
                                >
                                    <option value="">Sélectionner</option>
                                    <option value="Male">Homme</option>
                                    <option value="Female">Femme</option>
                                    <option value="Other">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Date de Naissance</label>
                                <input
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white"
                                    type="date"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Nationalité</label>
                                <input
                                    name="nationality"
                                    value={formData.nationality}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                    placeholder="Camerounaise"
                                    type="text"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">N° CNI</label>
                                <input
                                    name="cni"
                                    value={formData.cni}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                    placeholder="000000000"
                                    type="text"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Âge</label>
                                <input
                                    name="age"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                    placeholder="ex: 45"
                                    type="number"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Taille (cm)</label>
                                <input
                                    name="height"
                                    value={formData.height}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                    placeholder="ex: 175"
                                    type="number"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Poids (kg)</label>
                                <input
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                    placeholder="ex: 70"
                                    type="number"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[var(--color-bg-main)] dark:bg-white/5 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[var(--color-primary)]">contact_phone</span>
                            <h3 className="font-bold text-[var(--color-text-main)] dark:text-white uppercase tracking-wider text-sm">Coordonnées</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Téléphone</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                    placeholder="670 000 000"
                                    type="tel"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Email (Optionnel)</label>
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                    placeholder="patient@example.com"
                                    type="email"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Adresse de Résidence</label>
                                <input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                    placeholder="Quartier, Rue, Ville"
                                    type="text"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[var(--color-bg-main)] dark:bg-white/5 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[var(--color-danger)]">emergency_share</span>
                                <h3 className="font-bold text-[var(--color-text-main)] dark:text-white uppercase tracking-wider text-sm">Contact d'Urgence</h3>
                            </div>
                            <button
                                type="button"
                                onClick={addEmergencyContact}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                                <span className="material-symbols-outlined text-sm">add</span> Ajouter un contact
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {emergencyContacts.map((contact, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Nom (Contact {index + 1})</label>
                                        <input
                                            value={contact.name}
                                            onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                            className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                            placeholder="Nom complet"
                                            type="text"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Lien de Parenté</label>
                                        <input
                                            value={contact.relationship}
                                            onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                                            className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                            placeholder="ex: Conjoint(e), Enfant..."
                                            type="text"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Téléphone</label>
                                        <input
                                            value={contact.phone}
                                            onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                            className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                            placeholder="ex: 699 999 999"
                                            type="tel"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Risk Factors */}
                    <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[var(--color-bg-main)] dark:bg-white/5 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[var(--color-warning)]">warning</span>
                            <h3 className="font-bold text-[var(--color-text-main)] dark:text-white uppercase tracking-wider text-sm">Facteurs de Risque</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {riskFactors.map((risk, index) => (
                                <label key={risk.id} className="flex items-center gap-3 p-4 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] hover:border-[var(--color-warning)]/30 transition-all cursor-pointer group animate-in fade-in zoom-in duration-300">
                                    <input
                                        type="checkbox"
                                        checked={risk.selected}
                                        onChange={() => toggleRiskFactor(index)}
                                        className="size-5 rounded-lg text-[var(--color-warning)] focus:ring-[var(--color-warning)] bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] border-[var(--color-border)] dark:border-[var(--color-dark-border)]"
                                    />
                                    <span className="text-xs font-black uppercase tracking-tight text-[var(--color-text-muted)] group-hover:text-[var(--color-warning)] transition-colors">{risk.label}</span>
                                </label>
                            ))}

                            <div className="flex items-center gap-2 p-2 bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl border border-dashed border-[var(--color-border)] dark:border-[var(--color-dark-border)] focus-within:border-[var(--color-warning)] transition-all h-[58px]">
                                <input
                                    type="text"
                                    value={newRiskLabel}
                                    onChange={(e) => setNewRiskLabel(e.target.value)}
                                    placeholder="Autre risque..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/30"
                                />
                                <button
                                    type="button"
                                    onClick={addRiskFactor}
                                    className="size-8 rounded-xl bg-[var(--color-warning)]/10 text-[var(--color-warning)] flex items-center justify-center hover:bg-[var(--color-warning)] hover:text-white transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm font-black">add</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Administrative Data */}
                    <div className="bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[var(--color-bg-main)] dark:bg-white/5 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[var(--color-primary)]">admin_panel_settings</span>
                            <h3 className="font-bold text-[var(--color-text-main)] dark:text-white uppercase tracking-wider text-sm">Données Administratives</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Médecin Référent</label>
                                <input
                                    name="ref_doctor"
                                    value={formData.ref_doctor}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                    placeholder="Dr. Nom"
                                    type="text"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">Assurance</label>
                                <select
                                    name="insurance"
                                    value={formData.insurance}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white"
                                >
                                    <option value="none">Aucune / Privé</option>
                                    <option value="axa">AXA Assurance</option>
                                    <option value="allianz">Allianz</option>
                                    <option value="other">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 ml-1">N° Police</label>
                                <input
                                    name="insurance_policy"
                                    value={formData.insurance_policy}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] h-12 px-4 text-sm font-bold focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-main)] dark:text-white placeholder:text-[var(--color-text-muted)]/50"
                                    placeholder="P-0000000"
                                    type="text"
                                />
                            </div>
                            <div className="lg:col-span-3">
                                <label className="flex items-center gap-3 cursor-pointer group px-1">
                                    <input
                                        name="consent"
                                        checked={formData.consent}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-[var(--color-primary)] border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-lg focus:ring-[var(--color-primary)]/20 bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg-main)] transition-all"
                                        type="checkbox"
                                    />
                                    <span className="text-sm text-[var(--color-text-muted)] font-bold group-hover:text-[var(--color-primary)] transition-colors leading-snug">Le patient consent au stockage électronique de ses données médicales conformément à la politique de confidentialité.</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pb-12">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-primary-light)]/20 hover:text-[var(--color-primary)] transition-all uppercase tracking-widest"
                        >
                            Annuler
                        </button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="px-8 h-12 bg-[var(--color-primary)] text-white font-black uppercase tracking-wider"
                            icon={isSaving ? 'sync' : 'save'}
                        >
                            {isSaving ? 'Enregistrement...' : (patientId ? 'Mettre à jour' : 'Enregistrer le Patient')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
