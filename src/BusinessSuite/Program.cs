using BusinessSuite.Components;
using BusinessSuite.Data;
using BusinessSuite.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

var dataDir = Path.Combine(AppContext.BaseDirectory, "AppData");
Directory.CreateDirectory(dataDir);
var dbPath = Path.Combine(dataDir, "businesssuite.db");

builder.Services.AddDbContextFactory<AppDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

builder.Services.AddScoped<HrService>();
builder.Services.AddScoped<InventoryService>();
builder.Services.AddScoped<PosService>();
builder.Services.AddScoped<AccountingService>();
builder.Services.AddScoped<PurchasingService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<CustomerService>();
builder.Services.AddScoped<StockMovementService>();
builder.Services.AddScoped<CompanySettingsService>();
builder.Services.AddScoped<CashierShiftService>();
builder.Services.AddScoped<LicenseService>();
builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<AccountingExtendedService>();
builder.Services.AddScoped<HrExtendedService>();
builder.Services.AddScoped<OperationsExtendedService>();
builder.Services.AddSingleton<BackupService>();
builder.Services.AddSingleton<QrCodeService>();
builder.Services.AddSingleton<ExportService>();

builder.WebHost.UseUrls("http://0.0.0.0:5000");

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var factory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<AppDbContext>>();
    using var db = factory.CreateDbContext();
    db.Database.EnsureCreated();
    DbMigrator.Apply(db);
    SeedData.Initialize(db);
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
}

app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.MapGet("/download/db", (BackupService bs) =>
{
    var bytes = bs.ReadCurrentDb();
    return Results.File(bytes, "application/octet-stream", $"businesssuite_{DateTime.Now:yyyyMMdd_HHmmss}.db");
});

app.MapGet("/download/backup/{name}", (string name, BackupService bs) =>
{
    try
    {
        var bytes = bs.ReadBackup(name);
        return Results.File(bytes, "application/octet-stream", name);
    }
    catch (FileNotFoundException) { return Results.NotFound(); }
});

string Mime(string fmt) => fmt == "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv; charset=utf-8";
byte[] Render<T>(string fmt, string sheet, IEnumerable<T> rows, IEnumerable<(string, Func<T, object?>)> cols, ExportService ex)
    => fmt == "xlsx" ? ex.ToExcel(sheet, rows, cols) : ex.ToCsv(rows, cols);

app.MapGet("/export/sales.{fmt}", async (string fmt, DateTime? from, DateTime? to, string? status, PosService p, ExportService ex) =>
{
    var data = await p.GetRecentSalesAsync(5000, from, to, status);
    var cols = new (string, Func<BusinessSuite.Data.Models.SaleInvoice, object?>)[]
    {
        ("الرقم", x => x.InvoiceNumber),
        ("التاريخ", x => x.Date),
        ("العميل", x => x.CustomerName),
        ("طريقة الدفع", x => x.PaymentMethod),
        ("الحالة", x => x.IsCancelled ? "ملغاة" : x.PaymentStatus.ToString()),
        ("المجموع", x => x.Subtotal),
        ("الضريبة", x => x.Tax),
        ("الإجمالي", x => x.Total),
    };
    return Results.File(Render(fmt, "Sales", data, cols, ex), Mime(fmt), $"sales_{DateTime.Now:yyyyMMdd}.{fmt}");
});

app.MapGet("/export/purchases.{fmt}", async (string fmt, DateTime? from, DateTime? to, PurchasingService ps, ExportService ex) =>
{
    var data = await ps.GetPurchasesAsync(from, to);
    var cols = new (string, Func<BusinessSuite.Data.Models.PurchaseInvoice, object?>)[]
    {
        ("الرقم", x => x.InvoiceNumber),
        ("التاريخ", x => x.Date),
        ("المورد", x => x.Supplier?.Name ?? ""),
        ("الحالة", x => x.Status),
        ("الإجمالي", x => x.Total),
    };
    return Results.File(Render(fmt, "Purchases", data, cols, ex), Mime(fmt), $"purchases_{DateTime.Now:yyyyMMdd}.{fmt}");
});

app.MapGet("/export/journal.{fmt}", async (string fmt, DateTime? from, DateTime? to, AccountingService a, ExportService ex) =>
{
    var data = await a.GetEntriesAsync(from, to);
    var cols = new (string, Func<BusinessSuite.Data.Models.JournalEntry, object?>)[]
    {
        ("التاريخ", x => x.Date),
        ("النوع", x => x.Type == BusinessSuite.Data.Models.EntryType.Income ? "إيراد" : "مصروف"),
        ("الفئة", x => x.Category),
        ("الوصف", x => x.Description),
        ("المبلغ", x => x.Amount),
        ("المرجع", x => x.Reference),
    };
    return Results.File(Render(fmt, "Journal", data, cols, ex), Mime(fmt), $"journal_{DateTime.Now:yyyyMMdd}.{fmt}");
});

app.MapGet("/export/products.{fmt}", async (string fmt, InventoryService inv, ExportService ex) =>
{
    var data = await inv.GetProductsAsync();
    var cols = new (string, Func<BusinessSuite.Data.Models.Product, object?>)[]
    {
        ("الاسم", x => x.Name),
        ("SKU", x => x.Sku),
        ("الفئة", x => x.Category),
        ("السعر", x => x.Price),
        ("التكلفة", x => x.Cost),
        ("الكمية", x => x.Quantity),
        ("الحد الأدنى", x => x.MinQuantity),
        ("قيمة المخزون", x => x.Quantity * x.Cost),
    };
    return Results.File(Render(fmt, "Products", data, cols, ex), Mime(fmt), $"products_{DateTime.Now:yyyyMMdd}.{fmt}");
});

app.MapGet("/export/customers.{fmt}", async (string fmt, CustomerService c, ExportService ex) =>
{
    var data = await c.GetAsync();
    var cols = new (string, Func<BusinessSuite.Data.Models.Customer, object?>)[]
    {
        ("الاسم", x => x.Name),
        ("الهاتف", x => x.Phone),
        ("البريد", x => x.Email),
        ("الرقم الضريبي", x => x.TaxNumber),
        ("العنوان", x => x.Address),
        ("الرصيد", x => x.Balance),
    };
    return Results.File(Render(fmt, "Customers", data, cols, ex), Mime(fmt), $"customers_{DateTime.Now:yyyyMMdd}.{fmt}");
});

app.MapGet("/export/employees.{fmt}", async (string fmt, HrService h, ExportService ex) =>
{
    var data = await h.GetEmployeesAsync();
    var cols = new (string, Func<BusinessSuite.Data.Models.Employee, object?>)[]
    {
        ("الاسم", x => x.Name),
        ("الوظيفة", x => x.Position),
        ("القسم", x => x.Department),
        ("الهاتف", x => x.Phone),
        ("البريد", x => x.Email),
        ("الراتب", x => x.Salary),
        ("تاريخ التوظيف", x => x.HireDate),
        ("الحالة", x => x.Status.ToString()),
    };
    return Results.File(Render(fmt, "Employees", data, cols, ex), Mime(fmt), $"employees_{DateTime.Now:yyyyMMdd}.{fmt}");
});

app.MapGet("/export/stock-movements.{fmt}", async (string fmt, int? productId, DateTime? from, DateTime? to, StockMovementService s, ExportService ex) =>
{
    var data = await s.GetAsync(productId, from, to, 10000);
    var cols = new (string, Func<BusinessSuite.Data.Models.StockMovement, object?>)[]
    {
        ("التاريخ", x => x.Date),
        ("الصنف", x => x.ProductName),
        ("النوع", x => x.Type.ToString()),
        ("التغيير", x => x.Change),
        ("الرصيد", x => x.BalanceAfter),
        ("المرجع", x => x.Reference),
        ("المستخدم", x => x.User),
        ("ملاحظات", x => x.Notes),
    };
    return Results.File(Render(fmt, "StockMovements", data, cols, ex), Mime(fmt), $"stock_{DateTime.Now:yyyyMMdd}.{fmt}");
});

app.MapGet("/export/trial-balance.{fmt}", async (string fmt, DateTime? from, DateTime? to, AccountingService a, ExportService ex) =>
{
    var data = await a.GetTrialBalanceAsync(from, to);
    var cols = new (string, Func<TrialBalanceRow, object?>)[]
    {
        ("الفئة", x => x.Category),
        ("النوع", x => x.Type == BusinessSuite.Data.Models.EntryType.Income ? "إيراد" : "مصروف"),
        ("عدد القيود", x => x.Count),
        ("الإجمالي", x => x.Total),
    };
    return Results.File(Render(fmt, "TrialBalance", data, cols, ex), Mime(fmt), $"trial_balance_{DateTime.Now:yyyyMMdd}.{fmt}");
});

app.Run();
