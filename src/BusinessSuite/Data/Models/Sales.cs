namespace BusinessSuite.Data.Models;

public enum InvoicePaymentStatus { Paid, Unpaid, PartiallyPaid, Refunded }

public class SaleInvoice
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime Date { get; set; } = DateTime.Now;
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = "نقدي";
    public string CustomerName { get; set; } = "زبون نقدي";
    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public InvoicePaymentStatus PaymentStatus { get; set; } = InvoicePaymentStatus.Paid;
    public bool IsCancelled { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    public List<SaleInvoiceItem> Items { get; set; } = new();
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
