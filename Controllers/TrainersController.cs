using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers; // 🎯 Adăugat pentru ODataController
using Microsoft.AspNetCore.OData.Formatter;         // 🎯 Adăugat pentru [FromODataUri]
using Microsoft.AspNetCore.Authorization;
using GymFit.models;
using System;
using System.Collections.Generic;
using System.Linq;
using GymFit.Data;

namespace GymFit.Controllers
{
    [ApiController] // Păstrăm stilul hibrid stabil
    [Authorize]
    public class TrainersController : ODataController // 🎯 Modificat: Moștenește din ODataController
    {
        private readonly GymFitContext _context;

        public TrainersController(GymFitContext context)
        {
            _context = context;
        }

        // 1. CITEȘTE TOȚI TRAINERII (GET /odata/Trainers)
        [HttpGet("odata/Trainers")]
        [EnableQuery]
        public IActionResult Get([FromQuery] int? companyId)
        {
            if (companyId.HasValue)
            {
                var filtered = _context.Trainers.Where(t => t.CompanyId == companyId.Value);
                return Ok(filtered);
            }

            return Ok(_context.Trainers);
        }

        // 2. CITEȘTE UN SINGUR TRAINER (GET /odata/Trainers(1))
        [HttpGet("odata/Trainers({key})")]
        [EnableQuery]
        public IActionResult Get([FromODataUri] int key)
        {
            var trainer = _context.Trainers.FirstOrDefault(t => t.Id == key);

            if (trainer == null)
            {
                return NotFound($"Trainerul cu ID-ul {key} nu a fost găsit.");
            }

            return Ok(trainer);
        }

        // 3. FILTRARE DUPĂ SPECIALIZARE (Ruta custom: GET /odata/Trainers/specialization/{spec})
        [HttpGet("odata/Trainers/specialization/{spec}")]
        public IActionResult GetBySpecialization(string spec)
        {
            if (string.IsNullOrEmpty(spec))
            {
                return BadRequest("Specialization filter is required.");
            }

            var filteredTrainers = _context.Trainers
                .Where(t => t.Specialization.ToLower() == spec.ToLower())
                .ToList();

            if (!filteredTrainers.Any())
            {
                return NotFound($"No trainers found with the specialization: {spec}");
            }

            return Ok(filteredTrainers);
        }

        // 4. ADĂUGARE TRAINER NOU (POST /odata/Trainers)
        [HttpPost("odata/Trainers")]
        [Authorize(Roles = "Admin")]
        public IActionResult Post([FromBody] System.Text.Json.JsonElement body)
        {
            try
            {
                string email = body.GetProperty("email").GetString();
                string password = body.GetProperty("password").GetString();
                string firstName = body.GetProperty("firstName").GetString();
                string lastName = body.GetProperty("lastName").GetString();
                string phoneNumber = body.TryGetProperty("phoneNumber", out var phoneProp) ? phoneProp.GetString() : "";
                string specialization = body.TryGetProperty("specialization", out var specProp) ? specProp.GetString() : "General";

                int companyId = 1;
                if (body.TryGetProperty("companyId", out var compProp))
                {
                    if (compProp.ValueKind == System.Text.Json.JsonValueKind.Number)
                    {
                        companyId = compProp.GetInt32();
                    }
                    else if (compProp.ValueKind == System.Text.Json.JsonValueKind.String && int.TryParse(compProp.GetString(), out var parsedComp))
                    {
                        companyId = parsedComp;
                    }
                }

                int experienceYears = 0;
                if (body.TryGetProperty("yearsOfExperience", out var expProp))
                {
                    if (expProp.ValueKind == System.Text.Json.JsonValueKind.Number)
                    {
                        experienceYears = expProp.GetInt32();
                    }
                    else if (expProp.ValueKind == System.Text.Json.JsonValueKind.String && int.TryParse(expProp.GetString(), out var parsedExp))
                    {
                        experienceYears = parsedExp;
                    }
                }

                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
                {
                    return BadRequest("Toate câmpurile obligatorii (Email, Parolă) trebuie completate.");
                }

                var existingTrainer = _context.Trainers.FirstOrDefault(t => t.Email == email);
                if (existingTrainer != null)
                {
                    return BadRequest("Un trainer cu acest email există deja în baza de date.");
                }

                string hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

                var trainer = new Trainer
                {
                    Id = 0, // Ne asigurăm că lăsăm baza de date să auto-incrementeze ID-ul
                    FirstName = firstName,
                    LastName = lastName,
                    Email = email,
                    PhoneNumber = phoneNumber,
                    Password = hashedPassword,
                    Role = "Trainer",
                    Specialization = string.IsNullOrEmpty(specialization) ? "General" : specialization,
                    ExperienceYears = experienceYears,
                    CompanyId = companyId
                };

                _context.Trainers.Add(trainer);
                _context.SaveChanges();

                // Folosim metoda nativă Created() din ODataController pentru un răspuns 201 standardizat
                return Created(trainer);
            }
            catch (Exception ex)
            {
                var detailedError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Eroare la salvarea în baza de date: {detailedError}");
            }
        }
    }
}