using System.Text.Json;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Smart_Attendance_System.Data;
using Smart_Attendance_System.Model;
using Smart_Attendance_System.Model.DTOs;

namespace Smart_Attendance_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AttendanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("mark-or-update")]
        public async Task<IActionResult> MarkOrUpdateAttendance([FromBody] AttendanceDTO request)
        {
            int userId; // This will store the resolved UserId
            string resolvedEmployeeId = null; // Store EmployeeId here to pass to frontend

            if (string.IsNullOrEmpty(request.Method) ||
                !(request.Method.Equals("QR", StringComparison.OrdinalIgnoreCase) ||
                  request.Method.Equals("Face", StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(new { error = "Invalid attendance method. Use 'QR' or 'Face'." });
            }

            if (request.Method.Equals("Face", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrEmpty(request.FaceImageBase64))
                {
                    return BadRequest(new { error = "Face image is required for 'Face' attendance method." });
                }

                // Call Python Flask face recognition API
                using var httpClient = new HttpClient();
                var pythonApiUrl = "http://localhost:6000/recognize-face"; // Flask recognition endpoint

                var payload = new
                {
                    imageBase64 = request.FaceImageBase64
                };

                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                HttpResponseMessage response;
                try
                {
                    response = await httpClient.PostAsync(pythonApiUrl, content);
                }
                catch (HttpRequestException ex)
                {
                    // Handle network errors or Flask server not running
                    return StatusCode(503, new { error = $"Could not connect to face recognition service. Details: {ex.Message}" });
                }


                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    // Try to parse Flask's error message
                    try
                    {
                        var flaskError = JsonSerializer.Deserialize<FlaskRecognizeResponse>(errorContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        if (flaskError?.Error != null)
                        {
                            // If Flask explicitly sent an error message
                            return StatusCode((int)response.StatusCode, new { error = $"Face recognition failed: {flaskError.Error}" });
                        }
                    }
                    catch (JsonException)
                    {
                        // If Flask didn't send a JSON error, return generic
                    }
                    return StatusCode((int)response.StatusCode, new { error = $"Face recognition API call failed with status {response.StatusCode}. Details: {errorContent}" });
                }

                var flaskResponseContent = await response.Content.ReadAsStringAsync();
                var flaskResult = JsonSerializer.Deserialize<FlaskRecognizeResponse>(flaskResponseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (flaskResult == null || string.IsNullOrEmpty(flaskResult.EmployeeId))
                {
                    return NotFound(new { error = "No recognized face found for attendance." });
                }

                // Find the user in your database using the EmployeeId returned by Flask
                var recognizedUser = await _context.Users
                                                   .FirstOrDefaultAsync(u => u.EmployeeId == flaskResult.EmployeeId);

                if (recognizedUser == null)
                {
                    return NotFound(new { error = $"User with Employee ID '{flaskResult.EmployeeId}' not found in the system." });
                }

                userId = recognizedUser.Id; // Set the userId for further processing
                resolvedEmployeeId = recognizedUser.EmployeeId; // <-- Assign the EmployeeId here
            }
            else 
            {
                
                return BadRequest(new { error = "QR code attendance method not fully implemented yet." });
            }

            // --- Attendance Marking Logic 

            DateTime currentTime = DateTime.Now;
            var today = currentTime.Date;

            // Find today's attendance
            var existingAttendance = await _context.Attendances
                .FirstOrDefaultAsync(a => a.UserId == userId && a.Date == today);

            var attendanceRecord = await _context.AttendanceRecords
                .FirstOrDefaultAsync(a => a.UserId == userId && a.Date == today);

            // Define thresholds (Adjust these as per your company policy)
            var lateThreshold = today.AddHours(10).AddMinutes(30); // E.g., 9:30 AM is considered late check-in
            var earlyCheckoutThreshold = today.AddHours(17).AddMinutes(0); // E.g., 5:00 PM is early check-out

            // Case 1: No Attendance exists – mark check-in
            if (existingAttendance == null)
            {
                var attendance = new Attendance
                {
                    UserId = userId,
                    Date = today,
                    Method = request.Method,
                    CheckInTime = currentTime
                };

                _context.Attendances.Add(attendance);

                if (attendanceRecord == null)
                {
                    attendanceRecord = new AttendanceRecord
                    {
                        UserId = userId,
                        Date = today,
                        CheckInTime = currentTime,
                        // If CheckInTime is after lateThreshold, mark as "Late", otherwise "Pending"
                        Status = currentTime > lateThreshold ? "Late" : "Pending"
                    };

                    _context.AttendanceRecords.Add(attendanceRecord);
                }
                else
                {
                    // This scenario should ideally not be hit if existingAttendance is null,
                    // but as a safeguard, update if record exists but CheckInTime isn't set.
                    attendanceRecord.CheckInTime = currentTime;
                    attendanceRecord.Status = currentTime > lateThreshold ? "Late" : "Pending";
                }

                await _context.SaveChangesAsync();
                // MODIFIED: Include employeeId in the response for check-in
                return Ok(new { message = "Check-in marked successfully.", employeeId = resolvedEmployeeId });
            }

            // Case 2: Already checked in, but not yet checked out – mark check-out
            if (existingAttendance.CheckOutTime == null)
            {
                existingAttendance.CheckOutTime = currentTime;

                if (attendanceRecord != null)
                {
                    attendanceRecord.CheckOutTime = currentTime;

                    // Calculate status based on both check-in and check-out times
                    if (attendanceRecord.CheckInTime != null)
                    {
                        TimeSpan totalDuration = currentTime - attendanceRecord.CheckInTime.Value;
                        // Example logic for "HalfDay" based on both late check-in AND/OR early check-out
                        if (attendanceRecord.CheckInTime.Value > lateThreshold && currentTime < earlyCheckoutThreshold)
                        {
                            attendanceRecord.Status = "HalfDay"; // Both late in and early out
                        }
                        else if (attendanceRecord.CheckInTime.Value > lateThreshold)
                        {
                            attendanceRecord.Status = "HalfDay"; // Only late in
                        }
                        else if (currentTime < earlyCheckoutThreshold)
                        {
                            attendanceRecord.Status = "HalfDay"; // Only early out
                        }
                        else
                        {
                            attendanceRecord.Status = "Present"; // Full day attendance
                        }
                        // Further refine "HalfDay" based on actual duration if needed
                        if (totalDuration.TotalHours < 4) // Example: less than 4 hours worked is considered absent or specific half-day
                        {
                            attendanceRecord.Status = "Leave"; // Or specific "VeryShort" status
                        }
                        else if (totalDuration.TotalHours < 8 && attendanceRecord.Status == "Present")
                        {
                            // If marked present but duration is less than full work day (e.g., 8 hours)
                            attendanceRecord.Status = "HalfDay";
                        }
                    }
                    else
                    {
                        // This case implies check-in was somehow missed in AttendanceRecord
                        // but not in Attendance. Handle as an edge case or log.
                        attendanceRecord.Status = "Error: Check-in time missing"; // Or set to HalfDay/Absent based on policy
                    }
                }
                else
                {
                    // This implies Attendance exists, but AttendanceRecord for the day does not.
                    // This should not happen if logic flows correctly from check-in.
                   
                    return StatusCode(500, new { error = "Internal error: Attendance record missing for existing check-in." });
                }

                await _context.SaveChangesAsync();
               
                return Ok(new { message = "Check-out marked successfully.", employeeId = resolvedEmployeeId });
            }

            // Case 3: Already checked in and out – nothing to do
            
            return Ok(new { message = "You have already checked in and checked out for today.", employeeId = resolvedEmployeeId });
        }





        [HttpGet("my-history/{id}")]
        public async Task<IActionResult> GetMyAttendanceHistory(int id)
        {
            if (id <= 0)
                return BadRequest("Valid User ID is required.");

            var userExists = await _context.Users.AnyAsync(u => u.Id == id);
            if (!userExists)
                return NotFound("User not found.");

            var history = await _context.Attendances
                .Where(a => a.UserId == id)
                .OrderByDescending(a => a.Date)
                .Select(a => new
                {
                    a.Id,
                    a.Date,
                    a.Method
                })
                .ToListAsync();

            return Ok(history);
        }

        [HttpPost("leave-request")]
        public async Task<IActionResult> SubmitLeaveRequest([FromBody] LeaveRequestDto request)
        {
            if (request.UserId <= 0)
                return BadRequest("User ID is required.");

            var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);
            if (!userExists)
                return BadRequest("User not found.");

            if (request.StartDate > request.EndDate)
                return BadRequest("Start date cannot be after end date.");

            var leave = new LeaveRequest
            {
                UserId = request.UserId,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Reason = request.Reason,
                Status = "Pending"
            };

            _context.LeaveRequests.Add(leave);
            await _context.SaveChangesAsync();

            return Ok("Leave request submitted.");
        }

        [HttpGet("my-leaves/{id}")]
        public async Task<IActionResult> GetMyLeaveRequests(int id)
        {
            if (id <= 0)
                return BadRequest("Valid User ID is required.");

            var userExists = await _context.Users.AnyAsync(u => u.Id == id);
            if (!userExists)
                return NotFound("User not found.");

            var leaves = await _context.LeaveRequests
                .Where(l => l.UserId == id)
                .OrderByDescending(l => l.StartDate)
                .Select(l => new
                {
                    l.StartDate,
                    l.EndDate,
                    l.Reason,
                    l.Status
                })
                .ToListAsync();

            return Ok(leaves);
        }
    }
}
