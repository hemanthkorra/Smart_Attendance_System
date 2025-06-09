namespace Smart_Attendance_System.Model.DTOs
{
    public class FlaskRecognizeResponse
    {
        public string Message { get; set; }
        public string EmployeeId { get; set; }
        public double Distance { get; set; }
        public string Error { get; set; }
    }
}
