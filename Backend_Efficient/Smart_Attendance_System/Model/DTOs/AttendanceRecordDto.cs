namespace Smart_Attendance_System.Model.DTOs
{
    public class AttendanceRecordDto
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Status { get; set; }
        public TimeSpan? CheckInTime { get; set; } // Use TimeSpan if only time is stored
        public TimeSpan? CheckOutTime { get; set; } // Use TimeSpan if only time is stored
        public string FullName { get; set; }
        public string EmployeeId { get; set; }
        public string Department { get; set; }
    }
}
