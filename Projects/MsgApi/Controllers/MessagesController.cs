using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using MsgApi.Models;

[ApiController]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
    private readonly IConfiguration _config;
    public MessagesController(IConfiguration config) => _config = config;

    [HttpGet]
    public IActionResult GetMessages()
    {
        var list = new List<Message>();

        try
        {
            using var conn = new SqlConnection(_config.GetConnectionString("DefaultConnection"));
            conn.Open();

            // ?????????
            const string sql = @"
                SELECT Id, Name, WhenText, Content, CreatedAt
                FROM dbo.Messages
                ORDER BY CreatedAt DESC";
            using var cmd = new SqlCommand(sql, conn);
            using var r = cmd.ExecuteReader();

            // ??????,??????????
            int oId        = r.GetOrdinal("Id");
            int oName      = r.GetOrdinal("Name");
            int oWhenText  = r.GetOrdinal("WhenText");
            int oContent   = r.GetOrdinal("Content");
            int oCreatedAt = r.GetOrdinal("CreatedAt");

            while (r.Read())
            {
                var m = new Message
                {
                    Id        = r.GetInt64(oId),                                    // bigint ? long
                    Name      = r.IsDBNull(oName)     ? null : r.GetString(oName),
                    WhenText  = r.IsDBNull(oWhenText) ? null : r.GetString(oWhenText),
                    Content   = r.IsDBNull(oContent)  ? null : r.GetString(oContent),
                    CreatedAt = r.GetDateTime(oCreatedAt)                           // datetime
                };
                list.Add(m);
            }
        }
        catch (Exception ex)
        {
            // ???????,???????????(???????? 500)
            return Problem($"GET failed: {ex.GetType().Name} - {ex.Message}");
        }

        return Ok(list);
    }

    [HttpPost]
    public IActionResult PostMessage([FromBody] Message msg)
    {
        try
        {
            using var conn = new SqlConnection(_config.GetConnectionString("DefaultConnection"));
            conn.Open();

            const string sql = @"
                INSERT INTO dbo.Messages (Name, WhenText, Content)
                VALUES (@Name, @WhenText, @Content);";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Name",     (object?)msg.Name     ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@WhenText", (object?)msg.WhenText ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Content",  (object?)msg.Content  ?? DBNull.Value);
            cmd.ExecuteNonQuery();
        }
        catch (Exception ex)
        {
            return Problem($"POST failed: {ex.GetType().Name} - {ex.Message}");
        }

        return Ok(new { ok = true });
    }
}
