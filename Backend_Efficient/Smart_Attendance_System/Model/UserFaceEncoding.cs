using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Smart_Attendance_System.Model
{
    public class UserFaceEncoding
    {
        [Key]
        public int EncodingId { get; set; }

        [Required]
        public string EmployeeId { get; set; }

        [Required]
        public byte[] FaceEncoding { get; set; }

     
    }
}
