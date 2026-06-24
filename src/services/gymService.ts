const BASE_URL = "https://localhost:7104/api"; // Verifică portul tău

export const gymService = {
    // === ROOMS ===
    getAllRooms: async () => {
        const token = localStorage.getItem("userToken"); // Preluăm token-ul securizat
        const response = await fetch(`${BASE_URL}/Rooms`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}` // Trimitem insigna digitală
            }
        });
        if (!response.ok) throw new Error("Failed to fetch rooms");
        return await response.json();
    },

    createRoom: async (roomData: any) => {
        const token = localStorage.getItem("userToken");
        const response = await fetch(`${BASE_URL}/Rooms`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(roomData)
        });
        if (!response.ok) throw new Error("Failed to create room");
        return await response.json();
    },

    // === WORKOUTS ===
    getAllWorkouts: async () => {
        const token = localStorage.getItem("userToken");
        const response = await fetch(`${BASE_URL}/Workouts`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error("Failed to fetch workouts");
        return await response.json();
    },

    createWorkout: async (workoutData: any) => {
        const token = localStorage.getItem("userToken");
        const response = await fetch(`${BASE_URL}/Workouts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(workoutData)
        });
        if (!response.ok) throw new Error("Failed to create workout");
        return await response.json();
    },

    // === SESSIONS ===
    getAllSessions: async () => {
        const token = localStorage.getItem("userToken");
        const response = await fetch(`${BASE_URL}/Sessions`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error("Failed to fetch sessions");
        return await response.json();
    },

    // Folosim endpoint-ul tău avansat cu validare de capacitate
    createSessionWithValidation: async (session: any, room: any) => {
        const token = localStorage.getItem("userToken");
        const response = await fetch(`${BASE_URL}/Sessions/validate-and-create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ session, room })
        });

        // Dacă backend-ul aruncă BadRequest (de ex. capacitate prea mare), prindem mesajul de eroare din text
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to create session due to validation error.");
        }
        return await response.text();
    }
};