namespace UserApi_20250911.Models
{
    public record RegisterRequest(string Username, string Email, string Password);
    public record RegisterResponse(int UserId, string Message);
<<<<<<< HEAD
<<<<<<< HEAD
=======
    public record LoginRequest(string Username, string Password);
>>>>>>> developer
}
=======
    public record LoginRequest(string Username, string Password);
}

>>>>>>> developer
