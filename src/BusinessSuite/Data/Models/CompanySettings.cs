using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public class CompanySettings
{
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string Name { get; set; } = "شركتي";

    [MaxLength(50)]
    public string TaxNumber { get; set; } = "";

    [MaxLength(50)]
    public string CommercialRegister { get; set; } = "";

    [MaxLength(20)]
    public string Phone { get; set; } = "";

    [MaxLength(120)]
    public string Email { get; set; } = "";

    [MaxLength(250)]
    public string Address { get; set; } = "";

    [MaxLength(20)]
    public string Currency { get; set; } = "ر.س";

    public decimal TaxRate { get; set; } = 15m;

    [MaxLength(10)]
    public string LogoEmoji { get; set; } = "🌿";
}
