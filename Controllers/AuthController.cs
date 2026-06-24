using GymFit.Data;
using GymFit.models;
using GymFit.services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace GymFit.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly GymFitContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthController(GymFitContext context, IConfiguration configuration, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto loginData)
        {
            if (loginData == null || string.IsNullOrEmpty(loginData.Email) || string.IsNullOrEmpty(loginData.Password))
            {
                return BadRequest("Invalid login request. Email and password are required.");
            }

            string userId = "";
            string fullName = "";
            string userRole = "";
            int currentCompanyId = 0;
            string currentCompanyName = "";      // 🎯 Reține numele orașului
            string currentCompanyLocation = "";  // 🎯 Reține adresa sediului
            DateTime? membershipActivatedAt = null;

            // 1. CĂUTĂM ÎN TABELA DE CLIENȚI (Includem și Compania)
            var client = _context.Clients
                .Include(u => u.Company) // 🎯 Include automat datele din tabela Companies
                .FirstOrDefault(u => u.Email == loginData.Email);

            if (client != null)
            {
                bool isPasswordValid = false;
                try
                {
                    isPasswordValid = BCrypt.Net.BCrypt.Verify(loginData.Password, client.Password);
                }
                catch
                {
                    isPasswordValid = (client.Password == loginData.Password);
                }

                if (isPasswordValid)
                {
                    userId = client.Id.ToString();
                    fullName = $"{client.FirstName} {client.LastName}";
                    userRole = string.IsNullOrEmpty(client.Role) ? "Client" : client.Role;
                    membershipActivatedAt = client.MembershipActivatedAt;
                    currentCompanyId = client.CompanyId;
                    currentCompanyName = client.Company?.Name ?? "GymFit";
                    currentCompanyLocation = client.Company?.Location ?? "";
                }
            }

            // 2. CĂUTĂM ÎN TABELA DE ADMINI (Includem și Compania)
            if (string.IsNullOrEmpty(userId))
            {
                var admin = _context.Admins
                    .Include(a => a.Company) // 🎯 Include automat datele din tabela Companies
                    .FirstOrDefault(a => a.Email == loginData.Email);

                if (admin != null)
                {
                    bool isPasswordValid = false;
                    try
                    {
                        isPasswordValid = BCrypt.Net.BCrypt.Verify(loginData.Password, admin.Password);
                    }
                    catch
                    {
                        isPasswordValid = (admin.Password == loginData.Password);
                    }

                    if (isPasswordValid)
                    {
                        userId = admin.Id.ToString();
                        fullName = "Administrator";
                        userRole = string.IsNullOrEmpty(admin.Role) ? "Admin" : admin.Role;
                        currentCompanyId = admin.CompanyId;
                        currentCompanyName = admin.Company?.Name ?? "GymFit";
                        currentCompanyLocation = admin.Company?.Location ?? "";
                    }
                }
            }

            // 3. CĂUTĂM ÎN TABELA DE TRAINERI (Includem și Compania)
            if (string.IsNullOrEmpty(userId))
            {
                var trainer = _context.Trainers
                    .Include(t => t.Company) // 🎯 Include automat datele din tabela Companies
                    .FirstOrDefault(t => t.Email == loginData.Email);

                if (trainer != null)
                {
                    bool isPasswordValid = false;
                    try
                    {
                        isPasswordValid = BCrypt.Net.BCrypt.Verify(loginData.Password, trainer.Password);
                    }
                    catch
                    {
                        isPasswordValid = (trainer.Password == loginData.Password);
                    }

                    if (isPasswordValid)
                    {
                        userId = trainer.Id.ToString();
                        fullName = $"{trainer.FirstName} {trainer.LastName}";
                        userRole = string.IsNullOrEmpty(trainer.Role) ? "Trainer" : trainer.Role;
                        currentCompanyId = trainer.CompanyId;
                        currentCompanyName = trainer.Company?.Name ?? "GymFit";
                        currentCompanyLocation = trainer.Company?.Location ?? "";
                    }
                }
            }

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("Invalid credentials");
            }

            // Adăugăm datele companiei în interiorul JWT token-ului criptat
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, fullName),
                new Claim(ClaimTypes.Role, userRole),
                new Claim("companyId", currentCompanyId.ToString()),
                new Claim("companyName", currentCompanyName),      // 🎯 Disponibil în token
                new Claim("companyLocation", currentCompanyLocation) // 🎯 Disponibil în token
            };

            var secretKey = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(secretKey) || secretKey.Length < 32)
            {
                secretKey = "CheieDeSigurantaSuperLungaDePeste32DeCaractereGymFit2026!";
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "GymFitServer",
                audience: _configuration["Jwt:Audience"] ?? "GymFitClient",
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds
            );

            // Returnăm și textul orașului ca proprietate în JSON pentru a fi citit imediat în React
            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                role = userRole,
                name = fullName,
                userId = userId,
                companyId = currentCompanyId,
                companyName = currentCompanyName,          // 🎯 TRIMIS CĂTRE REACT DIRECT!
                companyLocation = currentCompanyLocation,  // 🎯 TRIMIS CĂTRE REACT DIRECT!
                membershipActivatedAt = membershipActivatedAt
            });
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto registerData)
        {
            if (registerData == null || string.IsNullOrEmpty(registerData.Email) || string.IsNullOrEmpty(registerData.Password))
            {
                return BadRequest("Invalid registration request. All fields are required.");
            }

            var existingClient = _context.Clients.FirstOrDefault(u => u.Email == registerData.Email);
            if (existingClient != null)
            {
                return BadRequest("An account with this email already exists.");
            }

            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(registerData.Password);

            var newClient = new Clients
            {
                FirstName = registerData.FirstName,
                LastName = registerData.LastName,
                Email = registerData.Email,
                PhoneNumber = registerData.PhoneNumber,
                Password = hashedPassword,
                Role = "Client",

                // 📍 Pasul 2 completat: Mapăm dinamic ID-ul primit din formularul React
                CompanyId = registerData.CompanyId
            };

            try
            {
                _context.Clients.Add(newClient);
                _context.SaveChanges();
                return Ok(new { message = "Registration successful! You can now log in." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error during registration: {ex.Message}");
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto model)
        {
            if (model == null || string.IsNullOrEmpty(model.Email))
            {
                return BadRequest("Email-ul este obligatoriu.");
            }

            var client = _context.Clients.FirstOrDefault(c => c.Email == model.Email);
            var trainer = _context.Trainers.FirstOrDefault(t => t.Email == model.Email);

            if (client == null && trainer == null)
            {
                return Ok(new { message = "Dacă email-ul există în sistem, un link de resetare a fost trimis." });
            }

            string token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            DateTime expiryTime = DateTime.UtcNow.AddHours(1);

            if (client != null)
            {
                client.PasswordResetToken = token;
                client.ResetTokenExpires = expiryTime;
            }
            else if (trainer != null)
            {
                trainer.PasswordResetToken = token;
                trainer.ResetTokenExpires = expiryTime;
            }

            _context.SaveChanges();

            string resetLink = $"http://localhost:3000/reset-password?token={token}";

            string emailBody = $@"
<div style='background-color: #11141a; padding: 40px 20px; font-family: ""Segoe UI"", Tahoma, Geneva, Verdana, sans-serif; color: #ffffff; text-align: center;'>
    <div style='max-width: 500px; margin: 0 auto; background-color: #1a1f29; padding: 30px; border-radius: 12px; border: 1px solid #2d3545; box-shadow: 0px 4px 15px rgba(0,0,0,0.3);'>
        <h2 style='color: #00ea98; margin-top: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;'>🏋️‍♂️ GymFit</h2>
        <hr style='border: 0; border-top: 1px solid #2d3545; margin: 20px 0;'>
        <h3 style='color: #ffffff; font-size: 20px; margin-bottom: 10px; font-weight: 600;'>Resetare Parolă</h3>
        <p style='color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 25px;'>Salutare! Am primit o solicitare de resetare a parolei pentru contul tău GymFit.</p>
        <div style='margin: 30px 0;'><a href='{resetLink}' style='display: inline-block; background: linear-gradient(135deg, #00ea98 0%, #00b4db 100%); color: #0f172a; font-weight: bold; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px;'>Resetează Parola</a></div>
        <p style='color: #64748b; font-size: 12px;'>© {DateTime.Now.Year} GymFit App. Toate drepturile rezervate.</p>
    </div>
</div>";

            try
            {
                await _emailService.SendEmailAsync(model.Email, "Resetare Parola - GymFit", emailBody);
                return Ok(new { message = "Dacă email-ul există în sistem, un link de resetare a fost trimis." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Eroare la trimiterea email-ului: {ex.Message}");
            }
        }

        [HttpPost("reset-password")]
        public IActionResult ResetPassword([FromBody] ResetPasswordDto model)
        {
            if (model == null || string.IsNullOrEmpty(model.Token) || string.IsNullOrEmpty(model.NewPassword))
            {
                return BadRequest("Date invalide.");
            }

            var client = _context.Clients.FirstOrDefault(c => c.PasswordResetToken == model.Token && c.ResetTokenExpires > DateTime.UtcNow);
            var trainer = _context.Trainers.FirstOrDefault(t => t.PasswordResetToken == model.Token && t.ResetTokenExpires > DateTime.UtcNow);

            if (client == null && trainer == null)
            {
                return BadRequest("Token-ul este invalid sau a expirat.");
            }

            string newHashedPassword = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);

            if (client != null)
            {
                client.Password = newHashedPassword;
                client.PasswordResetToken = null;
                client.ResetTokenExpires = null;
            }
            else if (trainer != null)
            {
                trainer.Password = newHashedPassword;
                trainer.PasswordResetToken = null;
                trainer.ResetTokenExpires = null;
            }

            _context.SaveChanges();

            return Ok(new { message = "Parola a fost resetată cu succes! Acum te poți loga." });
        }
    }

    public class ForgotPasswordDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}