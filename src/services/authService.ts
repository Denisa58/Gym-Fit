const API_URL = "https://localhost:7104/api/Auth"; // Portul tău exact din .NET

export const authService = {
    // 1. Funcția de Login
    login: async (email: any, password: any) => {
        const response = await fetch("https://localhost:7104/api/Auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error("Invalid credentials");

        const data = await response.json();

        // Salvăm token-ul primit de la backend
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userId", data.userId);

        // 🎯 SALVĂM COMPANY ID ÎN BROWSER
        if (data.companyId !== undefined) {
            localStorage.setItem("companyId", data.companyId.toString());
        }

        return data;
    },

    // 2. Funcția de Register
    // 2. Funcția de Register modificată pentru mapare exactă C# PascalCase
    register: async (userData: any) => {
        // Ne asigurăm că trimitem toate câmpurile, forțând CompanyId cu literă mare dacă .NET-ul e strict
        const payload = {
            FirstName: userData.firstName,
            LastName: userData.lastName,
            Email: userData.email,
            Password: userData.password,
            PhoneNumber: userData.phoneNumber,
            CompanyId: userData.companyId // 🎯 Trimis exact ca proprietatea din C# RegisterDto
        };

        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        // Verificăm dacă răspunsul este JSON înainte de a da .json() pentru a evita crash-uri de parsare
        const contentType = response.headers.get("content-type");
        const data = contentType && contentType.indexOf("application/json") !== -1
            ? await response.json()
            : { message: await response.text() };

        if (!response.ok) {
            throw new Error(data.message || "A apărut o eroare la înregistrare.");
        }

        return data;
    },

    // 3. Funcția de Logout
    logout: () => {
        localStorage.removeItem("userToken"); // Curățăm și token-ul la logout
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("companyId"); // 🎯 Ștergem și ID-ul companiei la logout
        window.location.href = "/login"; // Redirecționare la login
    },

    // 4. Funcția de Preluare Abonamente
    getMemberships: async () => {
        // Luăm tokenul din localStorage pentru a trece de protecția [Authorize] din C#
        const token = localStorage.getItem('userToken');

        const response = await fetch("https://localhost:7104/api/Memberships", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                // Trimitem tokenul în formatul standard Bearer
                "Authorization": token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) {
            throw new Error("Nu s-au putut încărca abonamentele.");
        }

        return await response.json();
    }
};