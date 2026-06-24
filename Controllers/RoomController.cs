using GymFit.Data;
using GymFit.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using System.Linq;

namespace GymFit.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Utilizatorul trebuie să fie cel puțin logat pentru a accesa controllerul
    public class RoomController : ControllerBase
    {
        private readonly GymFitContext _context;

        // Dependency Injection of the database context
        public RoomController(GymFitContext context)
        {
            _context = context;
        }

        [HttpGet]
        [EnableQuery]
        public IActionResult Get([FromQuery] int? companyId)
        {
            // 🎯 FILTRARE LOCALĂ: Dacă frontend-ul trimite un companyId în URL,
            // aducem doar sălile fizice din acel oraș/sediu.
            if (companyId.HasValue)
            {
                var localRooms = _context.Rooms.Where(r => r.CompanyId == companyId.Value);
                return Ok(localRooms);
            }

            // Returnăm DbSet-ul direct din baza de date în caz că nu se trimite filtru
            return Ok(_context.Rooms);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")] // Doar utilizatorii cu rolul "Admin" pot crea o sală
        public IActionResult Post([FromBody] Room room)
        {
            if (room == null)
            {
                return BadRequest("Invalid room data.");
            }

            // 🎯 EXTRAGEM COMPANIE DIN TOKEN-UL JWT AL ADMINULUI
            var companyIdClaim = User.FindFirst("companyId")?.Value;

            if (!string.IsNullOrEmpty(companyIdClaim) && int.TryParse(companyIdClaim, out int tokenCompanyId))
            {
                room.CompanyId = tokenCompanyId; // Îi punem automat ID-ul sediului de unde aparține Adminul
            }
            else if (room.CompanyId == 0)
            {
                room.CompanyId = 1; // Fallback final pe sediul central
            }

            try
            {
                _context.Rooms.Add(room);
                _context.SaveChanges(); // Persisting the data to the database
                return Ok(room);
            }
            catch (System.Exception ex)
            {
                // Returnăm eroarea reală a bazei de date ca să o vedem la test dacă mai crapă ceva
                return StatusCode(500, $"Database error: {ex.InnerException?.Message ?? ex.Message}");
            }
        }
    }
}