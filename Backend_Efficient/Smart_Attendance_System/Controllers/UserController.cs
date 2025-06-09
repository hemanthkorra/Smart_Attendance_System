using System.Security.Claims;
using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Smart_Attendance_System.Data;
using Smart_Attendance_System.Model;
using Microsoft.EntityFrameworkCore;

namespace Smart_Attendance_System.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserController(ApplicationDbContext context)
        {
            _context = context;
        }


        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile([FromQuery] int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found.");

            return Ok(new
            {
                user.Id,
                user.EmployeeId,
                user.Username,
                user.FullName,
                user.Email,
                user.Department,
                user.Role
            });
        }

        
        [HttpGet("attendance-report")]
        public async Task<IActionResult> GetAttendanceReport([FromQuery] int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found.");

            var attendances = await _context.AttendanceRecords
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Date)
                .Select(a => new
                {
                    a.Id,
                    a.Date,
                    a.Status,
                    a.CheckInTime,
                    a.CheckOutTime
                })
                .ToListAsync();

            return Ok(new
            {
                TotalDays = attendances.Count,
                PresentDays = attendances.Count(a => a.Status == "Present"),
                HalfDays = attendances.Count(a => a.Status == "HalfDay"),
                LeaveDays = attendances.Count(a => a.Status == "Leave"),
                Records = attendances
            });
        }
    }
}
