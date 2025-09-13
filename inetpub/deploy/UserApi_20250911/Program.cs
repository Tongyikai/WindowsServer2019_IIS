using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using UserApi_20250911.Models;     // ? ?? DTO ????
using UserApi_20250911.Security;   // ? ????????????

var builder = WebApplication.CreateBuilder(args);

// -- Services(???? Build ????)
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

var app = builder.Build();  // ? ? Build ? app,?? Use ????

// -- Middlewares
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();

// -- ????
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


// -- ?? API
app.MapPost("/auth/register", async (RegisterRequest req, IConfiguration cfg) =>
{
    if (string.IsNullOrWhiteSpace(req.Username) || req.Username.Length > 50)
        return Results.BadRequest(new { error = "Invalid username." });
    if (string.IsNullOrWhiteSpace(req.Email) || req.Email.Length > 254 || !req.Email.Contains('@'))
        return Results.BadRequest(new { error = "Invalid email." });
    if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 8)
        return Results.BadRequest(new { error = "Invalid password." });

    var cs = cfg.GetConnectionString("DefaultConnection")
              ?? Environment.GetEnvironmentVariable("CONNSTR_DEFAULT"); // ?????????

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
            VALUES (@Username, @Email, @Hash, @Salt, N'SHA256');
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

app.Run();
