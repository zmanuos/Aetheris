using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse>> Login(LoginRequest request)
        {
            try
            {
                var user = await _db.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

                if (user == null || !VerifyPassword(request.Password, user.Password))
                {
                    return Ok(new ApiResponse 
                    { 
                        Success = false, 
                        Message = "Email o contraseña incorrectos" 
                    });
                }

                var token = GenerateToken(user);

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Login exitoso",
                    Data = new
                    {
                        Token = token,
                        User = new
                        {
                            user.Id,
                            user.Email,
                            user.FirstName,
                            user.LastName
                        }
                    }
                });
            }
            catch (Exception)
            {
                return Ok(new ApiResponse 
                { 
                    Success = false, 
                    Message = "Error en el servidor" 
                });
            }
        }

        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse>> Register(RegisterRequest request)
        {
            try
            {
                var existingUser = await _db.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (existingUser != null)
                {
                    return Ok(new ApiResponse 
                    { 
                        Success = false, 
                        Message = "El email ya está registrado" 
                    });
                }

                var user = new User
                {
                    Email = request.Email,
                    Password = HashPassword(request.Password),
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    CreatedAt = DateTime.Now
                };

                _db.Users.Add(user);
                await _db.SaveChangesAsync();

                var token = GenerateToken(user);

                return Ok(new ApiResponse
                {
                    Success = true,
                    Message = "Registro exitoso",
                    Data = new
                    {
                        Token = token,
                        User = new
                        {
                            user.Id,
                            user.Email,
                            user.FirstName,
                            user.LastName
                        }
                    }
                });
            }
            catch (Exception)
            {
                return Ok(new ApiResponse 
                { 
                    Success = false, 
                    Message = "Error en el servidor" 
                });
            }
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password + "mi_salt_secreto"));
            return Convert.ToBase64String(hashedBytes);
        }

        private bool VerifyPassword(string password, string hash)
        {
            return HashPassword(password) == hash;
        }

        private string GenerateToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]);
            
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("id", user.Id.ToString()),
                    new Claim("email", user.Email),
                    new Claim("name", $"{user.FirstName} {user.LastName}".Trim())
                }),
                Expires = DateTime.UtcNow.AddDays(30),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key), 
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
