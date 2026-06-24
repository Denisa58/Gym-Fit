using GymFit.Data;
using GymFit.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OData.Query;
using System;
using System.Linq;

namespace GymFit.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly GymFitContext _context;

        // Dependency Injection: Injecting the database context
        public AdminController(GymFitContext context)
        {
            _context = context;
        }

        [HttpGet]
        [EnableQuery]
        public IActionResult Get()
        {
            // Returns all admins from the database
            return Ok(_context.Admins);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var admin = _context.Admins.FirstOrDefault(a => a.Id == id);
            if (admin == null)
                return NotFound("Admin not found.");

            return Ok(admin);
        }

        [HttpPost]
        public IActionResult Post([FromBody] System.Text.Json.JsonElement body)
        {
            try
            {
                string email = body.GetProperty("email").GetString();
                string password = body.GetProperty("password").GetString();
                string firstName = body.GetProperty("firstName").GetString();
                string lastName = body.GetProperty("lastName").GetString();
                string phoneNumber = body.TryGetProperty("phoneNumber", out var phoneProp) ? phoneProp.GetString() : "";

                // Extragem ID-ul companiei trimis din React
                int companyId = 1; // ⚠️ ASIGURĂ-TE CĂ ID-ul 1 EXISTĂ ÎN TABELA COMPANIES!
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

                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
                {
                    return BadRequest("Toate câmpurile obligatorii (Email, Parolă) trebuie completate.");
                }

                var existingAdmin = _context.Admins.FirstOrDefault(a => a.Email == email);
                if (existingAdmin != null)
                {
                    return BadRequest("Un administrator cu acest email există deja în baza de date.");
                }

                // Criptăm parola
                string hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

                // 🎯 REZOLVARE CS7036: Apelăm constructorul cu parametri definit în clasa Admin
                var newAdmin = new Admin(
                    0, // ID primar autogenerat de DB
                    firstName,
                    lastName,
                    email,
                    hashedPassword,
                    phoneNumber,
                    companyId
                );

                _context.Admins.Add(newAdmin);
                _context.SaveChanges(); // Salvează în PostgreSQL

                return CreatedAtAction(nameof(GetById), new { id = newAdmin.Id }, newAdmin);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Eroare internă la crearea administratorului: {ex.Message}");
            }
        }
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var admin = _context.Admins.FirstOrDefault(a => a.Id == id);
            if (admin == null)
                return NotFound("Admin not found.");

            _context.Admins.Remove(admin);
            _context.SaveChanges(); // Removes from database

            return NoContent(); // Success, no content to return
        }
    }
}