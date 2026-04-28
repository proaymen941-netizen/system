using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<LeaveRequest> Leaves => Set<LeaveRequest>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<PurchaseInvoice> PurchaseInvoices => Set<PurchaseInvoice>();
    public DbSet<PurchaseInvoiceItem> PurchaseInvoiceItems => Set<PurchaseInvoiceItem>();
    public DbSet<SaleInvoice> SaleInvoices => Set<SaleInvoice>();
    public DbSet<SaleInvoiceItem> SaleInvoiceItems => Set<SaleInvoiceItem>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<CompanySettings> CompanySettings => Set<CompanySettings>();
    public DbSet<CashierShift> CashierShifts => Set<CashierShift>();

    public DbSet<LicenseInfo> Licenses => Set<LicenseInfo>();
    public DbSet<RegisteredDevice> Devices => Set<RegisteredDevice>();
    public DbSet<UserPermission> UserPermissions => Set<UserPermission>();

    public DbSet<ChartOfAccount> ChartOfAccounts => Set<ChartOfAccount>();
    public DbSet<FinancialVoucher> Vouchers => Set<FinancialVoucher>();
    public DbSet<ManualJournalEntry> ManualJournals => Set<ManualJournalEntry>();
    public DbSet<ManualJournalLine> ManualJournalLines => Set<ManualJournalLine>();
    public DbSet<EmployeeCustody> Custodies => Set<EmployeeCustody>();

    public DbSet<EmployeePenaltyReward> PenaltiesRewards => Set<EmployeePenaltyReward>();
    public DbSet<MonthlyAbsence> MonthlyAbsences => Set<MonthlyAbsence>();
    public DbSet<EmployeeInstallment> Installments => Set<EmployeeInstallment>();

    public DbSet<SalesReturn> SalesReturns => Set<SalesReturn>();
    public DbSet<SalesReturnItem> SalesReturnItems => Set<SalesReturnItem>();
    public DbSet<StockIssueVoucher> StockIssues => Set<StockIssueVoucher>();
    public DbSet<StockIssueItem> StockIssueItems => Set<StockIssueItem>();
    public DbSet<MaintenanceRequest> MaintenanceRequests => Set<MaintenanceRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Product>().Property(p => p.Price).HasConversion<double>();
        modelBuilder.Entity<Product>().Property(p => p.Cost).HasConversion<double>();
        modelBuilder.Entity<Employee>().Property(e => e.Salary).HasConversion<double>();
        modelBuilder.Entity<SaleInvoice>().Property(s => s.Subtotal).HasConversion<double>();
        modelBuilder.Entity<SaleInvoice>().Property(s => s.Tax).HasConversion<double>();
        modelBuilder.Entity<SaleInvoice>().Property(s => s.Total).HasConversion<double>();
        modelBuilder.Entity<SaleInvoiceItem>().Property(i => i.UnitPrice).HasConversion<double>();
        modelBuilder.Entity<SaleInvoiceItem>().Property(i => i.LineTotal).HasConversion<double>();
        modelBuilder.Entity<PurchaseInvoice>().Property(p => p.Total).HasConversion<double>();
        modelBuilder.Entity<PurchaseInvoiceItem>().Property(i => i.UnitCost).HasConversion<double>();
        modelBuilder.Entity<PurchaseInvoiceItem>().Property(i => i.LineTotal).HasConversion<double>();
        modelBuilder.Entity<Supplier>().Property(s => s.Balance).HasConversion<double>();
        modelBuilder.Entity<JournalEntry>().Property(j => j.Amount).HasConversion<double>();
        modelBuilder.Entity<CashierShift>().Property(c => c.OpeningCash).HasConversion<double>();
        modelBuilder.Entity<CashierShift>().Property(c => c.ClosingCash).HasConversion<double>();
        modelBuilder.Entity<CashierShift>().Property(c => c.TotalSales).HasConversion<double>();
        modelBuilder.Entity<CashierShift>().Property(c => c.TotalCash).HasConversion<double>();
        modelBuilder.Entity<CashierShift>().Property(c => c.TotalCard).HasConversion<double>();
        modelBuilder.Entity<CashierShift>().Property(c => c.TotalOther).HasConversion<double>();

        modelBuilder.Entity<ChartOfAccount>().Property(c => c.OpeningBalance).HasConversion<double>();
        modelBuilder.Entity<FinancialVoucher>().Property(v => v.Amount).HasConversion<double>();
        modelBuilder.Entity<ManualJournalLine>().Property(l => l.Debit).HasConversion<double>();
        modelBuilder.Entity<ManualJournalLine>().Property(l => l.Credit).HasConversion<double>();
        modelBuilder.Entity<EmployeeCustody>().Property(c => c.Amount).HasConversion<double>();

        modelBuilder.Entity<EmployeePenaltyReward>().Property(p => p.Amount).HasConversion<double>();
        modelBuilder.Entity<MonthlyAbsence>().Property(m => m.DeductionAmount).HasConversion<double>();
        modelBuilder.Entity<EmployeeInstallment>().Property(i => i.TotalAmount).HasConversion<double>();
        modelBuilder.Entity<EmployeeInstallment>().Property(i => i.MonthlyAmount).HasConversion<double>();

        modelBuilder.Entity<SalesReturn>().Property(s => s.Subtotal).HasConversion<double>();
        modelBuilder.Entity<SalesReturn>().Property(s => s.Tax).HasConversion<double>();
        modelBuilder.Entity<SalesReturn>().Property(s => s.Total).HasConversion<double>();
        modelBuilder.Entity<SalesReturnItem>().Property(i => i.UnitPrice).HasConversion<double>();
        modelBuilder.Entity<SalesReturnItem>().Property(i => i.LineTotal).HasConversion<double>();
        modelBuilder.Entity<StockIssueItem>().Property(i => i.UnitCost).HasConversion<double>();
        modelBuilder.Entity<StockIssueItem>().Property(i => i.LineTotal).HasConversion<double>();
        modelBuilder.Entity<MaintenanceRequest>().Property(m => m.EstimatedCost).HasConversion<double>();
        modelBuilder.Entity<MaintenanceRequest>().Property(m => m.ActualCost).HasConversion<double>();

        modelBuilder.Entity<RegisteredDevice>().HasIndex(d => d.DeviceFingerprint).IsUnique();
        modelBuilder.Entity<UserPermission>().HasIndex(p => new { p.UserId, p.PermissionKey }).IsUnique();
        modelBuilder.Entity<ChartOfAccount>().HasIndex(c => c.Code).IsUnique();
    }
}
