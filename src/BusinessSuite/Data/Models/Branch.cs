using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public class Branch
{
    public int Id { get; set; }

    [MaxLength(20)]
    public string Code { get; set; } = "";

    [Required, MaxLength(150)]
    public string ArabicName { get; set; } = "";

    [MaxLength(150)]
    public string ForeignName { get; set; } = "";

    [MaxLength(20)]
    public string FinancialYear { get; set; } = "";

    public bool IsMain { get; set; } = false;
    public bool IsActive { get; set; } = true;

    [MaxLength(250)]
    public string ArabicAddress { get; set; } = "";

    [MaxLength(250)]
    public string ForeignAddress { get; set; } = "";

    [MaxLength(30)]
    public string Phone { get; set; } = "";

    [MaxLength(30)]
    public string Fax { get; set; } = "";

    [MaxLength(30)]
    public string PoBox { get; set; } = "";

    [MaxLength(120)]
    public string Email { get; set; } = "";

    [MaxLength(150)]
    public string Website { get; set; } = "";

    [MaxLength(100)]
    public string City { get; set; } = "";

    [MaxLength(100)]
    public string Region { get; set; } = "";

    [MaxLength(100)]
    public string Country { get; set; } = "المملكة العربية السعودية";

    [MaxLength(100)]
    public string Manager { get; set; } = "";

    [MaxLength(50)]
    public string TaxNumber { get; set; } = "";

    [MaxLength(50)]
    public string CommercialRegister { get; set; } = "";

    [MaxLength(250)]
    public string Notes { get; set; } = "";

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
