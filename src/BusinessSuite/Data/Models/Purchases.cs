using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public class Supplier
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

    public decimal Balance { get; set; }
}

public class PurchaseInvoice
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public DateTime Date { get; set; } = DateTime.Now;
    public decimal Total { get; set; }
    public string Status { get; set; } = "مدفوع";
    public InvoicePaymentStatus PaymentStatus { get; set; } = InvoicePaymentStatus.Paid;
    public bool IsCancelled { get; set; }
    public List<PurchaseInvoiceItem> Items { get; set; } = new();
}

public class PurchaseInvoiceItem
{
    public int Id { get; set; }
    public int PurchaseInvoiceId { get; set; }
    public PurchaseInvoice? Invoice { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal LineTotal { get; set; }
}
