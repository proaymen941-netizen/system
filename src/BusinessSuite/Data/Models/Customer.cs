using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public class Customer
{
    public int Id { get; set; }

    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(120)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Address { get; set; } = string.Empty;

    [MaxLength(50)]
    public string TaxNumber { get; set; } = string.Empty;

    public decimal Balance { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
