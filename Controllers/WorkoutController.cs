using GymFit.Data;
using GymFit.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using System;
using System.Collections.Generic;
using System.Linq;

namespace GymFit.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Utilizatorul trebuie să fie logat pentru a accesa controllerul
    public class WorkoutsController : ControllerBase
    {
        private readonly GymFitContext _context;

        // Dependency Injection: Replacing the static list with the DB Context
        public WorkoutsController(GymFitContext context)
        {
            _context = context;
        }

        [HttpGet]
        [EnableQuery]
        public IActionResult Get([FromQuery] int? companyId)
        {
            // 🎯 FILTRARE LOCALĂ: Dacă frontend-ul trimite un companyId în URL,
            // returnăm doar tipurile de antrenamente disponibile în acel oraș/sediu.
            if (companyId.HasValue)
            {
                var localWorkouts = _context.Workouts.Where(w => w.CompanyId == companyId.Value);
                return Ok(localWorkouts);
            }

            // Returning the DbSet directly from the database
            return Ok(_context.Workouts);
        }

        [HttpGet("difficulty/{level}")]
        public IActionResult GetByDifficulty(string level, [FromQuery] int? companyId)
        {
            // Attempting to parse the string into the Difficulty Enum
            if (Enum.TryParse(typeof(Difficulty), level, true, out var difficultyEnum))
            {
                // Querying the database for workouts with the specific difficulty level
                var query = _context.Workouts.Where(w => w.DifficultyLevel.Equals(difficultyEnum));

                // 🎯 FILTRARE LOCALĂ: Aplicăm filtrarea după oraș și la căutarea după dificultate
                if (companyId.HasValue)
                {
                    query = query.Where(w => w.CompanyId == companyId.Value);
                }

                return Ok(query.ToList());
            }

            return BadRequest("The provided difficulty level is not valid.");
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Trainer")] // Doar Adminul sau Trainerii pot crea tipuri noi de antrenamente
        public IActionResult Post([FromBody] System.Text.Json.JsonElement rawData)
        {
            try
            {
                // Citim valorile indiferent dacă vin cu literă mare sau mică din React
                string name = rawData.GetProperty("name").GetString();
                string description = rawData.GetProperty("description").GetString();
                string difficultyStr = rawData.GetProperty("difficultyLevel").GetString();
                int duration = rawData.GetProperty("estimatedDuration").GetInt32();
                int calories = rawData.GetProperty("averageCaloriesBurned").GetInt32();

                // 🎯 EXTRAGEM COMPANY ID TRIMIS DIN REACT
                int companyId = 1; // Valoare implicită de siguranță
                if (rawData.TryGetProperty("companyId", out var compProp))
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

                // Convertim manual string-ul în Enum-ul tău C#
                if (!Enum.TryParse(typeof(Difficulty), difficultyStr, true, out var difficultyEnum))
                {
                    return BadRequest("Difficulty level is invalid.");
                }

                // Creăm obiectul Workout curat (Id = 0 pentru ca Postgres să-i dea auto-increment)
                Workout workout = new Workout
                {
                    Id = 0,
                    Name = name,
                    Description = description,
                    DifficultyLevel = (Difficulty)difficultyEnum,
                    EstimatedDuration = duration,
                    AverageCaloriesBurned = calories,

                    // 🎯 SALVARE ÎN BAZA DE DATE: Adăugăm ID-ul orașului/sălii
                    CompanyId = companyId
                };

                _context.Workouts.Add(workout);
                _context.SaveChanges(); // Se salvează în baza de date!

                return Ok(workout);
            }
            catch (Exception ex)
            {
                return BadRequest($"Server error: {ex.Message}");
            }
        }
    }
}