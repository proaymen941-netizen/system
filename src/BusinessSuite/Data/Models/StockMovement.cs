using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public enum MovementType { Purchase, Sale, Adjustment, Return, Cancellation, Initial }

public class StockMovement
{
    public int Id { get; set; }
    public DateTime Date { get; set; } = DateTime.Now;

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    [MaxLength(120)]
    public string ProductName { get; set; } = string.Empty;

    public MovementType Type { get; set; }
    public int Change { get; set; }
    public int BalanceAfter { get; set; }

    [MaxLength(80)]
    public string Reference { get; set; } = string.Empty;

    [MaxLength(80)]
    public string User { get; set; } = "النظام";

    [MaxLength(200)]
    public string Notes { get; set; } = string.Empty;
}
