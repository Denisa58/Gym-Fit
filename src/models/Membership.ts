// src/models/Membership.ts

export interface Membership {
    id: number;
    name: string;
    price: number; // decimal din C# devine number în TypeScript
    durationMonths: number;
    description: string;
    hasPoolAccess: boolean;
    hasSaunaAccess: boolean;
    hasTrainerIncluded: boolean;
    maxWorkoutsPerWeek: number;
}