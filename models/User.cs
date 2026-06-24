using System;
using System.Collections.Generic;
using System.Text;

namespace GymFit.models
{
    public class User
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }

        public string PhoneNumber { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? ResetTokenExpires { get; set; }
        public string? ProfilePictureUrl { get; set; }

        public string Role { get; set; } = "Client";

        public User() { }

        public User(int id, string firstName, string lastName, string email, string password, string phoneNumber)
        {
            Id = id;
            FirstName = firstName;
            LastName = lastName;
            Email = email;
            Password = password;
            PhoneNumber = phoneNumber;
        }

    }
}
