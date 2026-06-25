using Microsoft.AspNetCore.Mvc;
using GymFit.Data;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;

namespace GymFit.Controllers
{
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase 
    {
        private readonly GymFitContext _context;
        private readonly IWebHostEnvironment _environment;

        public ProfileController(GymFitContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // 🎯 RUTA EXPLICITĂ: Forțăm ruta fixă pentru a fi recunoscută perfect de router-ul hibrid
        [HttpPost("api/Profile/upload-photo")]
        public async Task<IActionResult> UploadProfilePicture(IFormFile file, [FromQuery] int userId, [FromQuery] string role)
        {
            // 1. Validăm fișierul primit
            if (file == null || file.Length == 0)
            {
                return BadRequest("Nu a fost selectat niciun fișier.");
            }

            // Validăm extensia să fie doar imagine
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest("Formatul imaginii este invalid. Sunt permise doar .jpg, .jpeg și .png");
            }

            try
            {
                // 2. Creăm calea fizică unde salvăm fișierul în wwwroot/uploads
                string uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Generăm un nume unic pentru fișier ca să nu se suprascrie
                string uniqueFileName = $"{role}_{userId}_{Guid.NewGuid()}{extension}";
                string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Copiem datele din fișierul trimis de React (file) în fileStream
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                // Calea relativă pe care o salvăm în DB și o trimitem către React
                string relativeUrl = $"/uploads/{uniqueFileName}";

                // 3. Căutăm în DB în funcție de rol și actualizăm câmpul moștenit din clasa Users
                if (role.Equals("Client", StringComparison.OrdinalIgnoreCase))
                {
                    var client = _context.Clients.FirstOrDefault(c => c.Id == userId);
                    if (client == null) return NotFound("Clientul nu a fost găsit.");
                    client.ProfilePictureUrl = relativeUrl;
                }
                else if (role.Equals("Trainer", StringComparison.OrdinalIgnoreCase))
                {
                    var trainer = _context.Trainers.FirstOrDefault(t => t.Id == userId);
                    if (trainer == null) return NotFound("Trainerul nu a fost găsit.");
                    trainer.ProfilePictureUrl = relativeUrl;
                }
                else if (role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                {
                    var admin = _context.Admins.FirstOrDefault(a => a.Id == userId);
                    if (admin == null) return NotFound("Adminul nu a fost găsit.");
                    admin.ProfilePictureUrl = relativeUrl;
                }
                else
                {
                    return BadRequest("Rol invalid.");
                }

                // Salvăm modificarea în baza de date
                await _context.SaveChangesAsync();

                // Returnăm noul link al pozei către Frontend
                return Ok(new { profilePictureUrl = relativeUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Eroare internă la salvarea imaginii: {ex.Message}");
            }
        }
    }
}