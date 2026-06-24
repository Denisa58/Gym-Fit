using System;
using System.Collections.Generic;
using System.Text;

namespace GymFit.models
{
    public class Clients : User
    {
        public int? TrainerId { get; set; }
        public int? MembershipId { get; set; }
        public bool? IsActive { get; set; }
        public int CompanyId { get; set; }

        // 🎯 PASUL 6: Legătura directă către obiectul Company pentru Clienți
        public Company? Company { get; set; }

        public List<int>? EnrolledSessionIds { get; set; }

        // 💡 Proprietatea nouă pentru salvarea datei în baza de date
        public DateTime? MembershipActivatedAt { get; set; }

        public Clients()
        {
            EnrolledSessionIds = new List<int>();
            Company = null; // Inițializare implicită
        }

        public Clients(int id, string firstName, string lastName, string email, string password, string phoneNumber,
                      int? trainerId, int membershipId, int companyId, DateTime? membershipActivatedAt = null)
            : base(id, firstName, lastName, email, password, phoneNumber)
        {
            CompanyId = companyId;
            TrainerId = trainerId;
            MembershipId = membershipId;
            IsActive = true;
            EnrolledSessionIds = new List<int>();
            Company = null; // Inițializare implicită

            // 💡 Inițializăm data (implicit va fi null dacă nu e trimisă la crearea contului)
            MembershipActivatedAt = membershipActivatedAt;
        }
    }
}