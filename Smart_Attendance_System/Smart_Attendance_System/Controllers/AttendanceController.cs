using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Smart_Attendance_System.Data;
using Smart_Attendance_System.Model;
using Smart_Attendance_System.Model.DTOs;

namespace Smart_Attendance_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Employee")]
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AttendanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ✅ Mark attendance (manual, QR, facial)
        [HttpPost("mark")]
        public async Task<IActionResult> MarkAttendance([FromBody] AttendanceDTO request)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized("User not found.");

            if (string.IsNullOrEmpty(request.Method) ||
                !(request.Method.Equals("QR", StringComparison.OrdinalIgnoreCase) ||
                  request.Method.Equals("Face", StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest("Invalid attendance method. Use 'QR' or 'Face'.");
            }

            var attendance = new Attendance
            {
                UserId = userId.Value,
                Timestamp = DateTime.UtcNow,
                Method = request.Method
            };

            _context.Attendances.Add(attendance);
            await _context.SaveChangesAsync();

            return Ok("Attendance marked successfully.");
        }

        // ✅ Get personal attendance history
        [HttpGet("my-history")]
        public async Task<IActionResult> GetMyAttendanceHistory()
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized("User not found.");

            var history = await _context.Attendances
                .Where(a => a.UserId == userId.Value)
                .OrderByDescending(a => a.Timestamp)
                .Select(a => new
                {
                    a.Id,
                    a.Timestamp,
                    a.Method
                })
                .ToListAsync();

            return Ok(history);
        }

        // ✅ Submit a leave request
        [HttpPost("leave-request")]
        public async Task<IActionResult> SubmitLeaveRequest([FromBody] LeaveRequest request)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized("User not found.");

            if (request.StartDate > request.EndDate)
                return BadRequest("Start date cannot be after end date.");

            var leave = new LeaveRequest
            {
                UserId = userId.Value,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Reason = request.Reason,
                Status = "Pending"
            };

            _context.LeaveRequests.Add(leave);
            await _context.SaveChangesAsync();

            return Ok("Leave request submitted.");
        }

        // ✅ View personal leave requests
        [HttpGet("my-leaves")]
        public async Task<IActionResult> GetMyLeaveRequests()
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized("User not found.");

            var leaves = await _context.LeaveRequests
                .Where(l => l.UserId == userId.Value)
                .OrderByDescending(l => l.StartDate)
                .Select(l => new
                {
                    l.Id,
                    l.StartDate,
                    l.EndDate,
                    l.Reason,
                    l.Status
                })
                .ToListAsync();

            return Ok(leaves);
        }

        // ✅ Helper method to extract User ID from token
        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null ? int.Parse(claim.Value) : (int?)null;
        }
    }

}
