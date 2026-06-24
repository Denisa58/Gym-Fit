using GymFit.Data;
using GymFit.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers; // 🎯 Adăugat pentru ODataController
using Microsoft.AspNetCore.OData.Formatter;         // 🎯 Adăugat pentru [FromODataUri]
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace GymFit.Controllers
{
    // Eliminăm [Route("api/[controller]")] global pentru ca OData să își poată genera automat rutele standard,
    // dar păstrăm atributele explicite pe rutele custom.
    [ApiController]
    [Authorize]
    public class MembershipsController : ODataController // 🎯 Modificat: Moștenește din ODataController
    {
        private readonly GymFitContext _context;

        public MembershipsController(GymFitContext context)
        {
            _context = context;
        }

        // 1. CITEȘTE TOATE ABONAMENTELE (Ruta OData: GET /odata/Memberships)
        [HttpGet("odata/Memberships")]
        [HttpGet("api/Memberships")] // Păstrăm fallback și pentru ruta veche
        [EnableQuery]
        public IActionResult Get()
        {
            return Ok(_context.Memberships);
        }

        // 🎯 NOU & CRUCIAL: REPARĂ EROAREA 404 DIN REACT
        // Această metodă va răspunde la cererea: GET /odata/Memberships(1) sau /odata/Memberships(3)
        [HttpGet("odata/Memberships({key})")]
        [EnableQuery]
        public async Task<IActionResult> Get([FromODataUri] int key)
        {
            var membership = await _context.Memberships.FindAsync(key);

            if (membership == null)
                return NotFound($"Membership with ID {key} not found.");

            return Ok(membership);
        }

        // 2. DETALII TEXT DESPRE UN ABONAMENT
        [HttpGet("api/Memberships/{id}/details")]
        public IActionResult GetMembershipDetails(int id)
        {
            var m = _context.Memberships.FirstOrDefault(x => x.Id == id);

            if (m == null)
                return NotFound("Membership not found.");

            var details = $"Membership {m.Name}: {m.Description}. " +
                          $"Pool Access: {(m.HasPoolAccess ? "YES" : "NO")}, " +
                          $"Sauna Access: {(m.HasSaunaAccess ? "YES" : "NO")}, " +
                          $"Personal Trainer Included: {(m.HasTrainerIncluded ? "YES" : "NO")}.";

            return Ok(details);
        }

        // 3. ADĂUGARE ABONAMENT NOU (DOAR ADMIN)
        [HttpPost("api/Memberships")]
        [Authorize(Roles = "Admin")]
        public IActionResult Post([FromBody] Membership membership)
        {
            if (membership == null)
            {
                return BadRequest("Datele abonamentului sunt invalide.");
            }

            if (string.IsNullOrEmpty(membership.Name) || membership.Price <= 0)
            {
                return BadRequest("Numele abonamentului și prețul sunt obligatorii.");
            }

            try
            {
                _context.Memberships.Add(membership);
                _context.SaveChanges();

                return Ok(new { message = $"Abonamentul '{membership.Name}' a fost creat cu succes!", id = membership.Id });
            }
            catch (Exception ex)
            {
                var detailedError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Eroare la salvarea abonamentului: {detailedError}");
            }
        }

        // 4. ACTUALIZARE ABONAMENT EXISTENT (DOAR ADMIN)
        [HttpPut("api/Memberships/{id}")]
        [Authorize(Roles = "Admin")]
        public IActionResult Put(int id, [FromBody] Membership updatedMembership)
        {
            if (updatedMembership == null)
            {
                return BadRequest("Datele transmise sunt invalide.");
            }

            var existingMembership = _context.Memberships.FirstOrDefault(m => m.Id == id);
            if (existingMembership == null)
            {
                return NotFound($"Abonamentul cu ID-ul {id} nu a fost găsit.");
            }

            try
            {
                existingMembership.Name = updatedMembership.Name;
                existingMembership.Price = updatedMembership.Price;
                existingMembership.DurationMonths = updatedMembership.DurationMonths;
                existingMembership.Description = updatedMembership.Description;
                existingMembership.HasPoolAccess = updatedMembership.HasPoolAccess;
                existingMembership.HasSaunaAccess = updatedMembership.HasSaunaAccess;
                existingMembership.HasTrainerIncluded = updatedMembership.HasTrainerIncluded;
                existingMembership.MaxWorkoutsPerWeek = updatedMembership.MaxWorkoutsPerWeek;

                _context.SaveChanges();
                return Ok(new { message = $"Abonamentul '{existingMembership.Name}' a fost actualizat cu succes!" });
            }
            catch (Exception ex)
            {
                var detailedError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Eroare la actualizarea abonamentului: {detailedError}");
            }
        }

        // 5. ȘTERGERE ABONAMENT (DOAR ADMIN)
        [HttpDelete("api/Memberships/{id}")]
        [Authorize(Roles = "Admin")]
        public IActionResult Delete(int id)
        {
            var membership = _context.Memberships.FirstOrDefault(m => m.Id == id);
            if (membership == null)
            {
                return NotFound($"Abonamentul cu ID-ul {id} nu există.");
            }

            try
            {
                _context.Memberships.Remove(membership);
                _context.SaveChanges();
                return Ok(new { message = $"Abonamentul '{membership.Name}' a fost șters cu succes!" });
            }
            catch (Exception ex)
            {
                var detailedError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Eroare la ștergerea abonamentului. Detalii: {detailedError}");
            }
        }

        // 🎯 6. CUMPĂRARE ABONAMENT (APELAT DIN REACT)
        [HttpPost("api/Memberships/purchase")]
        public async Task<IActionResult> Purchase([FromBody] PurchaseDto dto)
        {
            var client = await _context.Clients.FindAsync(dto.UserId);
            if (client == null) return NotFound("Client not found");

            client.MembershipId = dto.MembershipId;
            client.MembershipActivatedAt = DateTime.UtcNow;

            _context.Clients.Update(client);
            await _context.SaveChangesAsync();

            return Ok(client);
        }
    }

    public class PurchaseDto
    {
        public int UserId { get; set; }
        public int MembershipId { get; set; }
    }
}