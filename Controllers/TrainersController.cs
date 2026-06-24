using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.Authorization;
using GymFit.models;
using System;
using System.Collections.Generic;
using System.Linq;
using GymFit.Data;

namespace GymFit.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TrainersController : ControllerBase
    {
        private readonly GymFitContext _context;

        public TrainersController(GymFitContext context)
        {
            _context = context;
        }

        [HttpGet]
        [EnableQuery] // 🎯 Permite OData să aplice automat filtrele ($filter, $select etc.) trimise din React
        public IQueryable<Trainer> Get([FromQuery] int? companyId)
        {
            // 🎯 REPARAT ODATA: Returnăm IQueryable direct pentru ca structura JSON (.value) să fie predictibilă
            if (companyId.HasValue)
            {
                return _context.Trainers.Where(t => t.CompanyId == companyId.Value);
            }

            return _context.Trainers;
        }

        // 🎯 RUTA INTRODUSĂ: Rezolvă eroarea 404 din React pentru api/Trainers/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var trainer = _context.Trainers.FirstOrDefault(t => t.Id == id);

            if (trainer == null)
            {
                return NotFound($"Trainerul cu ID-ul {id} nu a fost găsit.");
            }

            return Ok(trainer);
        }

        [HttpGet("specialization/{spec}")]
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

        [HttpPost]
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

                // 🎯 EXTRAGEM COMPANY ID TRIMIS DIN REACT
                int companyId = 1; // Valoare implicită de siguranță
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

                // Extragem anii trimiși din React
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

                return Ok(new { message = $"Trainerul {trainer.FirstName} {trainer.LastName} a fost adăugat cu succes!" });
            }
            catch (Exception ex)
            {
                var detailedError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Eroare la salvarea în baza de date: {detailedError}");
            }
        }
    }
}