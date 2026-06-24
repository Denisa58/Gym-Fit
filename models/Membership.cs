using System;
using System.Collections.Generic;
using System.Text;

namespace GymFit.models
{
    public class Membership
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public int DurationMonths { get; set; }
        public string Description { get; set; }
        public bool HasPoolAccess { get; set; }
        public bool HasSaunaAccess { get; set; }
        public bool HasTrainerIncluded { get; set; }
        public int MaxWorkoutsPerWeek { get; set; }

        public Membership() { }
        public Membership(int id, string name, decimal price, int durationMonths, string description, bool hasPoolAccess, bool hasSaunaAccess, bool hasTrainerIncluded, int maxWorkoutsPerWeek)
        {
            Id = id;
            Name = name;
            Price = price;
            DurationMonths = durationMonths;
            Description = description;
            HasPoolAccess = hasPoolAccess;
            HasSaunaAccess = hasSaunaAccess;
            HasTrainerIncluded = hasTrainerIncluded;
            MaxWorkoutsPerWeek = maxWorkoutsPerWeek;
        }

    }
}
