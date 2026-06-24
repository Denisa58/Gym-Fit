using GymFit.Data;
using GymFit.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers; // 👈 Adăugat pentru ODataController
using Microsoft.AspNetCore.OData.Formatter;           // 👈 Adăugat pentru FromODataUri
using System;
using System.Linq;

namespace GymFit.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdminsController : ODataController // 🎯 Modificat: Moștenește ODataController și am eliminat [Route("api/[controller]")]
    {
        private readonly GymFitContext _context;

        public AdminsController(GymFitContext context)
        {
            _context = context;
        }

        // GET: odata/Admins
        [HttpGet]
        [EnableQuery]
        public IActionResult Get()
        {
            return Ok(_context.Admins);
        }

        // GET: odata/Admins(5)
        [HttpGet]
        [EnableQuery]
        public IActionResult Get([FromODataUri] int key) // 🎯 Modificat conform convențiilor OData (numele metodei și parametrul 'key')
        {
            var admin = _context.Admins.FirstOrDefault(a => a.Id == key);
            if (admin == null)
                return NotFound("Admin not found.");

            return Ok(admin);
        }

        // POST: odata/Admins
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

                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
                {
                    return BadRequest("Toate câmpurile obligatorii (Email, Parolă) trebuie completate.");
                }

                var existingAdmin = _context.Admins.FirstOrDefault(a => a.Email == email);
                if (existingAdmin != null)
                {
                    return BadRequest("Un administrator cu acest email există deja în baza de date.");
                }

                string hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

                var newAdmin = new Admin(
                    0,
                    firstName,
                    lastName,
                    email,
                    hashedPassword,
                    phoneNumber,
                    companyId
                );

                _context.Admins.Add(newAdmin);
                _context.SaveChanges();

                // 🎯 Modificat: Pentru OData, returnăm entitatea creată folosind metoda "Created(entity)"
                return Created(newAdmin);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Eroare internă la crearea administratorului: {ex.Message}");
            }
        }

        // DELETE: odata/Admins(5)
        [HttpDelete]
        public IActionResult Delete([FromODataUri] int key) // 🎯 Modificat conform convențiilor OData
        {
            var admin = _context.Admins.FirstOrDefault(a => a.Id == key);
            if (admin == null)
                return NotFound("Admin not found.");

            _context.Admins.Remove(admin);
            _context.SaveChanges();

            return NoContent();
        }
    }
}