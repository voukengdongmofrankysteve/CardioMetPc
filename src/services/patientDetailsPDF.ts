import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PatientDetails {
    patient_id: string;
    full_name: string;
    gender: string;
    dob: string;
    age: number;
    nationality: string;
    cni: string;
    weight: number;
    height: number;
    phone: string;
    email: string;
    address: string;
    ref_doctor: string;
    insurance: string;
    insurance_policy: string;
    consent: boolean;
    risk_factors: string[];
    emergency_contacts: { name: string; relationship: string; phone: string }[];
    created_at: string;
}

export const generatePatientDetailsPDF = (
    patient: PatientDetails,
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

    // Patient Info Section
    doc.setDrawColor(13, 148, 136);
    doc.setLineWidth(0.5);
    doc.line(15, 50, 195, 50);

    doc.setFontSize(16);
    doc.setTextColor(13, 148, 136);
    doc.text("Détails du Patient", 15, 60);

    doc.setFontSize(12);
    doc.setTextColor(0);
    let yOffset = 70;

    const addField = (label: string, value: string | number | boolean | undefined | null) => {
        if (value !== undefined && value !== null && value !== '') {
            doc.text(`${label}: ${value}`, 15, yOffset);
            yOffset += 7;
        }
    };

    addField("Nom Complet", patient.full_name);
    addField("ID Patient", patient.patient_id);
    addField("Genre", patient.gender);
    addField("Date de Naissance", patient.dob);
    addField("Âge", patient.age);
    addField("Nationalité", patient.nationality);
    addField("CNI", patient.cni);
    addField("Poids", `${patient.weight} kg`);
    addField("Taille", `${patient.height} cm`);
    addField("Téléphone", patient.phone);
    addField("Email", patient.email);
    addField("Adresse", patient.address);
    addField("Médecin Référent", patient.ref_doctor);
    addField("Assurance", patient.insurance);
    addField("Police d'Assurance", patient.insurance_policy);
    addField("Consentement", patient.consent ? "Oui" : "Non");
    addField("Date d'enregistrement", new Date(patient.created_at).toLocaleDateString('fr-FR'));

    // Risk Factors
    if (patient.risk_factors && patient.risk_factors.length > 0) {
        yOffset += 5;
        doc.setFontSize(14);
        doc.setTextColor(13, 148, 136);
        doc.text("Facteurs de Risque", 15, yOffset);
        yOffset += 7;
        doc.setFontSize(12);
        doc.setTextColor(0);
        patient.risk_factors.forEach(factor => {
            doc.text(`- ${factor}`, 20, yOffset);
            yOffset += 7;
        });
    }

    // Emergency Contacts
    if (patient.emergency_contacts && patient.emergency_contacts.length > 0) {
        yOffset += 5;
        doc.setFontSize(14);
        doc.setTextColor(13, 148, 136);
        doc.text("Contacts d'Urgence", 15, yOffset);
        yOffset += 7;
        doc.setFontSize(12);
        doc.setTextColor(0);
        autoTable(doc, {
            startY: yOffset,
            head: [['Nom', 'Relation', 'Téléphone']],
            body: patient.emergency_contacts.map(contact => [
                contact.name,
                contact.relationship,
                contact.phone
            ]),
            headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 4 },
            alternateRowStyles: { fillColor: [240, 253, 250] }, // Teal 50
        });
        yOffset = (doc as any).lastAutoTable.finalY + 5;
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("CardioMed Foundation - Votre cœur, notre priorité.", 105, 285, { align: "center" });

    doc.save(`Patient_${patient.full_name.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`);
};
