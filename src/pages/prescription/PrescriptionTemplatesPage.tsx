import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { prescriptionService } from '../../services/api';

interface TemplateMedication {
    id?: number;
    drug: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

interface PrescriptionTemplate {
    id: number;
    label: string;
    meds: TemplateMedication[];
}

export const PrescriptionTemplatesPage: React.FC = () => {
    const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<PrescriptionTemplate | null>(null);

    // Form state
    const [label, setLabel] = useState('');
    const [meds, setMeds] = useState<TemplateMedication[]>([]);

    // New med form state
    const [newMed, setNewMed] = useState<TemplateMedication>({
        drug: '', dosage: '', frequency: 'Once daily (QD)', duration: '', instructions: ''
    });

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const data = await prescriptionService.getTemplates();
            if (data && Array.isArray(data)) {
                // Map API medications to meds for frontend consistency if needed
                const formatted = data.map((t: any) => ({
                    id: t.id,
                    label: t.label,
                    meds: (t.medications || []).map((m: any) => ({
                        ...m,
                        drug: m.drug || m.name // map both
                    }))
                }));
                setTemplates(formatted);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const handleSaveTemplate = async () => {
        if (!label.trim()) return alert('Please enter a template label');
        if (meds.length === 0) return alert('Please add at least one medication');

        try {
            if (editingTemplate) {
                const result = await prescriptionService.updateTemplate(editingTemplate.id, label, meds);
                if (result && result.success !== false) {
                    setIsModalOpen(false);
                    loadTemplates();
                    resetForm();
                }
            } else {
                const result = await prescriptionService.saveTemplate(label, meds);
                if (result && result.success !== false) {
                    setIsModalOpen(false);
                    loadTemplates();
                    resetForm();
                }
            }
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Failed to save template');
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            await prescriptionService.deleteTemplate(id);
            loadTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Failed to delete template');
        }
    };

    const resetForm = () => {
        setLabel('');
        setMeds([]);
        setEditingTemplate(null);
        setNewMed({ drug: '', dosage: '', frequency: 'Once daily (QD)', duration: '', instructions: '' });
    };

    const addMedToTemplate = () => {
        if (!newMed.drug) return;
        setMeds([...meds, newMed]);
        setNewMed({ drug: '', dosage: '', frequency: 'Once daily (QD)', duration: '', instructions: '' });
    };

    const removeMedFromTemplate = (index: number) => {
        setMeds(meds.filter((_, i) => i !== index));
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-text-main tracking-tight">Modèles d'Ordonnance</h1>
                    <p className="text-primary font-bold mt-1">Gérez vos protocoles de prescription réutilisables</p>
                </div>
                <Button
                    icon="add"
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="bg-primary text-[#0d1b19] border-none px-6 h-12 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-105"
                >
                    Nouveau Modèle
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <Card key={template.id} className="p-6 border-border hover:border-primary/30 transition-all group overflow-hidden relative bg-white">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="size-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-bg-main transition-all duration-300">
                                    <span className="material-symbols-outlined text-2xl">description</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingTemplate(template);
                                            setLabel(template.label);
                                            setMeds(template.meds);
                                            setIsModalOpen(true);
                                        }}
                                        className="size-9 rounded-xl bg-white border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTemplate(template.id)}
                                        className="size-9 rounded-xl bg-white border border-border flex items-center justify-center text-text-muted hover:text-danger hover:border-danger/30 transition-all shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-black text-text-main mb-2 line-clamp-1">{template.label}</h3>
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-2 no-scrollbar">
                                {template.meds.map((med, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-bg-sidebar border border-transparent hover:border-primary/10 transition-all">
                                        <span className="size-1.5 rounded-full bg-primary/60 shrink-0"></span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black text-text-main truncate">{med.drug}</p>
                                            <p className="text-[9px] font-bold text-primary uppercase tracking-wider">{med.dosage} • {meds.find(m => m.drug === med.drug)?.frequency || 'QD'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Decorative background circle */}
                            <div className="absolute -bottom-8 -right-8 size-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
                        </Card>
                    ))}

                    {templates.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-[#e7f3f1] dark:border-[#1e3a36] rounded-[32px]">
                            <span className="material-symbols-outlined text-5xl text-[#4c9a8d]/20 mb-4">folder_off</span>
                            <p className="text-[#4c9a8d] font-bold">Aucun modèle trouvé. Créez votre premier modèle de prescription !</p>
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTemplate ? "Modifier le Modèle" : "Nouveau Modèle"}
                size="lg"
                
            >
                <div className="space-y-8 p-1 bg-white">
                    <Card className="p-6 border-border bg-white shadow-none">
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Détails du Modèle</h4>
                        <input
                            type="text"
                            className="w-full bg-white border border-border rounded-2xl py-4 px-6 text-sm font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                            placeholder="ex: Protocole Hypertension Sévère"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                    </Card>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Médicaments</h4>
                            <span className="text-[10px] font-black bg-primary-light text-primary px-2 py-0.5 rounded-full">{meds.length} total</span>
                        </div>

                        <div className="space-y-3">
                            {meds.map((m, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-white border border-border rounded-2xl group animate-in slide-in-from-right duration-300">
                                    <div className="size-10 rounded-xl bg-primary-light flex items-center justify-center text-primary shrink-0">
                                        <span className="material-symbols-outlined">medication</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-sm font-black text-text-main truncate">{m.drug}</h5>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{m.dosage} • {m.frequency} • {m.duration}</p>
                                    </div>
                                    <button
                                        onClick={() => removeMedFromTemplate(i)}
                                        className="size-8 rounded-lg text-text-muted hover:text-danger hover:bg-danger/5 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-xl">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <Card className="p-6 border-border shadow-sm bg-white">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 text-center">Ajouter un Médicament</h4>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Nom du médicament"
                                    className="w-full bg-white border border-border rounded-xl py-3 px-4 text-sm font-bold text-text-main focus:border-primary outline-none transition-all"
                                    value={newMed.drug}
                                    onChange={(e) => setNewMed({ ...newMed, drug: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Dosage (ex: 5mg)"
                                        className="w-full bg-white border border-border rounded-xl py-3 px-4 text-sm font-bold text-text-main focus:border-primary outline-none transition-all"
                                        value={newMed.dosage}
                                        onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                                    />
                                    <select
                                        className="w-full bg-white border border-border rounded-xl py-3 px-4 text-sm font-bold text-text-main focus:border-primary outline-none transition-all appearance-none"
                                        value={newMed.frequency}
                                        onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                                    >
                                        <option>Once daily (QD)</option>
                                        <option>Twice daily (BID)</option>
                                        <option>Three times daily (TID)</option>
                                        <option>As needed (PRN)</option>
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Durée (ex: 30 jours)"
                                    className="w-full bg-white border border-border rounded-xl py-3 px-4 text-sm font-bold text-text-main focus:border-primary outline-none transition-all"
                                    value={newMed.duration}
                                    onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
                                />
                                <textarea
                                    placeholder="Instructions spéciales"
                                    className="w-full bg-white border border-border rounded-xl py-3 px-4 text-sm font-bold text-text-main focus:border-primary outline-none transition-all h-20 resize-none"
                                    value={newMed.instructions}
                                    onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                                />
                                <Button
                                    variant="outline"
                                    onClick={addMedToTemplate}
                                    className="w-full h-12 rounded-xl text-primary border-primary/20 hover:bg-primary/5 font-black uppercase tracking-widest text-[10px]"
                                >
                                    Ajouter à la liste
                                </Button>
                            </div>
                        </Card>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 h-14 rounded-2xl border-border text-text-muted font-black uppercase tracking-widest text-xs hover:bg-bg-sidebar transition-all"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSaveTemplate}
                            className="flex-[2] h-14 rounded-2xl bg-primary text-bg-main border-none font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:bg-primary-hover hover:scale-[1.02] transition-all"
                        >
                            {editingTemplate ? "Mettre à jour" : "Créer le Modèle"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
