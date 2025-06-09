using System.Security.Claims;
using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Smart_Attendance_System.Data;
using Smart_Attendance_System.Model;

namespace Smart_Attendance_System.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "User")]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ✅ Get User Profile
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized("User not found.");

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
                return NotFound("User not found.");

            return Ok(new
            {
                user.Id,
                user.Username,
                user.FullName,
                user.Email,
                user.Department,
                user.Role
            });
        }

        // ❌ Block User Update
        [HttpPut("update-profile")]
        public IActionResult UpdateProfile()
        {
            return Forbid("Users are not allowed to update profile information.");
        }

        // ✅ Get User's Attendance Report (Summary)
        [HttpGet("attendance-report")]
        public IActionResult GetAttendanceReport()
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized("User not found.");

            var attendances = _context.AttendanceRecords
                .Where(a => a.UserId == userId.Value)
                .OrderByDescending(a => a.Date)
                .Select(a => new
                {
                    a.Id,
                    a.Date,
                    a.Status,
                    a.CheckInTime,
                    a.CheckOutTime
                })
                .ToList();

            return Ok(new
            {
                TotalDays = attendances.Count,
                PresentDays = attendances.Count(a => a.Status == "Present"),
                AbsentDays = attendances.Count(a => a.Status == "Absent"),
                LeaveDays = attendances.Count(a => a.Status == "Leave"),
                Records = attendances
            });
        }

        // ✅ Utility: Get current user ID from JWT
        private int? GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : (int?)null;
        }
    }
}
