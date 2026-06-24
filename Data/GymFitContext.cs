using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using GymFit.models;

namespace GymFit.Data
{
    public class GymFitContext : DbContext
    {
        public GymFitContext(DbContextOptions<GymFitContext> options) : base(options) { }

        public DbSet<Clients> Clients { get; set; }
        public DbSet<Trainer> Trainers { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Workout> Workouts { get; set; }
        public DbSet<Session> Sessions { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Membership> Memberships { get; set; }
        public DbSet<Company> Companies { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // Ignoră avertismentul de model pending pentru .NET 9
            optionsBuilder.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}