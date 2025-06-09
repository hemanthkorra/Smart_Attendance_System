using System.ComponentModel.DataAnnotations;

namespace Smart_Attendance_System.Model
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = "User"; // "User" or "Admin"

        [Required]
        [MaxLength(20)]
        public string EmployeeId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Department { get; set; } = "General";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Attendance> Attendances { get; set; }
        public ICollection<LeaveRequest> LeaveRequests { get; set; }
        public ICollection<AttendanceRecord> AttendanceRecords { get; set; }
    }
}
