using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using UserApi_20250911.Models;     // DTO ? Models\AuthDtos.cs
using UserApi_20250911.Security;   // PasswordHasher (PBKDF2-SHA256)

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

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

// JWT ??
var jwtKey = builder.Configuration["Jwt:Key"] ?? "DEV_ONLY_SUPER_SECRET_MIN_32_CHARS_KEY_CHANGE_ME_123456";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Entrust";
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

var app = builder.Build();



var buildTag = "build-" + DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");
// ??:???????????? Program.cs
app.MapGet("/whoami", () => new { tag = buildTag });



app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();

// =============== ???? ===============
app.MapGet("/diag/db-ping", async (IConfiguration cfg) =>
{
    string cs = cfg.GetConnectionString("DefaultConnection") ?? "(null)";
    try
    {
        using var conn = new SqlConnection(cs);
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
}).WithTags("diag");



// =============== ?????? SHA256(??) ?? DB ===============
app.MapPost("/auth/register", async (RegisterRequest req, IConfiguration cfg) =>
{
    if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
        return Results.BadRequest(new { error = "invalid" });

    var cs = cfg.GetConnectionString("DefaultConnection");
    using var conn = new SqlConnection(cs);
    await conn.OpenAsync();
    using var tx = await conn.BeginTransactionAsync();

    // ????
    var exists = await conn.ExecuteScalarAsync<int>(
        "SELECT COUNT(1) FROM dbo.Users WHERE Username=@u OR Email=@e",
        new { u = req.Username, e = req.Email }, tx);
    if (exists > 0) { await tx.RollbackAsync(); return Results.Conflict(new { error = "exists" }); }

    // ? C# ?? SHA256(??)
    byte[] hash;
    using (var sha = System.Security.Cryptography.SHA256.Create())
        hash = sha.ComputeHash(Encoding.UTF8.GetBytes(req.Password));

    // ??(Salt NULL?Algo = 'SHA256')
    var sql = @"
        INSERT INTO dbo.Users(Username, Email, PasswordHash, PasswordSalt, PasswordAlgo)
        VALUES(@Username,@Email,@Hash,NULL,N'SHA256');
        SELECT CAST(SCOPE_IDENTITY() AS INT);";
    var id = await conn.ExecuteScalarAsync<int>(sql, new { req.Username, req.Email, Hash = hash }, tx);

    await tx.CommitAsync();
    return Results.Created($"/api/users/{id}", new { userId = id, message = "ok" });
}).WithTags("auth");



// =============== /auth/login(?? SHA256 ? ? JWT)===============
app.MapPost("/auth/login", async (LoginRequest req, IConfiguration cfg) =>
{
    if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
        return Results.Ok(new { authorization = "empty" });

    var cs = cfg.GetConnectionString("DefaultConnection");
    using var conn = new SqlConnection(cs);

    // ?????;Hash ? varbinary ??
    var row = await conn.QueryFirstOrDefaultAsync(
        @"SELECT UserID AS ID, Username,
                 Hash = TRY_CAST(PasswordHash AS varbinary(8000)),
                 Algo = ISNULL(PasswordAlgo,N'')
          FROM dbo.Users WHERE Username=@u",
        new { u = req.Username });
    if (row == null || row.Hash == null) return Results.Ok(new { authorization = "empty" });

    // ?? SHA256(????) ?????
    byte[] inputHash;
    using (var sha = System.Security.Cryptography.SHA256.Create())
        inputHash = sha.ComputeHash(Encoding.UTF8.GetBytes(req.Password));

    if (!System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(inputHash, (byte[])row.Hash))
        return Results.Ok(new { authorization = "empty" });

    // ? JWT(??????)
    var key = cfg["Jwt:Key"] ?? "DEV_ONLY_SUPER_SECRET_MIN_32_CHARS_KEY_CHANGE_ME_123456";
    var issuer = cfg["Jwt:Issuer"] ?? "Entrust";
    var creds = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);

    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, ((int)row.ID).ToString()),
        new Claim(JwtRegisteredClaimNames.UniqueName, (string)row.Username),
        new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
    };

    var token = new JwtSecurityToken(issuer: issuer, audience: issuer, claims: claims,
                                     notBefore: DateTime.UtcNow, expires: DateTime.UtcNow.AddHours(8), signingCredentials: creds);
    var jwt = new JwtSecurityTokenHandler().WriteToken(token);
    return Results.Ok(new { authorization = jwt });
}).WithTags("auth");




// ????????????????(??????)
app.MapGet("/diag/login-debug/{username}", async (string username, IConfiguration cfg) =>
{
    var cs = cfg.GetConnectionString("DefaultConnection")
              ?? Environment.GetEnvironmentVariable("CONNSTR_DEFAULT");
    using var conn = new SqlConnection(cs);

    var row = await conn.QueryFirstOrDefaultAsync(
        @"SELECT TOP 1
              ID,
              Username,
              HashLen = DATALENGTH(PasswordHash),
              SaltLen = DATALENGTH(PasswordSalt),
              Algo    = ISNULL(PasswordAlgo, N'')
          FROM dbo.Users
          WHERE Username = @username",
        new { username });

    return Results.Ok(row ?? new { message = "not found" });
}).WithTags("diag");



// =============== Token ?? ===============
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
}).WithTags("auth");

app.Run();
