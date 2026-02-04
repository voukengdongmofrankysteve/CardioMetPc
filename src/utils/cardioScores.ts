/**
 * Cardiology Risk Scores Calculation Utility
 */

// CHA₂DS₂-VASc Score for Atrial Fibrillation Stroke Risk
export interface Cha2Ds2VascInputs {
    congestiveHeartFailure: boolean;
    hypertension: boolean;
    age: number;
    diabetes: boolean;
    strokeHistory: boolean;
    vascularDisease: boolean;
    isFemale: boolean;
}

export const calculateCha2Ds2Vasc = (inputs: Cha2Ds2VascInputs): number => {
    let score = 0;
    if (inputs.congestiveHeartFailure) score += 1;
    if (inputs.hypertension) score += 1;
    if (inputs.age >= 75) score += 2;
    else if (inputs.age >= 65) score += 1;
    if (inputs.diabetes) score += 1;
    if (inputs.strokeHistory) score += 2;
    if (inputs.vascularDisease) score += 1;
    if (inputs.isFemale) score += 1;
    return score;
};

// HAS-BLED Score for Bleeding Risk
export interface HasBledInputs {
    hypertension: boolean;
    abnormalRenal: boolean;
    abnormalLiver: boolean;
    strokeHistory: boolean;
    bleedingHistory: boolean;
    labileINR: boolean;
    elderly: boolean; // age > 65
    drugs: boolean; // antiplatelets/NSAIDs
    alcohol: boolean;
}

export const calculateHasBled = (inputs: HasBledInputs): number => {
    let score = 0;
    if (inputs.hypertension) score += 1;
    if (inputs.abnormalRenal) score += 1;
    if (inputs.abnormalLiver) score += 1;
    if (inputs.strokeHistory) score += 1;
    if (inputs.bleedingHistory) score += 1;
    if (inputs.labileINR) score += 1;
    if (inputs.elderly) score += 1;
    if (inputs.drugs) score += 1;
    if (inputs.alcohol) score += 1;
    return score;
};

// Simplified SCORE CV Risk level
export type RiskLevel = 'Bas' | 'Modéré' | 'Élevé' | 'Très Élevé';

export const getRiskLevelColor = (level: RiskLevel): string => {
    switch (level) {
        case 'Bas': return 'text-green-500';
        case 'Modéré': return 'text-yellow-500';
        case 'Élevé': return 'text-orange-500';
        case 'Très Élevé': return 'text-red-500';
        default: return 'text-gray-500';
    }
};
