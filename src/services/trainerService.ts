import { Trainers } from '../models/Trainers';

const API_URL = 'https://localhost:7104/odata/Trainers';

export const trainerService = {
    getAllTrainers: async (): Promise<Trainers[]> => {
        const token = localStorage.getItem('token') || localStorage.getItem('userToken');
        const storedCompanyId = localStorage.getItem('companyId') || '1';

        // 🎯 Dinamicizare: Trimitem automat filiala curentă către backend pentru filtrare locală
        const response = await fetch(`${API_URL}?companyId=${storedCompanyId}`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to fetch trainers');

        const data = await response.json();

        // 🎯 ODATA FIX: Desfacem structura hibridă indiferent dacă datele vin în `.value` sau ca array direct
        const rawTrainers = data.value || data || [];

        // Normalizăm cheile la nivel de serviciu pentru a asigura compatibilitate deplină în interfață (camelCase)
        return rawTrainers.map((t: any) => ({
            ...t,
            id: t.id ?? t.Id,
            firstName: t.firstName ?? t.FirstName,
            lastName: t.lastName ?? t.LastName,
            email: t.email ?? t.Email,
            phoneNumber: t.phoneNumber ?? t.PhoneNumber,
            specialization: t.specialization ?? t.Specialization,
            yearsOfExperience: t.yearsOfExperience ?? t.YearsOfExperience ?? t.experienceYears ?? t.ExperienceYears ?? 0,
            companyId: t.companyId ?? t.CompanyId
        }));
    }
};

export default trainerService;