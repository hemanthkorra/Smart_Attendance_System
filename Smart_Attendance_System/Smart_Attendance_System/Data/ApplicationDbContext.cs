using Microsoft.EntityFrameworkCore;
using Smart_Attendance_System.Model;

namespace Smart_Attendance_System.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Users table
        public DbSet<User> Users { get; set; }

        // Attendance records table
        public DbSet<Attendance> Attendances { get; set; }

        // Leave requests table
        public DbSet<LeaveRequest> LeaveRequests { get; set; }

        // If you have a separate attendance summary table (like in UserController)
        public DbSet<AttendanceRecord> AttendanceRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.Property(u => u.Username).IsRequired().HasMaxLength(50);
                entity.Property(u => u.Email).HasMaxLength(100);
                entity.Property(u => u.Role).IsRequired().HasMaxLength(20);
                entity.Property(u => u.PasswordHash).IsRequired();
                entity.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                // Add unique indexes
                entity.HasIndex(u => u.Username).IsUnique();
                entity.HasIndex(u => u.EmployeeId).IsUnique();
            });

            // Configure Attendance entity
            modelBuilder.Entity<Attendance>(entity =>
            {
                entity.HasKey(a => a.Id);
                entity.Property(a => a.Method).IsRequired().HasMaxLength(20);
                entity.Property(a => a.Timestamp).IsRequired();

                // Relationship to User
                entity.HasOne(a => a.User)
                      .WithMany(u => u.Attendances)
                      .HasForeignKey(a => a.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure LeaveRequest entity
            modelBuilder.Entity<LeaveRequest>(entity =>
            {
                entity.HasKey(l => l.Id);
                entity.Property(l => l.StartDate).IsRequired();
                entity.Property(l => l.EndDate).IsRequired();
                entity.Property(l => l.Reason).HasMaxLength(500);
                entity.Property(l => l.Status).IsRequired().HasMaxLength(20);

                // Relationship to User
                entity.HasOne(l => l.User)
                      .WithMany(u => u.LeaveRequests)
                      .HasForeignKey(l => l.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure AttendanceRecord entity if exists (summary for UserController)
            modelBuilder.Entity<AttendanceRecord>(entity =>
            {
                entity.HasKey(ar => ar.Id);
                entity.Property(ar => ar.Date).IsRequired();
                entity.Property(ar => ar.Status).IsRequired().HasMaxLength(20);
                entity.Property(ar => ar.CheckInTime);
                entity.Property(ar => ar.CheckOutTime);

                entity.HasOne(ar => ar.User)
                      .WithMany(u => u.AttendanceRecords)
                      .HasForeignKey(ar => ar.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
