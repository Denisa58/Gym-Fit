using System;
using System.Collections.Generic;
using System.Text;

namespace GymFit.models
{
    public class Room
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int CompanyId { get; set; }

        // 🎯 PASUL 7: Legătura directă către obiectul Company pentru Săli
        public Company? Company { get; set; }

        public int MaxCapacity { get; set; }
        public string EquipmentType { get; set; }
        public bool IsAvailable { get; set; }

        public Room()
        {
            Company = null; // Inițializare implicită
        }

        public Room(int id, string name, int companyId, int maxCapacity, string equipmentType, bool isAvailable)
        {
            Id = id;
            Name = name;
            CompanyId = companyId;
            MaxCapacity = maxCapacity;
            EquipmentType = equipmentType;
            IsAvailable = isAvailable;
            Company = null; // Inițializare implicită
        }

        public bool CanAccommodate(int numberOfClients)
        {
            return IsAvailable && MaxCapacity >= numberOfClients;
        }
    }
}