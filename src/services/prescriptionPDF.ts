import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define the PrescriptionGroup interface (copied from PatientDetailsPage.tsx for now)
export interface PrescriptionGroup {
    id: string | number;
    date: string;
    meds: string[];
    status: string;
}

// Design Tokens (re-using from patientDetailsPDF.ts for consistency)
const COLORS = {
    primary:    [13,  148, 136] as [number, number, number],  // Teal 600
    primaryLight:[204, 240, 237] as [number, number, number], // Teal 100
    accent:     [15,  118, 110] as [number, number, number],  // Teal 700
    dark:       [17,  24,  39]  as [number, number, number],  // Gray 900
    muted:      [107, 114, 128] as [number, number, number],  // Gray 500
    light:      [249, 250, 251] as [number, number, number],  // Gray 50
    white:      [255, 255, 255] as [number, number, number],
    danger:     [220, 38,  38]  as [number, number, number],  // Red 600
    dangerLight:[254, 226, 226] as [number, number, number],  // Red 100
};

const PAGE = { w: 210, h: 297, margin: 14 };

// Helpers (re-using from patientDetailsPDF.ts for consistency)
function roundedRect(
    doc: jsPDF,
    x: number, y: number, w: number, h: number,
    r: number,
    color: [number, number, number]
) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, w, h, r, r, 'F');
}

function sectionHeading(doc: jsPDF, label: string, y: number): number {
    roundedRect(doc, PAGE.margin, y, 3, 7, 1.5, COLORS.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(label.toUpperCase(), PAGE.margin + 6, y + 5.5);
    return y + 13;
}

function drawHeader(doc: jsPDF, doctorName: string) {
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, PAGE.w, 38, 'F');

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text('CardioMed Foundation', PAGE.margin, 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.primaryLight);
    doc.text('Centre Spécialisé de Cardiologie  •  Yaoundé, Cameroun  •  (+237) 699 99 99 99', PAGE.margin, 23);

    const date = new Date().toLocaleDateString('fr-FR');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8.5);
    doc.text(`Médecin : ${doctorName}`, PAGE.w - PAGE.margin, 16, { align: 'right' });
    doc.text(`Émis le : ${date}`, PAGE.w - PAGE.margin, 23, { align: 'right' });

    doc.setFillColor(...COLORS.accent);
    doc.rect(0, 38, PAGE.w, 1.5, 'F');
}

function drawFooter(doc: jsPDF, pageNum: number, pageCount: number) {
    const y = PAGE.h - 12;
    doc.setDrawColor(...COLORS.primaryLight);
    doc.setLineWidth(0.5);
    doc.line(PAGE.margin, y - 3, PAGE.w - PAGE.margin, y - 3);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.muted);
    doc.text('CardioMed Foundation — Votre cœur, notre priorité.', PAGE.margin, y + 2);
    doc.text(`Page ${pageNum} / ${pageCount}`, PAGE.w - PAGE.margin, y + 2, { align: 'right' });
}

export const generatePrescriptionPDF = (
    prescription: PrescriptionGroup,
    patientName: string,
    doctorName: string = 'Dr. Cyrille Mbida'
) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 0;

    drawHeader(doc, doctorName);
    y = 46; // Start content below header

    // Prescription Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Ordonnance Médicale', PAGE.margin, y);
    y += 10;

    // Patient Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    doc.text(`Patient: ${patientName}`, PAGE.margin, y);
    y += 6;
    doc.text(`Date de l'ordonnance: ${prescription.date}`, PAGE.margin, y);
    y += 10;

    // Medications Table
    y = sectionHeading(doc, 'Médicaments', y);

    autoTable(doc, {
        startY: y,
        head: [['Médicament et Posologie']],
        body: prescription.meds.map(med => [med]),
        margin: { left: PAGE.margin, right: PAGE.margin },
        headStyles: {
            fillColor: COLORS.primary,
            textColor: COLORS.white,
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 4,
        },
        bodyStyles: {
            fontSize: 9,
            cellPadding: 4,
            textColor: COLORS.dark,
        },
        alternateRowStyles: { fillColor: COLORS.light },
        columnStyles: {
            0: { fontStyle: 'bold' },
        },
        tableLineColor: COLORS.primaryLight,
        tableLineWidth: 0.3,
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Instructions/Notes (if any) - Placeholder for now
    y = sectionHeading(doc, 'Instructions Générales', y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    doc.text('Suivre scrupuleusement les indications du médecin.', PAGE.margin, y);
    y += 10;


    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(doc, i, totalPages);
    }

    // Save
    const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    doc.save(`Ordonnance_${patientName.replace(/\s+/g, '_')}_${dateStr}.pdf`);
};
