using GymFit.Data;
using GymFit.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Microsoft.AspNetCore.OData.Formatter;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace GymFit.Controllers
{
    [Authorize]
    public class MembershipsController : ODataController // Lăsăm OData să gestioneze rutele nativ
    {
        private readonly GymFitContext _context;

        public MembershipsController(GymFitContext context)
        {
            _context = context;
        }

        // 1. CITEȘTE TOATE ABONAMENTELE (Nativ: GET /odata/Memberships)
        [HttpGet]
        [EnableQuery]
        public IActionResult Get()
        {
            return Ok(_context.Memberships);
        }

        // 2. CITEȘTE UN SINGUR ABONAMENT (Nativ: GET /odata/Memberships(1))
        [HttpGet]
        [EnableQuery]
        public async Task<IActionResult> Get([FromODataUri] int key)
        {
            var membership = await _context.Memberships.FindAsync(key);

            if (membership == null)
                return NotFound($"Membership with ID {key} not found.");

            return Ok(membership);
        }

        // 3. ADĂUGARE ABONAMENT NOU (Nativ: POST /odata/Memberships)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public IActionResult Post([FromBody] Membership membership)
        {
            if (membership == null || string.IsNullOrEmpty(membership.Name) || membership.Price <= 0)
            {
                return BadRequest("Date invalide. Numele și prețul sunt obligatorii.");
            }

            try
            {
                // Resetăm ID-ul pentru a lăsa baza de date (PostgreSQL) să îl genereze automat
                membership.Id = 0;

                _context.Memberships.Add(membership);
                _context.SaveChanges();

                return Created(membership);
            }
            catch (Exception ex)
            {
                var detailedError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Eroare la salvarea abonamentului: {detailedError}");
            }
        }

        // 4. ACTUALIZARE ABONAMENT (Nativ: PUT /odata/Memberships(5))
        [HttpPut]
        [Authorize(Roles = "Admin")]
        public IActionResult Put([FromODataUri] int key, [FromBody] Membership updatedMembership)
        {
            if (updatedMembership == null) return BadRequest("Datele transmise sunt invalide.");

            var existingMembership = _context.Memberships.FirstOrDefault(m => m.Id == key);
            if (existingMembership == null) return NotFound($"Abonamentul cu ID-ul {key} nu a fost găsit.");

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
                return Updated(existingMembership);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Eroare: {ex.Message}");
            }
        }

        // 5. ȘTERGERE ABONAMENT (Nativ: DELETE /odata/Memberships(5))
        [HttpDelete]
        [Authorize(Roles = "Admin")]
        public IActionResult Delete([FromODataUri] int key)
        {
            var membership = _context.Memberships.FirstOrDefault(m => m.Id == key);
            if (membership == null) return NotFound($"Abonamentul cu ID-ul {key} nu există.");

            try
            {
                _context.Memberships.Remove(membership);
                _context.SaveChanges();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Eroare la ștergere: {ex.Message}");
            }
        }

        // 🎯 RUTE HYBRID CUSTOM (Rămân neschimbate cu adrese complete deoarece încep cu "api/")
        [HttpGet("api/Memberships/{id}/details")]
        public IActionResult GetMembershipDetails(int id)
        {
            var m = _context.Memberships.FirstOrDefault(x => x.Id == id);
            if (m == null) return NotFound("Membership not found.");

            var details = $"Membership {m.Name}: {m.Description}. Pool Access: {(m.HasPoolAccess ? "YES" : "NO")}";
            return Ok(details);
        }

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