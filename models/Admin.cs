namespace GymFit.models
{
    public class Admin : User
    {
        public int CompanyId { get; set; }

        // 🎯 PASUL 5: Legătura directă către obiectul Company (proprietate de navigare)
        public Company? Company { get; set; }

        public Admin(int id, string firstName, string lastName, string email, string password, string phoneNumber, int companyId)
            : base(id, firstName, lastName, email, password, phoneNumber)
        {
            CompanyId = companyId;
            Role = "Admin";
            Company = null; // Inițializare implicită pentru siguranță
        }
    }
}