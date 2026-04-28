using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public enum AccountKind { Asset = 0, Liability = 1, Equity = 2, Revenue = 3, Expense = 4 }

public class ChartOfAccount
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    public AccountKind Kind { get; set; }

    public int? ParentId { get; set; }
    public bool IsActive { get; set; } = true;

    [MaxLength(200)]
    public string Notes { get; set; } = string.Empty;

    public decimal OpeningBalance { get; set; }
}

public enum VoucherType { Receipt = 0, Payment = 1, JournalManual = 2, Custody = 3, StockIssue = 4 }
public enum VoucherStatus { Draft = 0, Posted = 1, Cancelled = 2 }

public class FinancialVoucher
{
    public int Id { get; set; }

    [MaxLength(30)]
    public string VoucherNumber { get; set; } = string.Empty;

    public VoucherType Type { get; set; }
    public VoucherStatus Status { get; set; } = VoucherStatus.Draft;

    public DateTime Date { get; set; } = DateTime.Now;

    [MaxLength(120)]
    public string PartyName { get; set; } = string.Empty;

    [MaxLength(40)]
    public string PartyType { get; set; } = string.Empty;

    public int? PartyId { get; set; }

    public decimal Amount { get; set; }

    [MaxLength(40)]
    public string PaymentMethod { get; set; } = "نقدي";

    [MaxLength(300)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(60)]
    public string Reference { get; set; } = string.Empty;

    [MaxLength(120)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? PostedAt { get; set; }

    [MaxLength(120)]
    public string PostedBy { get; set; } = string.Empty;

    public int? DebitAccountId { get; set; }
    public int? CreditAccountId { get; set; }
}

public class ManualJournalEntry
{
    public int Id { get; set; }

    [MaxLength(30)]
    public string EntryNumber { get; set; } = string.Empty;

    public DateTime Date { get; set; } = DateTime.Now;

    [MaxLength(300)]
    public string Description { get; set; } = string.Empty;

    public bool IsPosted { get; set; }

    [MaxLength(120)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public List<ManualJournalLine> Lines { get; set; } = new();

    public decimal TotalDebit => Lines.Sum(l => l.Debit);
    public decimal TotalCredit => Lines.Sum(l => l.Credit);
}

public class ManualJournalLine
{
    public int Id { get; set; }
    public int ManualJournalEntryId { get; set; }
    public ManualJournalEntry? Entry { get; set; }

    public int AccountId { get; set; }
    public ChartOfAccount? Account { get; set; }

    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;

    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
}

public class EmployeeCustody
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public DateTime Date { get; set; } = DateTime.Now;

    public decimal Amount { get; set; }
    public bool IsDebit { get; set; } = true;

    [MaxLength(300)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(60)]
    public string Reference { get; set; } = string.Empty;

    public bool IsSettled { get; set; }
    public DateTime? SettledAt { get; set; }

    [MaxLength(120)]
    public string CreatedBy { get; set; } = string.Empty;
}
