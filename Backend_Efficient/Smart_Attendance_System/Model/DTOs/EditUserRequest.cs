namespace Smart_Attendance_System.Model.DTOs
{
    public class EditUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = "Employee";
        public string EmployeeId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Department { get; set; } = "General";
    }
}
