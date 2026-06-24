using System;
using System.Collections.Generic;
using System.Text;

namespace GymFit.models
{
    public class Session
    {
        public int Id { get; set; }
        public int WorkoutId { get; set; }
        public int TrainerId { get; set; }
        public int RoomId { get; set; }
        public int CompanyId { get; set; }

        // 🎯 PASUL 8: Legătura directă către obiectul Company pentru Sesiuni/Clase
        public Company? Company { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int MaxCapacity { get; set; }
        public List<Clients> EnrolledClients { get; set; }

        public Session()
        {
            EnrolledClients = new List<Clients>();
            Company = null; // Inițializare implicită
        }

        public Session(int id, int workoutId, int trainerId, int roomId, int companyId, DateTime startTime, DateTime endTime, int maxCapacity)
        {
            Id = id;
            WorkoutId = workoutId;
            TrainerId = trainerId;
            RoomId = roomId;
            CompanyId = companyId;
            StartTime = startTime;
            EndTime = endTime;
            MaxCapacity = maxCapacity;
            EnrolledClients = new List<Clients>();
            Company = null; // Inițializare implicită
        }

        public bool IsFull => EnrolledClients.Count >= MaxCapacity;
    }
}