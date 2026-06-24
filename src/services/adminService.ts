import { Admin } from '../models/Admin';

const API_URL = 'https://localhost:7104/odata/Admins';

export const login = async (username: string, password: string): Promise<Admin | null> => {
    // Aici vom face fetch-ul către Visual Studio mai târziu
    console.log("Încercare logare pentru:", username);
    return null;
};