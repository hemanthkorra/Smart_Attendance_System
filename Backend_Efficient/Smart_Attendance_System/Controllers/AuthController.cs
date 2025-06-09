using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Smart_Attendance_System.Data;
using Smart_Attendance_System.Model;
using Smart_Attendance_System.Model.DTOs;

namespace Smart_Attendance_System.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PasswordHasher<User> _hasher;

        public AuthController(ApplicationDbContext context)
        {
            _context = context;
            _hasher = new PasswordHasher<User>();
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user == null)
                return Unauthorized("Invalid username or password.");

            var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            if (result == PasswordVerificationResult.Failed)
                return Unauthorized("Invalid username or password.");

            return Ok(new
            {
                user.Id, 
                user.Username,
                user.Role,
                user.FullName,
                user.Email
            });
        }
    }
}
