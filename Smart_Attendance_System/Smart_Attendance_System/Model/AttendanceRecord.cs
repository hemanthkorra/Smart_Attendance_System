using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Smart_Attendance_System.Model
{
    public class AttendanceRecord
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public string Status { get; set; } // Present, Absent, Leave

        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
    }
}
