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
    register: async (userData: any) => {
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
        localStorage.removeItem("userToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("companyId");
        window.location.href = "/login";
    },

    // 4. Funcția de Preluare Abonamente
    getMemberships: async () => {
        const token = localStorage.getItem('userToken');

        // Trecut corect pe endpoint-ul de OData
        const response = await fetch("https://localhost:7104/odata/Memberships", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) {
            throw new Error("Nu s-au putut încărca abonamentele.");
        }

        const data = await response.json();


        return data.value || data;
    }
};