// src/models/Session.ts
import { Clients } from './Clients';

export interface Session {
    id: number;
    workoutId: number;
    trainerId: number;
    roomId: number;
    startTime: string; // DateTime din C# devine string ISO în frontend
    endTime: string;   // DateTime din C# devine string ISO în frontend
    maxCapacity: number;
    enrolledClients: Clients[]; // List<Clients> devine tablou de obiecte de tip Clients
}