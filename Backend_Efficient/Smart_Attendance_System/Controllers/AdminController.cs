using System.Text.Json;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Smart_Attendance_System.Data;
using Smart_Attendance_System.Model;
using Smart_Attendance_System.Model.DTOs;

namespace Smart_Attendance_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PasswordHasher<User> _hasher;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
            _hasher = new PasswordHasher<User>();
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.FullName,
                    u.Email,
                    u.Role,
                    u.EmployeeId,
                    u.Department,
                    u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Username == request.Username || u.Email == request.Email))
                return BadRequest(new { error = "Username or Email already exists." }); // Return JSON

            // Add EmployeeId uniqueness check as discussed
            if (await _context.Users.AnyAsync(u => u.EmployeeId == request.EmployeeId))
                return BadRequest(new { error = "Employee ID already exists." }); // Return JSON

            var user = new User
            {
                EmployeeId = request.EmployeeId,
                Username = request.Username,
                FullName = request.FullName,
                Email = request.Email,
                Department = request.Department ?? "General",
                Role = request.Role,
                CreatedAt = DateTime.UtcNow,
            };

            user.PasswordHash = _hasher.HashPassword(user, request.Password);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            using var httpClient = new HttpClient();
            var pythonApiUrl = "http://localhost:6000/save-face-encoding";

            var payload = new
            {
                employeeId = request.EmployeeId,
                imageBase64 = request.FaceImageBase64

            };

            var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync(pythonApiUrl, content);

            if (!response.IsSuccessStatusCode)
            {
                // It's better to read Flask's response and return it directly or parse it.
                var flaskErrorContent = await response.Content.ReadAsStringAsync();
                // For simplicity, we'll return a generic error message from C# for now.
                return StatusCode(500, new { error = $"Failed to save face encoding: Flask API responded with {response.StatusCode}. Details: {flaskErrorContent}" });
            }

            return Ok(new { message = "User registered successfully with face encoding." }); // Return JSON
        }



        [HttpPut("edit-user/{id}")]
        public async Task<IActionResult> EditUser(int id, [FromBody] EditUserRequest updated)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("User not found.");

            user.Username = updated.Username;
            user.Role = updated.Role;
            user.EmployeeId = updated.EmployeeId;
            user.FullName = updated.FullName;
            user.Email = updated.Email;
            user.Department = updated.Department;
            await _context.SaveChangesAsync();
            return Ok("User updated successfully.");
        }

        [HttpPatch("update-password/{id}")]
        public async Task<IActionResult> UpdatePassword(int id, [FromBody] UpdatePasswordRequest request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound("User not found.");

            if (string.IsNullOrWhiteSpace(request.NewPassword))
                return BadRequest("New password is required.");

            user.PasswordHash = _hasher.HashPassword(user, request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok("Password updated successfully.");
        }


        [HttpDelete("delete-user/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("User not found.");

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok("User deleted successfully.");
        }

        [HttpGet("attendance-report")]
        public async Task<IActionResult> GetAllAttendance()
        {
            try
            {
                // Execute the stored procedure and map the results to AttendanceRecordDto
                // The column names returned by the stored procedure MUST exactly match the property names in AttendanceRecordDto.
                var records = await _context.AttendanceReportDtos
                                            .FromSqlRaw("exec GetAttendanceReport")
                                            .ToListAsync();

                if (records == null || !records.Any())
                {
                    // Return 200 OK with an empty list if no records are found,
                    // or NotFound if you prefer a 404 response for no data.
                    return Ok(new List<AttendanceRecordDto>());
                    // return NotFound("No attendance records found."); // Alternative for 404
                }

                return Ok(records);
            }
            catch (Exception ex)
            {
                // Log the exception for debugging and monitoring purposes
                // _logger.LogError(ex, "An error occurred while fetching all attendance records from the stored procedure.");

                // Return a generic server error response to the client
                //Console.WriteLine(ex.ToString());
                return StatusCode(500, "An internal server error occurred while retrieving attendance records. Please try again later.");
            }
        }


        [HttpGet("leave-requests")]
        public async Task<IActionResult> GetAllLeaveRequests()
        {
            var requests = await _context.LeaveRequests
                .Include(l => l.User)
                .Select(l => new
                {
                    l.Id,
                    l.StartDate,
                    l.EndDate,
                    l.Reason,
                    l.Status,
                    EmployeeName = l.User.FullName,
                    l.User.EmployeeId,
                    l.User.Department
                })
                .ToListAsync();

            return Ok(requests);
        }

        [HttpPut("approve-leave/{id}")]
        public async Task<IActionResult> ApproveLeave(int id)
        {
            var leave = await _context.LeaveRequests.FindAsync(id);
            if (leave == null) return NotFound("Leave request not found.");

            leave.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok("Leave approved.");
        }

        [HttpPut("reject-leave/{id}")]
        public async Task<IActionResult> RejectLeave(int id)
        {
            var leave = await _context.LeaveRequests.FindAsync(id);
            if (leave == null) return NotFound("Leave request not found.");

            leave.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok("Leave rejected.");
        }
    }
}
