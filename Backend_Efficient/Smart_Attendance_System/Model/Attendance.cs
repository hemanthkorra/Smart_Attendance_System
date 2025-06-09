using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Smart_Attendance_System.Model
{
    public class Attendance
    {
        [Key]
        public int Id { get; set; }

        public DateTime Date { get; set; }

        [Required]
        public string Method { get; set; } // QR or Face

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
    }
}
