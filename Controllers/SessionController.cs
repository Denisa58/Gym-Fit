using GymFit.Data;
using GymFit.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GymFit.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Utilizatorul trebuie să fie cel puțin logat pentru a interacționa cu sesiunile
    public class SessionsController : ControllerBase
    {
        private readonly GymFitContext _context;

        public SessionsController(GymFitContext context)
        {
            _context = context;
        }

        // --- REZOLVARE AFIȘARE ÎNSCRIERI REALE ȘI FILTRARE COMPANIE ---
        [HttpGet]
        [EnableQuery]
        public IActionResult Get([FromQuery] int? companyId)
        {
            try
            {
                // 1. Preluăm sesiunile și aplicăm filtrarea pe baza orașului/sălii (CompanyId)
                var query = _context.Sessions.AsQueryable();
                if (companyId.HasValue)
                {
                    query = query.Where(s => s.CompanyId == companyId.Value);
                }

                var sessions = query.ToList();
                var allClients = _context.Clients.ToList();

                // 2. Mapăm manual înscrierile clienților în memorie
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

        [HttpGet("by-date")]
        public IActionResult GetSessionsByDate([FromQuery] DateTime date, [FromQuery] int? companyId)
        {
            try
            {
                var utcDate = date.ToUniversalTime().Date;

                var query = _context.Sessions.Where(s => s.StartTime.Date == utcDate);

                // 🎯 FILTRARE LOCALĂ: Aplicăm filtrarea după oraș și la calendarul pe zile
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

        [HttpPost]
        [Authorize(Roles = "Admin,Trainer")] // Doar Adminul și Trainerii pot publica o sesiune simplă
        public IActionResult CreateSession([FromBody] Session session)
        {
            if (session == null)
                return BadRequest("Invalid session data.");

            // 🎯 SIGURANȚĂ: Alocăm sediul central (1) dacă React omite din greșeală CompanyId-ul
            if (session.CompanyId == 0)
            {
                session.CompanyId = 1;
            }

            session.StartTime = DateTime.SpecifyKind(session.StartTime, DateTimeKind.Utc);
            _context.Sessions.Add(session);
            _context.SaveChanges();

            return CreatedAtAction(nameof(Get), new { id = session.Id }, session);
        }

        [HttpPost("validate-and-create")]
        [Authorize(Roles = "Admin,Trainer")] // Validarea și publicarea claselor este strict pentru staff
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

            // 🎯 SIGURANȚĂ: Ne asigurăm că sesiunea preia CompanyId-ul corect trimis în cerere
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

        [HttpPost("enroll")]
        [Authorize] // Clienții se pot înscrie singuri, iar Adminul îi poate înscrie manual din sistem
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
                if (session.EnrolledClients == null)
                {
                    session.EnrolledClients = new List<Clients>();
                }
                if (client.EnrolledSessionIds == null)
                {
                    client.EnrolledSessionIds = new List<int>();
                }

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