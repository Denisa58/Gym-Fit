using System;
using System.Collections.Generic;
using System.Text;

namespace GymFit.models
{
    public enum Difficulty
    {
        Beginner,
        Intermediate,
        Advanced,
        Pro
    }
    public class Workout
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int CompanyId { get; set; }

        // 🎯 PASUL 10: Legătura directă către obiectul Company pentru Antrenamente
        public Company? Company { get; set; }

        public Difficulty DifficultyLevel { get; set; }
        public int EstimatedDuration { get; set; }
        public int AverageCaloriesBurned { get; set; }

        public Workout()
        {
            Company = null; // Inițializare implicită
        }

        public Workout(int id, string name, string description, int companyId, Difficulty difficultyLevel, int estimatedDuration, int averageCaloriesBurned)
        {
            Id = id;
            Name = name;
            Description = description;
            CompanyId = companyId;
            DifficultyLevel = difficultyLevel;
            EstimatedDuration = estimatedDuration;
            AverageCaloriesBurned = averageCaloriesBurned;
            Company = null; // Inițializare implicită
        }
    }
}