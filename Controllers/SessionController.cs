using GymFit.Data;
using GymFit.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Microsoft.AspNetCore.OData.Formatter;         
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GymFit.Controllers
{
    [ApiController]
    [Authorize]
    public class SessionsController : ODataController 
    {
        private readonly GymFitContext _context;

        public SessionsController(GymFitContext context)
        {
            _context = context;
        }

        // 1. CITEȘTE TOATE SESIUNILE (Ruta OData: GET /odata/Sessions)
        [HttpGet("odata/Sessions")]
        [EnableQuery]
        public IActionResult Get([FromQuery] int? companyId)
        {
            try
            {
                var query = _context.Sessions.AsQueryable();
                if (companyId.HasValue)
                {
                    query = query.Where(s => s.CompanyId == companyId.Value);
                }

                var sessions = query.ToList();
                var allClients = _context.Clients.ToList();

                // Mapăm manual înscrierile clienților în memorie (păstrăm logica ta actuală)
                foreach (var session in sessions)
                {
                    session.EnrolledClients = new List<Clients>();

                    var enrolled = allClients
                        .Where(c => c.EnrolledSessionIds != null && c.EnrolledSessionIds.Contains(session.Id))
                        .ToList();

                    if (enrolled.Any())
                    {
                        session.EnrolledClients.AddRange(enrolled);
                    }
                }

                return Ok(sessions);
            }
            catch (Exception ex)
            {
                return BadRequest($"Could not fetch sessions: {ex.Message}");
            }
        }

        // 2. CITEȘTE O SINGURĂ SESIUNE (Ruta OData: GET /odata/Sessions(1))
        [HttpGet("odata/Sessions({key})")]
        [EnableQuery]
        public IActionResult Get([FromODataUri] int key)
        {
            var session = _context.Sessions.FirstOrDefault(s => s.Id == key);
            if (session == null) return NotFound($"Session with ID {key} not found.");

            var allClients = _context.Clients.ToList();
            session.EnrolledClients = allClients
                .Where(c => c.EnrolledSessionIds != null && c.EnrolledSessionIds.Contains(session.Id))
                .ToList();

            return Ok(session);
        }

        // 3. CREARE SESIUNE SIMPLĂ (Ruta OData: POST /odata/Sessions)
        [HttpPost("odata/Sessions")]
        [Authorize(Roles = "Admin,Trainer")]
        public IActionResult Post([FromBody] Session session)
        {
            if (session == null)
                return BadRequest("Invalid session data.");

            if (session.CompanyId == 0)
            {
                session.CompanyId = 1;
            }

            session.StartTime = DateTime.SpecifyKind(session.StartTime, DateTimeKind.Utc); //  Corect
            _context.Sessions.Add(session);
            _context.SaveChanges();

            return Created(session); // Standard OData
        }

        // 🎯 RUTE HYBRID CUSTOM (Rămân neschimbate ca să se pupe la fix cu formularele din React)
        [HttpGet("api/Sessions/by-date")]
        public IActionResult GetSessionsByDate([FromQuery] DateTime date, [FromQuery] int? companyId)
        {
            try
            {
                var utcDate = date.ToUniversalTime().Date;
                var query = _context.Sessions.Where(s => s.StartTime.Date == utcDate);

                if (companyId.HasValue)
                {
                    query = query.Where(s => s.CompanyId == companyId.Value);
                }

                var sessions = query.ToList();
                var allClients = _context.Clients.ToList();

                foreach (var session in sessions)
                {
                    session.EnrolledClients = new List<Clients>();
                    var enrolled = allClients
                        .Where(c => c.EnrolledSessionIds != null && c.EnrolledSessionIds.Contains(session.Id))
                        .ToList();

                    if (enrolled.Any())
                    {
                        session.EnrolledClients.AddRange(enrolled);
                    }
                }

                return Ok(sessions);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("api/Sessions/validate-and-create")]
        [Authorize(Roles = "Admin,Trainer")]
        public IActionResult CreateWithValidation([FromBody] SessionRequest request)
        {
            if (request.Session == null || request.Room == null)
            {
                return BadRequest("Session or Room data is missing.");
            }

            if (request.Session.MaxCapacity > request.Room.MaxCapacity)
            {
                return BadRequest("Error: Session capacity exceeds the room's maximum capacity!");
            }

            if (request.Session.CompanyId == 0)
            {
                request.Session.CompanyId = 1;
            }

            request.Session.StartTime = request.Session.StartTime.Kind == DateTimeKind.Utc
                ? request.Session.StartTime
                : request.Session.StartTime.ToUniversalTime();

            request.Session.EndTime = request.Session.EndTime.Kind == DateTimeKind.Utc
                ? request.Session.EndTime
                : request.Session.EndTime.ToUniversalTime();

            _context.Sessions.Add(request.Session);
            _context.SaveChanges();

            return Ok("Session created successfully!");
        }

        [HttpPost("api/Sessions/enroll")]
        [Authorize]
        public IActionResult EnrollClient([FromBody] BookingDto request)
        {
            if (request == null || request.SessionId <= 0 || request.UserId <= 0)
            {
                return BadRequest("Invalid Session ID or User ID.");
            }

            var session = _context.Sessions
                .Include(s => s.EnrolledClients)
                .FirstOrDefault(s => s.Id == request.SessionId);

            if (session == null)
            {
                return NotFound("The requested session does not exist.");
            }

            var client = _context.Clients.FirstOrDefault(c => c.Id == request.UserId);
            if (client == null)
            {
                return BadRequest($"Clientul cu ID-ul {request.UserId} nu a fost găsit în baza de date!");
            }

            try
            {
                if (session.EnrolledClients == null) session.EnrolledClients = new List<Clients>();
                if (client.EnrolledSessionIds == null) client.EnrolledSessionIds = new List<int>();

                if (client.EnrolledSessionIds.Contains(request.SessionId) || session.EnrolledClients.Any(c => c.Id == client.Id))
                {
                    return BadRequest("You are already enrolled in this class.");
                }

                session.EnrolledClients.Add(client);
                client.EnrolledSessionIds.Add(request.SessionId);

                _context.SaveChanges();
                return Ok("🎯 Client enrolled successfully!");
            }
            catch (Exception ex)
            {
                return BadRequest($"Database saving failed. Error details: {ex.Message}");
            }
        }
    }

    public class BookingDto
    {
        public int SessionId { get; set; }
        public int UserId { get; set; }
    }

    public class SessionRequest
    {
        public Session Session { get; set; }
        public Room Room { get; set; }
    }
}