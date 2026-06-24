using GymFit.Data;
using GymFit.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;

namespace GymFit.Controllers
{
    public class ClientsController : ODataController
    {
        private readonly GymFitContext _context;

        public ClientsController(GymFitContext context)
        {
            _context = context;
        }

        [HttpGet]
        [EnableQuery]
        [Authorize(Roles = "Admin")] // Doar Adminul poate vedea lista de clienți
        public IActionResult Get([FromQuery] int? companyId)
        {
            // 🎯 FILTRARE LOCALĂ: Dacă se trimite un companyId, aducem doar clienții din acel oraș
            if (companyId.HasValue)
            {
                var localClients = _context.Clients.Where(c => c.CompanyId == companyId.Value);
                return Ok(localClients);
            }

            return Ok(_context.Clients);
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Trainer,Client")]
        public IActionResult Get(int key)
        {
            var client = _context.Clients.FirstOrDefault(c => c.Id == key);
            if (client == null) return NotFound("Clientul nu a fost găsit.");
            return Ok(client);
        }

        [HttpPost]
        public IActionResult Post([FromBody] Clients newClient)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (_context.Clients.Any(c => c.Email == newClient.Email))
            {
                return BadRequest("Eroare: Acest email este deja înregistrat.");
            }

            // 🎯 Dacă dintr-un motiv oarecare React nu trimite CompanyId (ex: la autoregistrare publică pe site),
            // îi punem o valoare implicită 1 (Sediu central). Dacă vine de la Admin, va avea deja valoarea din payload.
            if (newClient.CompanyId == 0)
            {
                newClient.CompanyId = 1;
            }

            _context.Clients.Add(newClient);
            _context.SaveChanges();

            return Created(newClient);
        }

        [HttpPost("choose-membership")]
        [Authorize]
        public IActionResult ChooseMembership(int clientId, int membershipId)
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

        [HttpPost("enroll")]
        [Authorize]
        public IActionResult Enroll(int clientId, int sessionId)
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

        [HttpDelete]
        [Authorize(Roles = "Admin")]
        public IActionResult Delete(int key)
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