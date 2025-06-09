using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Smart_Attendance_System.Data;
using Smart_Attendance_System.Model;

namespace Smart_Attendance_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Get all users
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

        // Add new user
        [HttpPost("add-user")]
        public async Task<IActionResult> AddUser([FromBody] User user)
        {
            if (await _context.Users.AnyAsync(u => u.Username == user.Username || u.EmployeeId == user.EmployeeId))
                return BadRequest("Username or Employee ID already exists.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok("User added successfully.");
        }

        // Edit user by ID
        [HttpPut("edit-user/{id}")]
        public async Task<IActionResult> EditUser(int id, [FromBody] User updated)
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

        // Delete user by ID
        [HttpDelete("delete-user/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound("User not found.");

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok("User deleted successfully.");
        }

        // Get all attendance records
        [HttpGet("attendance-report")]
        public async Task<IActionResult> GetAllAttendance()
        {
            var records = await _context.Attendances
                .Include(a => a.User)
                .Select(a => new
                {
                    a.Id,
                    a.Timestamp,
                    a.Method,
                    EmployeeName = a.User.FullName,
                    a.User.EmployeeId,
                    a.User.Department
                })
                .ToListAsync();

            return Ok(records);
        }

        // Get all leave requests
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

        // Approve leave by ID
        [HttpPut("approve-leave/{id}")]
        public async Task<IActionResult> ApproveLeave(int id)
        {
            var leave = await _context.LeaveRequests.FindAsync(id);
            if (leave == null) return NotFound("Leave request not found.");

            leave.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok("Leave approved.");
        }

        // Reject leave by ID
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
