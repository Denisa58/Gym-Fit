using GymFit.Data;
using GymFit.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;

namespace GymFit.Controllers
{
    [ApiController] 
    [Authorize]
    public class WorkoutsController : ODataController
    {
        private readonly GymFitContext _context;

        public WorkoutsController(GymFitContext context)
        {
            _context = context;
        }

        // 🎯 FIX DEFINITIV: Forțăm manual ruta exact așa cum ai făcut la Rooms
        [HttpGet("odata/Workouts")]
        [EnableQuery]
        public IActionResult Get([FromQuery] int? companyId)
        {
            if (companyId.HasValue)
            {
                var filtered = _context.Workouts.Where(w => w.CompanyId == companyId.Value);
                return Ok(filtered);
            }

            return Ok(_context.Workouts);
        }

        // 🎯 FIX POST: Forțăm manual și ruta de salvare pentru formularul din ecran
        [HttpPost("odata/Workouts")]
        [Authorize(Roles = "Admin,Trainer")]
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
                    Id = 0,
                    Name = name,
                    Description = description,
                    DifficultyLevel = (Difficulty)difficultyEnum,
                    EstimatedDuration = duration,
                    AverageCaloriesBurned = calories,
                    CompanyId = companyId
                };

                _context.Workouts.Add(workout);
                _context.SaveChanges();

                return Created(workout);
            }
            catch (Exception ex)
            {
                return BadRequest($"Server error: {ex.Message}");
            }
        }

        [HttpDelete("odata/Workouts({key})")]
        [Authorize(Roles = "Admin")]
        public IActionResult Delete([FromRoute] int key)
        {
            var workout = _context.Workouts.FirstOrDefault(w => w.Id == key);
            if (workout == null)
            {
                return NotFound();
            }

            _context.Workouts.Remove(workout);
            _context.SaveChanges();

            return NoContent();
        }
    }
}