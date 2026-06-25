using GymFit.Data;
using GymFit.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers; 
using Microsoft.AspNetCore.OData.Formatter;         
using System;
using System.Linq;

namespace GymFit.Controllers
{
    [ApiController]
    [Authorize]
    public class RoomController : ODataController 
    {
        private readonly GymFitContext _context;

        public RoomController(GymFitContext context)
        {
            _context = context;
        }

        // 1. CITEȘTE TOATE SĂLILE (Ruta OData: GET /odata/Rooms)
        [HttpGet("odata/Rooms")]
        [EnableQuery]
        public IActionResult Get([FromQuery] int? companyId)
        {
            // 🎯 COMANPATIBILITATE HYBRIDĂ: Dacă frontend-ul trimite încă parametrul clasic în query (?companyId=x)
            if (companyId.HasValue)
            {
                var localRooms = _context.Rooms.Where(r => r.CompanyId == companyId.Value);
                return Ok(localRooms);
            }

            // Returnăm DbSet-ul direct; OData va aplica automat filtrele server-side ($filter, $select etc.)
            return Ok(_context.Rooms);
        }

        // 2. CITEȘTE O SINGURĂ SALĂ (Ruta OData: GET /odata/Rooms(1))
        [HttpGet("odata/Rooms({key})")]
        [EnableQuery]
        public IActionResult Get([FromODataUri] int key)
        {
            var room = _context.Rooms.FirstOrDefault(r => r.Id == key);

            if (room == null)
                return NotFound($"Room with ID {key} not found.");

            return Ok(room);
        }

        // 3. ADĂUGARE SALĂ NOUĂ (POST /odata/Rooms)
        [HttpPost("odata/Rooms")]
        [Authorize(Roles = "Admin")]
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
                room.CompanyId = tokenCompanyId;
            }
            else if (room.CompanyId == 0)
            {
                room.CompanyId = 1;
            }

            try
            {
                _context.Rooms.Add(room);
                _context.SaveChanges();

                return Created(room); // Standard OData returnează 201 Created prin metoda specială Created()
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Database error: {ex.InnerException?.Message ?? ex.Message}");
            }
        }
    }
}