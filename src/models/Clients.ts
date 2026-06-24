// src/models/Clients.ts
import { User } from './User';

export interface Clients extends User {
    weight?: number | null;
    height?: number | null;
    fitnessGoals?: string | null;
    trainerId?: number | null;
    membershipId?: number | null;
    isActive?: boolean | null;
    enrolledSessionIds?: number[] | null; // List<int> devine array de numere
    membershipActivatedAt?: string | null; // DateTime devine string în format ISO (ex: "2026-06-23T23:38:00Z")
}