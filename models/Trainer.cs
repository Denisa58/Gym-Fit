using System;
using System.Collections.Generic;
using System.Text;

namespace GymFit.models
{
    public class Trainer : User
    {
        public string Specialization { get; set; }
        public int ExperienceYears { get; set; }
        public int CompanyId { get; set; }

        // 🎯 PASUL 9: Legătura directă către obiectul Company pentru Antrenori
        public Company? Company { get; set; }

        public List<Clients> Clients { get; set; }

        public Trainer()
        {
            Clients = new List<Clients>();
            Company = null; // Inițializare implicită
        }

        public Trainer(int id, string firstName, string lastName, string email, string password, string phoneNumber, string specialization, int experienceYears, int companyId)
            : base(id, firstName, lastName, email, password, phoneNumber)
        {
            Specialization = specialization;
            ExperienceYears = experienceYears;
            CompanyId = companyId;
            Clients = new List<Clients>();
            Company = null; // Inițializare implicită
        }
    }
}