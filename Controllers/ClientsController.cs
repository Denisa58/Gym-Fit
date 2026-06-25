using GymFit.Data;
using GymFit.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Microsoft.AspNetCore.OData.Formatter; // Adăugat pentru [FromODataUri]
using Microsoft.AspNetCore.Http; // 👈 Adăugat pentru IFormFile (upload de fișiere)
using Microsoft.EntityFrameworkCore; // Adăugat pentru EntityState dacă e nevoie
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace GymFit.Controllers
{
    public class ClientsController : ODataController // Moștenește deja corect ODataController
    {
        private readonly GymFitContext _context;

        public ClientsController(GymFitContext context)
        {
            _context = context;
        }

        // GET: odata/Clients
        [HttpGet]
        [EnableQuery]
        [Authorize(Roles = "Admin")]
        public IActionResult Get([FromQuery] int? companyId)
        {
            if (companyId.HasValue)
            {
                var localClients = _context.Clients.Where(c => c.CompanyId == companyId.Value);
                return Ok(localClients);
            }

            return Ok(_context.Clients);
        }

        // GET: odata/Clients(5)
        [HttpGet]
        [EnableQuery] // Adăugat pentru a permite expand-uri pe un singur client dacă e nevoie
        [Authorize(Roles = "Admin,Trainer,Client")]
        public IActionResult Get([FromODataUri] int key) // 🎯 Modificat: Adăugat [FromODataUri] conform convenției OData
        {
            var client = _context.Clients.FirstOrDefault(c => c.Id == key);
            if (client == null) return NotFound("Clientul nu a fost găsit.");
            return Ok(client);
        }

        // POST: odata/Clients
        [HttpPost]
        public IActionResult Post([FromBody] Clients newClient)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (_context.Clients.Any(c => c.Email == newClient.Email))
            {
                return BadRequest("Eroare: Acest email este deja înregistrat.");
            }

            if (newClient.CompanyId == 0)
            {
                newClient.CompanyId = 1;
            }

            _context.Clients.Add(newClient);
            _context.SaveChanges();

            return Created(newClient); // Returnează corect entitatea în stil OData
        }

        // 🎯 Rute speciale hibrid pentru acțiuni (se asigură că merg direct fără configurări EDM complexe)
        [HttpPost("odata/Clients({clientId})/choose-membership")]
        [Authorize]
        public IActionResult ChooseMembership([FromRoute] int clientId, [FromQuery] int membershipId)
        {
            var client = _context.Clients.FirstOrDefault(c => c.Id == clientId);
            if (client == null) return NotFound("Clientul nu a fost găsit.");

            client.MembershipId = membershipId;
            client.IsActive = true;
            client.MembershipActivatedAt = DateTime.UtcNow;

            _context.SaveChanges();

            return Ok(new
            {
                message = "Abonamentul a fost activat cu succes!",
                membershipId = client.MembershipId,
                membershipActivatedAt = client.MembershipActivatedAt
            });
        }

        [HttpPost("odata/Clients({clientId})/enroll")]
        [Authorize]
        public IActionResult Enroll([FromRoute] int clientId, [FromQuery] int sessionId)
        {
            var client = _context.Clients.FirstOrDefault(c => c.Id == clientId);

            if (client != null && client.IsActive == true)
            {
                if (client.EnrolledSessionIds == null) client.EnrolledSessionIds = new List<int>();

                if (!client.EnrolledSessionIds.Contains(sessionId))
                {
                    client.EnrolledSessionIds.Add(sessionId);
                    _context.SaveChanges();
                    return Ok("Înscriere reușită.");
                }
                return BadRequest("Clientul este deja înscris la această sesiune.");
            }
            return NotFound("Clientul nu a fost găsit sau este inactiv.");
        }

        [HttpPost("odata/Clients({clientId})/upload-profile-picture")]
        [Authorize]
        public async Task<IActionResult> UploadProfilePicture([FromRoute] int clientId, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Nu a fost trimis niciun fișier.");
            }

            var client = _context.Clients.FirstOrDefault(c => c.Id == clientId);
            if (client == null)
            {
                return NotFound("Clientul nu a fost găsit.");
            }

            try
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var extension = Path.GetExtension(file.FileName);
                var uniqueFileName = $"profile_{clientId}_{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var request = HttpContext.Request;
                var baseUrl = $"{request.Scheme}://{request.Host}";
                var imageUrl = $"{baseUrl}/uploads/{uniqueFileName}";

                client.ProfilePictureUrl = imageUrl;
                _context.SaveChanges();

                return Ok(new { profilePictureUrl = imageUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Eroare internă la salvarea imaginii: {ex.Message}");
            }
        }

        // DELETE: odata/Clients(5)
        [HttpDelete]
        [Authorize(Roles = "Admin")]
        public IActionResult Delete([FromODataUri] int key) 
        {
            var client = _context.Clients.FirstOrDefault(c => c.Id == key);
            if (client != null)
            {
                _context.Clients.Remove(client);
                _context.SaveChanges();
                return NoContent();
            }
            return NotFound();
        }
    }
}