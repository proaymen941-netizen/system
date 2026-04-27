using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public enum EntryType { Income, Expense }

public class JournalEntry
{
    public int Id { get; set; }
    public DateTime Date { get; set; } = DateTime.Now;
    public EntryType Type { get; set; }

    [MaxLength(80)]
    public string Category { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    [MaxLength(60)]
    public string Reference { get; set; } = string.Empty;
}
