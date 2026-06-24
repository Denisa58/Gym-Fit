import { Clients } from '../models/Clients';

const API_URL = 'https://localhost:7104/odata/Clients';

export const clientService = {
    // 1. Luat toți clienții (filtrați după oraș)
    getAllClients: async (): Promise<Clients[]> => {
        const token = localStorage.getItem('token') || localStorage.getItem('userToken');
        const companyId = localStorage.getItem('companyId') || '1';

        // Folosim direct parametrul de query pe care l-am lăsat suportat în backend
        const response = await fetch(`${API_URL}?companyId=${companyId}`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to fetch clients');
        const data = await response.json();

        // Nativ OData trimite un obiect cu structura { "@odata.context": "...", "value": [...] }
        return data.value || data;
    },

    // 2. Luat un singur client după ID (Sintaxă OData: /Clients(id))
    getClientById: async (id: number): Promise<Clients> => {
        const token = localStorage.getItem('token') || localStorage.getItem('userToken');

        const response = await fetch(`${API_URL}(${id})`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to fetch client details');
        return await response.json();
    },

    // 3. Ștergerea unui client (Sintaxă OData: /Clients(id) cu metoda DELETE)
    deleteClient: async (id: number): Promise<void> => {
        const token = localStorage.getItem('token') || localStorage.getItem('userToken');

        const response = await fetch(`${API_URL}(${id})`, {
            method: 'DELETE',
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error('Failed to delete client');
    }
};

export default clientService;