using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public class Product
{
    public int Id { get; set; }

    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Sku { get; set; } = string.Empty;

    [MaxLength(60)]
    public string Category { get; set; } = string.Empty;

    public decimal Price { get; set; }
    public decimal Cost { get; set; }
    public int Quantity { get; set; }
    public int MinQuantity { get; set; } = 5;

    [MaxLength(200)]
    public string ImageEmoji { get; set; } = "📦";
}
