// src/models/Trainers.ts
import { User } from './User';
import { Clients } from './Clients';

export interface Trainers extends User {
    specialization: string;
    experienceYears: number;
    clients: Clients[]; // List<Clients> devine array de obiecte de tip Clients
}