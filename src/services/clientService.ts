import { Clients } from '../models/Clients';

const API_URL = 'https://localhost:7104/odata/Clients';

export const clientService = {
    getAllClients: async (): Promise<Clients[]> => {
        const token = localStorage.getItem('token') || localStorage.getItem('userToken');

        // 🎯 EXTRAGEM COMPANY ID-ul stocat în browser la login
        const companyId = localStorage.getItem('companyId') || '1';

        // 🎯 MODIFICARE: Trimitem parametrul companyId în URL pentru ca backend-ul să facă filtrarea pe oraș
        const response = await fetch(`${API_URL}?companyId=${companyId}`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to fetch clients');
        const data = await response.json();

        // OData returnează de regulă datele în interiorul proprietății 'value'
        return data.value || data;
    }
};

export default clientService;