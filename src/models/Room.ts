// src/models/Room.ts

export interface Room {
    id: number;
    name: string;
    maxCapacity: number;
    equipmentType: string;
    isAvailable: boolean;
}