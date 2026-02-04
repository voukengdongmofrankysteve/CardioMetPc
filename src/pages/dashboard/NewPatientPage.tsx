import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { DatabaseService } from '../../services/database';

interface NewPatientPageProps {
    onBack: () => void;
    onCancel: () => void;
}

export const NewPatientPage: React.FC<NewPatientPageProps> = ({ onBack, onCancel }) => {
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
            const patientId = `#FCE-${Math.floor(1000 + Math.random() * 9000)}`;
            const submissionData = {
                ...formData,
                patient_id: patientId,
                emergency_contacts: emergencyContacts.filter(c => c.name),
                risk_factors: riskFactors.filter(r => r.selected).map(r => r.label)
            };

            await DatabaseService.createPatient(submissionData);
            onBack(); // Go back to list on success
        } catch (err) {
            console.error('Failed to save patient:', err);
            alert('Erreur lors de l\'enregistrement du patient.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 bg-[#f6f8f8] dark:bg-[#10221f] overflow-y-auto font-sans text-[#0d1b19] dark:text-white">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between bg-white/80 dark:bg-[#152a26]/80 backdrop-blur-md border-b border-[#e7f3f1] dark:border-[#1e3a36] px-8 py-3 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center text-[#4c9a8d] hover:text-[#42f0d3] transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-[#0d1b19] dark:text-white text-lg font-bold tracking-tight">Enregistrer un Nouveau Patient</h2>
                </div>
            </header>

            <div className="p-8 max-w-5xl mx-auto w-full text-left">
                <div className="mb-8">
                    <h1 className="text-[#0d1b19] dark:text-white text-3xl font-black tracking-tight mb-2">Inscription de Patient</h1>
                    <p className="text-[#4c9a8d] text-base font-medium">Remplissez les informations ci-dessous pour créer un nouveau dossier médical.</p>
                </div>

                <form className="space-y-8" onSubmit={handleSubmit}>
                    {/* Personal Information */}
                    <div className="bg-white dark:bg-[#152a26] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[#f8fbfc] dark:bg-white/5 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#42f0d3]">person</span>
                            <h3 className="font-bold text-[#0d1b19] dark:text-white uppercase tracking-wider text-sm">Informations Personnelles</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Nom Complet (Nom, Prénom)</label>
                                <input
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                                    placeholder="ex: EBOGO Titus"
                                    type="text"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Genre</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white"
                                    required
                                >
                                    <option value="">Sélectionner</option>
                                    <option value="Male">Homme</option>
                                    <option value="Female">Femme</option>
                                    <option value="Other">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Date de Naissance</label>
                                <input
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white"
                                    type="date"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Nationalité</label>
                                <input
                                    name="nationality"
                                    value={formData.nationality}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                                    placeholder="Camerounaise"
                                    type="text"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">N° CNI</label>
                                <input
                                    name="cni"
                                    value={formData.cni}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                                    placeholder="000000000"
                                    type="text"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Âge</label>
                                <input
                                    name="age"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                                    placeholder="ex: 45"
                                    type="number"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Taille (cm)</label>
                                <input
                                    name="height"
                                    value={formData.height}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                                    placeholder="ex: 175"
                                    type="number"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Poids (kg)</label>
                                <input
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                                    placeholder="ex: 70"
                                    type="number"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="bg-white dark:bg-[#152a26] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[#f8fbfc] dark:bg-white/5 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#42f0d3]">contact_phone</span>
                            <h3 className="font-bold text-[#0d1b19] dark:text-white uppercase tracking-wider text-sm">Coordonnées</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Téléphone</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                                    placeholder="670 000 000"
                                    type="tel"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Email (Optionnel)</label>
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                                    placeholder="patient@example.com"
                                    type="email"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Adresse de Résidence</label>
                                <input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                                    placeholder="Quartier, Rue, Ville"
                                    type="text"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-white dark:bg-[#152a26] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[#f8fbfc] dark:bg-white/5 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-500">emergency_share</span>
                                <h3 className="font-bold text-[#0d1b19] dark:text-white uppercase tracking-wider text-sm">Contact d'Urgence</h3>
                            </div>
                            <button
                                type="button"
                                onClick={addEmergencyContact}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                                <span className="material-symbols-outlined text-sm">add</span> Ajouter un contact
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {emergencyContacts.map((contact, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Nom (Contact {index + 1})</label>
                                        <input
                                            value={contact.name}
                                            onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                            className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                                            placeholder="Nom complet"
                                            type="text"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Lien de Parenté</label>
                                        <input
                                            value={contact.relationship}
                                            onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                                            className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                                            placeholder="ex: Conjoint(e), Enfant..."
                                            type="text"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Téléphone</label>
                                        <input
                                            value={contact.phone}
                                            onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                            className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                                            placeholder="ex: 699 999 999"
                                            type="tel"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Risk Factors */}
                    <div className="bg-white dark:bg-[#152a26] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[#f8fbfc] dark:bg-white/5 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-500">warning</span>
                            <h3 className="font-bold text-[#0d1b19] dark:text-white uppercase tracking-wider text-sm">Facteurs de Risque</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {riskFactors.map((risk, index) => (
                                <label key={risk.id} className="flex items-center gap-3 p-4 bg-[#f6f8f8] dark:bg-[#10221f] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] hover:border-orange-500/30 transition-all cursor-pointer group animate-in fade-in zoom-in duration-300">
                                    <input
                                        type="checkbox"
                                        checked={risk.selected}
                                        onChange={() => toggleRiskFactor(index)}
                                        className="size-5 rounded-lg text-orange-500 focus:ring-orange-500 bg-white dark:bg-[#1e3a36] border-[#e7f3f1] dark:border-[#1e3a36]"
                                    />
                                    <span className="text-xs font-black uppercase tracking-tight text-[#4c9a8d] group-hover:text-orange-500 transition-colors">{risk.label}</span>
                                </label>
                            ))}

                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#152a26] rounded-2xl border border-dashed border-[#e7f3f1] dark:border-[#1e3a36] focus-within:border-orange-500 transition-all h-[58px]">
                                <input
                                    type="text"
                                    value={newRiskLabel}
                                    onChange={(e) => setNewRiskLabel(e.target.value)}
                                    placeholder="Autre risque..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/30"
                                />
                                <button
                                    type="button"
                                    onClick={addRiskFactor}
                                    className="size-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm font-black">add</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Administrative Data */}
                    <div className="bg-white dark:bg-[#152a26] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[#f8fbfc] dark:bg-white/5 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#42f0d3]">admin_panel_settings</span>
                            <h3 className="font-bold text-[#0d1b19] dark:text-white uppercase tracking-wider text-sm">Données Administratives</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Médecin Référent</label>
                                <input
                                    name="ref_doctor"
                                    value={formData.ref_doctor}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
                                    placeholder="Dr. Nom"
                                    type="text"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">Assurance</label>
                                <select
                                    name="insurance"
                                    value={formData.insurance}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white"
                                >
                                    <option value="none">Aucune / Privé</option>
                                    <option value="axa">AXA Assurance</option>
                                    <option value="allianz">Allianz</option>
                                    <option value="other">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] mb-1.5 ml-1">N° Police</label>
                                <input
                                    name="insurance_policy"
                                    value={formData.insurance_policy}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-xl border-[#e7f3f1] dark:border-[#1e3a36] bg-[#f6f8f8] dark:bg-[#10221f] h-12 px-4 text-sm font-bold focus:border-[#42f0d3] focus:ring-[#42f0d3]/20 transition-all text-[#0d1b19] dark:text-white placeholder:text-[#4c9a8d]/50"
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
                                        className="w-5 h-5 text-primary border-[#e7f3f1] dark:border-[#1e3a36] rounded-lg focus:ring-primary/20 bg-[#f6f8f8] dark:bg-[#10221f] transition-all"
                                        type="checkbox"
                                    />
                                    <span className="text-sm text-[#4c9a8d] font-bold group-hover:text-primary transition-colors leading-snug">Le patient consent au stockage électronique de ses données médicales conformément à la politique de confidentialité.</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pb-12">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-[#4c9a8d] hover:bg-[#42f0d3]/10 hover:text-primary transition-all uppercase tracking-widest"
                        >
                            Annuler
                        </button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="px-8 h-12 bg-[#42f0d3] text-[#0d1b19] font-black uppercase tracking-wider"
                            icon={isSaving ? 'sync' : 'save'}
                        >
                            {isSaving ? 'Enregistrement...' : 'Enregistrer le Patient'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
