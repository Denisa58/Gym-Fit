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

        public WorkoutsController(GymFitContext context)
        {
            _context = context;
        }

        [HttpGet]
        [EnableQuery] // 🎯 Permite OData să aplice filtrele automat direct pe query-ul bazei de date
        public IQueryable<Workout> Get([FromQuery] int? companyId)
        {
            // 🎯 REPARAT PENTRU ODATA: Returnăm direct IQueryable (fără Ok()) pentru a asigura o structură predictibilă a datelor
            if (companyId.HasValue)
            {
                return _context.Workouts.Where(w => w.CompanyId == companyId.Value);
            }

            return _context.Workouts;
        }

        [HttpGet("difficulty/{level}")]
        public IActionResult GetByDifficulty(string level, [FromQuery] int? companyId)
        {
            if (Enum.TryParse(typeof(Difficulty), level, true, out var difficultyEnum))
            {
                var query = _context.Workouts.Where(w => w.DifficultyLevel.Equals(difficultyEnum));

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
                string name = rawData.GetProperty("name").GetString();
                string description = rawData.GetProperty("description").GetString();
                string difficultyStr = rawData.GetProperty("difficultyLevel").GetString();
                int duration = rawData.GetProperty("estimatedDuration").GetInt32();
                int calories = rawData.GetProperty("averageCaloriesBurned").GetInt32();

                int companyId = 1;
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

                if (!Enum.TryParse(typeof(Difficulty), difficultyStr, true, out var difficultyEnum))
                {
                    return BadRequest("Difficulty level is invalid.");
                }

                Workout workout = new Workout
                {
                    Id = 0, // Auto-increment în Postgres
                    Name = name,
                    Description = description,
                    DifficultyLevel = (Difficulty)difficultyEnum,
                    EstimatedDuration = duration,
                    AverageCaloriesBurned = calories,
                    CompanyId = companyId
                };

                _context.Workouts.Add(workout);
                _context.SaveChanges();

                return Ok(workout);
            }
            catch (Exception ex)
            {
                return BadRequest($"Server error: {ex.Message}");
            }
        }
    }
}