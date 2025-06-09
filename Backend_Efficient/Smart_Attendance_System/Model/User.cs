using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Smart_Attendance_System.Model
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; }

        [Required]
        [MaxLength(200)]
        public string FullName { get; set; }

        [Required]
        [MaxLength(200)]
        public string Email { get; set; }

        [MaxLength(100)]
        public string Department { get; set; }

        [MaxLength(50)]
        public string Role { get; set; }

        [Required]
        [MaxLength(20)]
        public string EmployeeId { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Property
        public ICollection<UserFaceEncoding> FaceEncodings { get; set; }

        // Navigation properties
        public ICollection<Attendance> Attendances { get; set; }
        public ICollection<LeaveRequest> LeaveRequests { get; set; }
        public ICollection<AttendanceRecord> AttendanceRecords { get; set; }
    }
}

