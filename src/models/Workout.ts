// src/models/Workout.ts

// 1. Definim enum-ul pentru dificultate exact ca în C#
export enum Difficulty {
    Beginner,      // 0
    Intermediate,  // 1
    Advanced,      // 2
    Pro            // 3
}

// 2. Definim interfața pentru antrenament
export interface Workout {
    id: number;
    name: string;
    description: string;
    difficultyLevel: Difficulty; // Folosește enum-ul definit mai sus
    estimatedDuration: number;   // în minute
    averageCaloriesBurned: number;
}