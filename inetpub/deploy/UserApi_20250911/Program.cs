using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;

// === 內嵌 DTO（維持原命名空間以相容你原本 using） ===
namespace UserApi_20250911.Models
{
    public record RegisterRequest(string Username, string Email, string Password);
    public record RegisterResponse(int UserId, string Message);
    public record LoginRequest(string Username, string Password);
}

using UserApi_20250911.Models;     // DTO
using UserApi_20250911.Security;   // PasswordHasher

// === JWT 相關 ===
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// -- Services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(p => p
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .SetIsOriginAllowed(_ => true));
});

// 讀取 JWT 設定
var jwtKey = builder.Configuration["Jwt:Key"] ?? "DEV_ONLY_SUPER_SECRET_MIN_32_CHARS_KEY_CHANGE_ME_123456";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Entrust";
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

var app = builder.Build();

// -- Middlewares
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();

// -- 健康檢查 / DB Ping
app.MapGet("/diag/db-ping", async (IConfiguration cfg) =>
{
    string cs = cfg.GetConnectionString("DefaultConnection") ?? "(null)";
    try
    {
        using var conn = new Microsoft.Data.SqlClient.SqlConnection(cs);
        await conn.OpenAsync();
        var db  = await conn.ExecuteScalarAsync<string>("SELECT DB_NAME()");
        var ver = await conn.ExecuteScalarAsync<string>("SELECT @@VERSION");
        var cnt = await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM dbo.Users");
        return Results.Ok(new { ok = true, db, users = cnt, version = ver });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { ok = false, error = ex.Message, cs });
    }
});

// -- 註冊 API（保留你原本流程，僅把 PasswordAlgo 標記修正）
app.MapPost("/auth/register", async (RegisterRequest req, IConfiguration cfg) =>
{
    if (string.IsNullOrWhiteSpace(req.Username) || req.Username.Length > 50)
        return Results.BadRequest(new { error = "Invalid username." });
    if (string.IsNullOrWhiteSpace(req.Email) || req.Email.Length > 254 || !req.Email.Contains('@'))
        return Results.BadRequest(new { error = "Invalid email." });
    if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 8)
        return Results.BadRequest(new { error = "Invalid password." });

    var cs = cfg.GetConnectionString("DefaultConnection")
              ?? Environment.GetEnvironmentVariable("CONNSTR_DEFAULT");

    if (string.IsNullOrWhiteSpace(cs))
    	return Results.Problem("Missing connection string 'ConnectionStrings:DefaultConnection'.");

    using var conn = new SqlConnection(cs);
    await conn.OpenAsync();
    using var tx = await conn.BeginTransactionAsync();

    try
    {
        const string sqlCheck = @"
            SELECT 
              CONVERT(bit, CASE WHEN EXISTS(SELECT 1 FROM dbo.Users WHERE Email=@Email) THEN 1 ELSE 0 END) AS EmailExists,
              CONVERT(bit, CASE WHEN EXISTS(SELECT 1 FROM dbo.Users WHERE Username=@Username) THEN 1 ELSE 0 END) AS UsernameExists;";
        var exists = await conn.QuerySingleAsync<(bool EmailExists, bool UsernameExists)>(
            sqlCheck, new { req.Email, req.Username }, tx);

        if (exists.EmailExists) { await tx.RollbackAsync(); return Results.Conflict(new { error = "Email already registered." }); }
        if (exists.UsernameExists) { await tx.RollbackAsync(); return Results.Conflict(new { error = "Username already taken." }); }

        var (salt, hash) = PasswordHasher.HashPassword(req.Password);

        const string sqlInsertUser = @"
            INSERT INTO dbo.Users(Username, Email, PasswordHash, PasswordSalt, PasswordAlgo)
            VALUES (@Username, @Email, @Hash, @Salt, N'PBKDF2-SHA256');
            SELECT CAST(SCOPE_IDENTITY() AS INT);";
        int userId = await conn.ExecuteScalarAsync<int>(sqlInsertUser,
            new { req.Username, req.Email, Hash = hash, Salt = salt }, tx);

        await conn.ExecuteAsync("INSERT INTO dbo.UserProfiles(UserID) VALUES(@UserID);",
            new { UserID = userId }, tx);

        await tx.CommitAsync();
        return Results.Created($"/api/users/{userId}", new RegisterResponse(userId, "Register OK"));
    }
    catch (SqlException ex) when (ex.Number is 2627 or 2601)
    {
        await tx.RollbackAsync();
        return Results.Conflict(new { error = "Email or Username already exists." });
    }
    catch
    {
        await tx.RollbackAsync();
        return Results.Problem("Unexpected error.");
    }
});

// -- 登入：成功回傳 { authorization: "<JWT_TOKEN>" }（配合前端 clientAJAX.js 的流程）
app.MapPost("/auth/login", async (LoginRequest req, IConfiguration cfg) =>
{
    if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
        return Results.Ok(new { authorization = "empty" }); // 與前端既有流程相容

    var cs = cfg.GetConnectionString("DefaultConnection")
              ?? Environment.GetEnvironmentVariable("CONNSTR_DEFAULT");
    using var conn = new SqlConnection(cs);

    // 讀取使用者與密碼雜湊
    var sql = @"SELECT ID, Username, PasswordHash, PasswordSalt FROM dbo.Users WHERE Username=@Username";
    var user = await conn.QueryFirstOrDefaultAsync(sql, new { req.Username });
    if (user == null) return Results.Ok(new { authorization = "empty" });

    byte[] hash = (byte[])user.PasswordHash;
    byte[] salt = (byte[])user.PasswordSalt;

    if (!PasswordHasher.Verify(req.Password, salt, hash))
        return Results.Ok(new { authorization = "empty" });

    // 產生 JWT
    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, ((int)user.ID).ToString()),
        new Claim(JwtRegisteredClaimNames.UniqueName, (string)user.Username),
        new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
    };
    var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
    var token = new JwtSecurityToken(
        issuer: jwtIssuer,
        audience: jwtIssuer,
        claims: claims,
        notBefore: DateTime.UtcNow,
        expires: DateTime.UtcNow.AddHours(8),
        signingCredentials: creds
    );
    var jwt = new JwtSecurityTokenHandler().WriteToken(token);

    // 回傳給前端 → 前端寫 cookie 並呼叫 /auth/me
    return Results.Ok(new { authorization = jwt });
});

// -- 用 Token 取得目前身分：成功回 { authorization = "Okay", userId, username }
app.MapPost("/auth/me", (HttpContext http) =>
{
    string? auth = http.Request.Headers.Authorization;
    if (string.IsNullOrWhiteSpace(auth) || !auth.StartsWith("Bearer "))
        return Results.Ok(new { authorization = "NotOkay" });

    var token = auth.Substring("Bearer ".Length).Trim();
    var handler = new JwtSecurityTokenHandler();

    try
    {
        var principal = handler.ValidateToken(token, new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtIssuer,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2)
        }, out var _);

        var sub  = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var name = principal.FindFirstValue(JwtRegisteredClaimNames.UniqueName);
        return Results.Ok(new { authorization = "Okay", userId = sub, username = name });
    }
    catch
    {
        return Results.Ok(new { authorization = "NotOkay" });
    }
});

app.Run();
