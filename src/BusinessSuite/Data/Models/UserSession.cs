using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public class UserSession
{
    public int Id { get; set; }

    public int UserId { get; set; }

    [MaxLength(100)]
    public string Username { get; set; } = "";

    [MaxLength(150)]
    public string FullName { get; set; } = "";

    [MaxLength(20)]
    public string BranchCode { get; set; } = "";

    [MaxLength(100)]
    public string DeviceName { get; set; } = "";

    [MaxLength(100)]
    public string IpAddress { get; set; } = "";

    [MaxLength(20)]
    public string Language { get; set; } = "عربي";

    public DateTime LoginAt { get; set; } = DateTime.Now;
    public DateTime? LogoutAt { get; set; }

    public bool IsActive { get; set; } = true;

    [MaxLength(50)]
    public string LogoutReason { get; set; } = "";
}
