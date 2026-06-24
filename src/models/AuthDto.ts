// src/models/AuthDto.ts

export interface RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

export interface LoginDto {
    email: string;
    password: string;
}