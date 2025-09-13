namespace MsgApi.Models
{
    public class Message
    {
        public long Id { get; set; }            // bigint ?? C# long
        public string? Name { get; set; }
        public string? WhenText { get; set; }
        public string? Content { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}