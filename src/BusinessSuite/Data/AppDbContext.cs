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
    }
}
