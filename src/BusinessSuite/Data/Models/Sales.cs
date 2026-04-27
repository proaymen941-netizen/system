using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public enum InvoicePaymentStatus { Paid, Unpaid, PartiallyPaid, Refunded }

public class SaleInvoice
{
    public int Id { get; set; }

    [MaxLength(30)]
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime Date { get; set; } = DateTime.Now;
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Total { get; set; }

    [MaxLength(30)]
    public string PaymentMethod { get; set; } = "نقدي";

    [MaxLength(120)]
    public string CustomerName { get; set; } = "زبون نقدي";
    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public InvoicePaymentStatus PaymentStatus { get; set; } = InvoicePaymentStatus.Paid;
    public bool IsCancelled { get; set; }
    public DateTime? CancelledAt { get; set; }

    [MaxLength(200)]
    public string? CancellationReason { get; set; }
    public List<SaleInvoiceItem> Items { get; set; } = new();

    public int? CashierId { get; set; }

    [MaxLength(120)]
    public string CashierName { get; set; } = string.Empty;

    [MaxLength(30)]
    public string OrderType { get; set; } = "محلي";

    public int OrderNumber { get; set; }

    [MaxLength(200)]
    public string Notes { get; set; } = string.Empty;

    public int? ShiftId { get; set; }
}

public class SaleInvoiceItem
{
    public int Id { get; set; }
    public int SaleInvoiceId { get; set; }
    public SaleInvoice? Invoice { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}
