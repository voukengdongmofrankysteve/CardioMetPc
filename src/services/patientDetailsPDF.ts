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

// ─── Design Tokens ────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Draw a filled rounded rectangle */
function roundedRect(
    doc: jsPDF,
    x: number, y: number, w: number, h: number,
    r: number,
    color: [number, number, number]
) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, w, h, r, r, 'F');
}

/** Section heading with teal left-bar accent */
function sectionHeading(doc: jsPDF, label: string, y: number): number {
    roundedRect(doc, PAGE.margin, y, 3, 7, 1.5, COLORS.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(label.toUpperCase(), PAGE.margin + 6, y + 5.5);
    return y + 13;
}

/** Two-column info row */
function infoRow(
    doc: jsPDF,
    label: string,
    value: string | number | boolean | null | undefined,
    x: number, y: number,
    colW: number
): number {
    if (value === undefined || value === null || value === '') return y;
    const display = typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.muted);
    doc.text(label, x, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);

    // Wrap long values
    const lines = doc.splitTextToSize(display, colW - 4);
    doc.text(lines, x, y + 5);

    return y + 5 + lines.length * 5;
}

// ─── Header ───────────────────────────────────────────────────────────────────
function drawHeader(doc: jsPDF, doctorName: string) {
    // Full-width background strip
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, PAGE.w, 38, 'F');

    // Clinic name
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text('CardioMed Foundation', PAGE.margin, 16);

    // Subtitle
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.primaryLight);
    doc.text('Centre Spécialisé de Cardiologie  •  Yaoundé, Cameroun  •  (+237) 699 99 99 99', PAGE.margin, 23);

    // Doctor + date — right aligned
    const date = new Date().toLocaleDateString('fr-FR');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8.5);
    doc.text(`Médecin : ${doctorName}`, PAGE.w - PAGE.margin, 16, { align: 'right' });
    doc.text(`Émis le : ${date}`, PAGE.w - PAGE.margin, 23, { align: 'right' });

    // Bottom accent line
    doc.setFillColor(...COLORS.accent);
    doc.rect(0, 38, PAGE.w, 1.5, 'F');
}

// ─── Patient Banner ───────────────────────────────────────────────────────────
function drawPatientBanner(doc: jsPDF, patient: PatientDetails): number {
    const y = 46;
    roundedRect(doc, PAGE.margin, y, PAGE.w - PAGE.margin * 2, 24, 4, COLORS.light);

    // Avatar circle
    doc.setFillColor(...COLORS.primaryLight);
    doc.circle(PAGE.margin + 12, y + 12, 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    const initials = patient.full_name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    doc.text(initials, PAGE.margin + 12, y + 14.5, { align: 'center' });

    // Name & ID
    const tx = PAGE.margin + 26;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(patient.full_name, tx, y + 9);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(`ID : ${patient.patient_id}   •   ${patient.gender}   •   ${patient.age} ans   •   ${patient.nationality}`, tx, y + 15.5);

    // Consent badge
    const badgeColor = patient.consent ? COLORS.primary : COLORS.danger;
    const badgeBg    = patient.consent ? COLORS.primaryLight : COLORS.dangerLight;
    const badgeLabel = patient.consent ? '✔  Consentement signé' : '✘  Pas de consentement';
    roundedRect(doc, PAGE.w - PAGE.margin - 56, y + 6, 52, 12, 3, badgeBg);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...badgeColor);
    doc.text(badgeLabel, PAGE.w - PAGE.margin - 30, y + 14, { align: 'center' });

    return y + 30;
}

// ─── Info Grid ────────────────────────────────────────────────────────────────
function drawInfoGrid(doc: jsPDF, patient: PatientDetails, startY: number): number {
    let y = sectionHeading(doc, 'Informations Personnelles', startY);

    const colW = (PAGE.w - PAGE.margin * 2 - 8) / 2;
    const col1 = PAGE.margin;
    const col2 = PAGE.margin + colW + 8;

    // Build rows: [label, value]
    const fields: [string, string | number | null | undefined][] = [
        ['Date de naissance', patient.dob],
        ['CNI / Passeport',   patient.cni],
        ['Téléphone',         patient.phone],
        ['Email',             patient.email],
        ['Poids',             patient.weight ? `${patient.weight} kg` : null],
        ['Taille',            patient.height ? `${patient.height} cm` : null],
        ['Médecin référent',  patient.ref_doctor],
        ['Assurance',         patient.insurance],
        ['N° Police',         patient.insurance_policy],
        ['Adresse',           patient.address],
        ['Enregistré le',     new Date(patient.created_at).toLocaleDateString('fr-FR')],
    ];

    // Render in two columns
    let leftY = y, rightY = y;
    fields.forEach(([label, value], i) => {
        if (!value) return;
        if (i % 2 === 0) {
            leftY  = infoRow(doc, label, value, col1, leftY, colW);
            leftY += 3;
        } else {
            rightY = infoRow(doc, label, value, col2, rightY, colW);
            rightY += 3;
        }
    });

    return Math.max(leftY, rightY) + 4;
}

// ─── Risk Factors ─────────────────────────────────────────────────────────────
function drawRiskFactors(doc: jsPDF, factors: string[], startY: number): number {
    if (!factors || factors.length === 0) return startY;

    let y = sectionHeading(doc, 'Facteurs de Risque', startY);

    const chipW = 50, chipH = 8, gap = 4;
    let cx = PAGE.margin;

    factors.forEach(factor => {
        if (cx + chipW > PAGE.w - PAGE.margin) {
            cx  = PAGE.margin;
            y  += chipH + gap;
        }
        roundedRect(doc, cx, y, chipW, chipH, 3, COLORS.dangerLight);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.danger);
        doc.text(factor, cx + chipW / 2, y + 5.5, { align: 'center' });
        cx += chipW + gap;
    });

    return y + chipH + 8;
}

// ─── Emergency Contacts Table ─────────────────────────────────────────────────
function drawEmergencyContacts(
    doc: jsPDF,
    contacts: PatientDetails['emergency_contacts'],
    startY: number
): number {
    if (!contacts || contacts.length === 0) return startY;

    const y = sectionHeading(doc, "Contacts d'Urgence", startY);

    autoTable(doc, {
        startY: y,
        head: [['Nom', 'Relation', 'Téléphone']],
        body: contacts.map(c => [c.name, c.relationship, c.phone]),
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

    return (doc as any).lastAutoTable.finalY + 8;
}

// ─── Footer ───────────────────────────────────────────────────────────────────
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

// ─── Main Export ──────────────────────────────────────────────────────────────
export const generatePatientDetailsPDF = (
    patient: PatientDetails,
    doctorName: string = 'Dr. Cyrille Mbida'
) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // ── Page 1 ──────────────────────────────────────────────────────────────
    drawHeader(doc, doctorName);
    let y = drawPatientBanner(doc, patient);

    // Divider
    doc.setDrawColor(...COLORS.primaryLight);
    doc.setLineWidth(0.4);
    doc.line(PAGE.margin, y, PAGE.w - PAGE.margin, y);
    y += 6;

    y = drawInfoGrid(doc, patient, y);

    // Divider
    y += 2;
    doc.setDrawColor(...COLORS.primaryLight);
    doc.line(PAGE.margin, y, PAGE.w - PAGE.margin, y);
    y += 6;

    y = drawRiskFactors(doc, patient.risk_factors, y);

    y += 2;
    doc.setDrawColor(...COLORS.primaryLight);
    doc.line(PAGE.margin, y, PAGE.w - PAGE.margin, y);
    y += 6;

    drawEmergencyContacts(doc, patient.emergency_contacts, y);

    // Footers (single page assumed; extend with addPage() for multi-page)
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(doc, i, totalPages);
    }

    // Save
    const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    doc.save(`Patient_${patient.full_name.replace(/\s+/g, '_')}_${dateStr}.pdf`);
};