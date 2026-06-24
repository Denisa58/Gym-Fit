// src/models/User.ts

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    password?: string; // Îl lăsăm opțional (cu ?) pentru că nu îl trimiți mereu de la backend din motive de securitate
    phoneNumber: string;
    passwordResetToken?: string | null;
    resetTokenExpires?: string | null; // Datetime-ul din C# vine ca string ISO în JSON
    profilePictureUrl?: string | null;
    role: string; // Valoarea implicită din C# ("Client") se va ocupa backend-ul de ea, sau o setezi în formular
}