namespace Smart_Attendance_System.Model.DTOs
{
    public class LeaveRequestDto
    {
        public int UserId { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public string Reason { get; set; }
        public string Status { get; set; } // Pending, Approved, Rejected
    }
}
