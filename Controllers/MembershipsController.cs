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
    [ApiController]
    [Authorize]
    public class MembershipsController : ODataController
    {
        private readonly GymFitContext _context;

        public MembershipsController(GymFitContext context)
        {
            _context = context;
        }

        // 1. CITEȘTE TOATE ABONAMENTELE (GET /odata/Memberships)
        [HttpGet("odata/Memberships")]
        [EnableQuery]
        public IActionResult Get()
        {
            return Ok(_context.Memberships);
        }

        // 2. CITEȘTE UN SINGUR ABONAMENT (GET /odata/Memberships(1))
        [HttpGet("odata/Memberships({key})")]
        [EnableQuery]
        public async Task<IActionResult> Get([FromODataUri] int key)
        {
            var membership = await _context.Memberships.FindAsync(key);

            if (membership == null)
                return NotFound($"Membership with ID {key} not found.");

            return Ok(membership);
        }

        // 3. ADĂUGARE ABONAMENT NOU (POST /odata/Memberships)
        [HttpPost("odata/Memberships")]
        [Authorize(Roles = "Admin")]
        public IActionResult Post([FromBody] Membership membership)
        {
            if (membership == null || string.IsNullOrEmpty(membership.Name) || membership.Price <= 0)
            {
                return BadRequest("Date invalide. Numele și prețul sunt obligatorii.");
            }

            try
            {
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

        // 4. ACTUALIZARE ABONAMENT (PUT /odata/Memberships(5))
        [HttpPut("odata/Memberships({key})")]
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

        // 5. ȘTERGERE ABONAMENT (DELETE /odata/Memberships(5))
        [HttpDelete("odata/Memberships({key})")]
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

        // 🎯 RUTE HYBRID CUSTOM (Rămân neschimbate ca să se pupe cu logica din React)
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