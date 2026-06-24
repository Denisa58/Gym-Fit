using System.Text.Json.Serialization; // 👈 Asigură-te că adaugi acest import sus de tot în fișier

namespace GymFit.models
{
    public class RegisterDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;

        // 🎯 Forțăm .NET să mapze corect valoarea indiferent de formatul trimis de Axios/Fetch
        [JsonPropertyName("CompanyId")]
        public int CompanyId { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}