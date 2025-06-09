using Microsoft.AspNetCore.Identity;
using Smart_Attendance_System.Model;

namespace Smart_Attendance_System.Data
{
    public class DbInitializer
    {
        public static void Initialize(ApplicationDbContext context)
        {
            // Make sure the database is created
            context.Database.EnsureCreated();

            // Seed default users if not exists
            if (!context.Users.Any())
            {
                var hasher = new PasswordHasher<User>();

                var admin = new User
                {
                    Username = "admin",
                    Email = "admin@smartattendance.com",
                    EmployeeId = "EMP001",
                    Role = "Admin",
                    CreatedAt = DateTime.UtcNow
                };
                admin.PasswordHash = hasher.HashPassword(admin, "Admin@123");

                var employee = new User
                {
                    Username = "john",
                    Email = "john@company.com",
                    EmployeeId = "EMP002",
                    Role = "Employee",
                    CreatedAt = DateTime.UtcNow
                };
                employee.PasswordHash = hasher.HashPassword(employee, "John@123");

                context.Users.AddRange(admin, employee);
                context.SaveChanges();
            }

            // Seed other tables if needed
        }
    }
}
