namespace Smart_Attendance_System.Model.DTOs
{
    public class RegisterRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string Role { get; set; } // Admin or Employee
        public string EmployeeId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string? Department { get; set; }
    }
}
