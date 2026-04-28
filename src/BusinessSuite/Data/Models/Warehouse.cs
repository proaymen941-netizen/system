using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public class Warehouse
{
    public int Id { get; set; }

    [MaxLength(20)]
    public string Code { get; set; } = "";

    [Required, MaxLength(150)]
    public string Name { get; set; } = "";

    [MaxLength(150)]
    public string ForeignName { get; set; } = "";

    public int? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public bool IsMain { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public bool AllowNegativeStock { get; set; } = false;

    [MaxLength(150)]
    public string Manager { get; set; } = "";

    [MaxLength(30)]
    public string Phone { get; set; } = "";

    [MaxLength(250)]
    public string Address { get; set; } = "";

    [MaxLength(100)]
    public string City { get; set; } = "";

    [MaxLength(100)]
    public string Region { get; set; } = "";

    [MaxLength(100)]
    public string Country { get; set; } = "المملكة العربية السعودية";

    [MaxLength(50)]
    public string WarehouseType { get; set; } = "رئيسي";

    [MaxLength(250)]
    public string Notes { get; set; } = "";

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
