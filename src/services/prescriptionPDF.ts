import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PrescriptionItem {
    id: number;
    drug: string;
    dosage: string;
    frequency: string;
    duration: string;
}

export interface PatientInfo {
    name: string;
    age?: number | string;
    gender?: string;
    weight?: string;
}

export const generatePrescriptionPDF = (
    patient: PatientInfo,
    prescriptions: PrescriptionItem[],
    doctorName: string = "Dr. Cyrille Mbida"
) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136); // Teal 600
    doc.text("CardioMed Foundation", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Centre Spécialisé de Cardiologie", 105, 26, { align: "center" });
    doc.text("Yaoundé, Cameroun | Tél: (+237) 699 99 99 99", 105, 31, { align: "center" });

    // Doctor Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Médecin: ${doctorName}`, 15, 45);
    doc.text(`Date: ${date}`, 160, 45);

    // Patient Info
    doc.setDrawColor(13, 148, 136);
    doc.setLineWidth(0.5);
    doc.line(15, 50, 195, 50);

    doc.setFontSize(12);
    doc.text(`Patient: ${patient.name}`, 15, 60);
    if (patient.age) doc.text(`Âge: ${patient.age} ans`, 120, 60);
    if (patient.weight) doc.text(`Poids: ${patient.weight} kg`, 160, 60);

    // Rx Symbol
    doc.setFontSize(24);
    doc.setTextColor(13, 148, 136);
    doc.text("Rx", 15, 75);

    // Table
    autoTable(doc, {
        startY: 85,
        head: [['Médicament', 'Posologie', 'Fréquence', 'Durée']],
        body: prescriptions.map(p => [
            p.drug,
            p.dosage,
            p.frequency,
            p.duration
        ]),
        headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        alternateRowStyles: { fillColor: [240, 253, 250] }, // Teal 50
    });

    // Signature
    const finalY = (doc as any).lastAutoTable.finalY || 150;

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Signature & Cachet:", 140, finalY + 30);
    doc.line(140, finalY + 50, 190, finalY + 50);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("CardioMed Foundation - Votre cœur, notre priorité.", 105, 285, { align: "center" });

    doc.save(`Ordonnance_${patient.name.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`);
};
