using System.ComponentModel.DataAnnotations;

namespace Smart_Attendance_System.Model.DTOs
{
    public class LeaveRequestDto
    {
        public int UserId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Reason { get; set; }
    }
}
