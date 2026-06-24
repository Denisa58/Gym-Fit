import { Trainers } from '../models/Trainers';

const API_URL = 'https://localhost:7104/api/trainers';

export const trainerService = {
    getAllTrainers: async (): Promise<Trainers[]> => {
        const token = localStorage.getItem('token') || localStorage.getItem('userToken');
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        if (!response.ok) throw new Error('Failed to fetch trainers');
        return await response.json();
    }
};

export default trainerService;