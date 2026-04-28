using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public enum CurrencyKind
{
    Local = 0,
    Foreign = 1,
}

public class Currency
{
    public int Id { get; set; }

    [MaxLength(20)]
    public string Code { get; set; } = "";

    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    [MaxLength(100)]
    public string Country { get; set; } = "";

    [MaxLength(20)]
    public string Symbol { get; set; } = "";

    public CurrencyKind Kind { get; set; } = CurrencyKind.Local;

    public decimal ExchangeRate { get; set; } = 1m;

    public bool IsActive { get; set; } = true;

    public bool IsBase { get; set; } = false;

    [MaxLength(250)]
    public string Notes { get; set; } = "";

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
