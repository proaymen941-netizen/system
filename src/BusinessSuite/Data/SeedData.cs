using BusinessSuite.Data.Models;
using BusinessSuite.Services;

namespace BusinessSuite.Data;

public static class SeedData
{
    public static void SeedBranchesAndWarehouses(AppDbContext db)
    {
        if (!db.Branches.Any())
        {
            db.Branches.Add(new Branch
            {
                Code = "01",
                ArabicName = "الفرع الرئيسي",
                ForeignName = "Main Branch",
                FinancialYear = DateTime.Now.Year.ToString(),
                IsMain = true,
                IsActive = true,
                Phone = "0112345678",
                City = "الرياض",
                Region = "منطقة الرياض",
                Country = "المملكة العربية السعودية",
                Manager = "مدير النظام",
            });
            db.SaveChanges();
        }

        if (!db.Warehouses.Any())
        {
            var mainBranch = db.Branches.FirstOrDefault(b => b.IsMain);
            db.Warehouses.Add(new Warehouse
            {
                Code = "01",
                Name = "المخزن الرئيسي",
                ForeignName = "Main Warehouse",
                BranchId = mainBranch?.Id,
                IsMain = true,
                IsActive = true,
                WarehouseType = "رئيسي",
                City = "الرياض",
                Country = "المملكة العربية السعودية",
                Manager = "أمين المخزن",
            });
            db.SaveChanges();
        }
    }

    public static void SeedCurrencies(AppDbContext db)
    {
        if (db.Currencies.Any()) return;
        db.Currencies.Add(new Currency
        {
            Code = "SAR",
            Name = "ريال سعودي",
            Country = "المملكة العربية السعودية",
            Symbol = "ر.س",
            Kind = CurrencyKind.Local,
            ExchangeRate = 1m,
            IsActive = true,
            IsBase = true,
        });
        db.Currencies.Add(new Currency
        {
            Code = "USD",
            Name = "دولار أمريكي",
            Country = "الولايات المتحدة",
            Symbol = "$",
            Kind = CurrencyKind.Foreign,
            ExchangeRate = 3.75m,
            IsActive = true,
            IsBase = false,
        });
        db.Currencies.Add(new Currency
        {
            Code = "EUR",
            Name = "يورو",
            Country = "الاتحاد الأوروبي",
            Symbol = "€",
            Kind = CurrencyKind.Foreign,
            ExchangeRate = 4.05m,
            IsActive = true,
            IsBase = false,
        });
        db.SaveChanges();
    }

    public static void Initialize(AppDbContext db)
    {
        foreach (var u in db.Users.Where(u => u.UserNumber == null).ToList())
        {
            u.UserNumber = 100 + u.Id;
        }
        db.SaveChanges();

        if (!db.CompanySettings.Any())
        {
            db.CompanySettings.Add(new CompanySettings
            {
                Name = "شركتي للتجارة",
                TaxNumber = "300000000000003",
                CommercialRegister = "1010000000",
                Phone = "0112345678",
                Email = "info@company.com",
                Address = "الرياض - حي العليا",
                Currency = "ر.س",
                TaxRate = 15,
                LogoEmoji = "🌿",
            });
            db.SaveChanges();
        }

        if (!db.Customers.Any())
        {
            db.Customers.AddRange(
                new Customer { Name = "زبون نقدي", Phone = "", Address = "" },
                new Customer { Name = "عميل دائم", Phone = "0501112233", Address = "الرياض" },
                new Customer { Name = "شركة الفهد", Phone = "0112224455", Email = "fahd@example.com", Address = "جدة", TaxNumber = "300111222333" }
            );
            db.SaveChanges();
        }

        if (db.Employees.Any() || db.Products.Any()) return;

        var employees = new[]
        {
            new Employee { Name = "أحمد محمد علي", Position = "محاسب", Department = "المالية", Phone = "0501234567", Email = "ahmad@company.com", Salary = 6500, HireDate = DateTime.Today.AddYears(-2), Status = EmployeeStatus.Active },
            new Employee { Name = "سارة خالد", Position = "موظفة موارد بشرية", Department = "الموارد البشرية", Phone = "0507654321", Email = "sara@company.com", Salary = 5500, HireDate = DateTime.Today.AddYears(-1), Status = EmployeeStatus.Active },
            new Employee { Name = "محمد عبدالله", Position = "أمين مخزن", Department = "المخازن", Phone = "0503456789", Email = "mohammed@company.com", Salary = 4500, HireDate = DateTime.Today.AddMonths(-8), Status = EmployeeStatus.Active },
            new Employee { Name = "ليلى عمر", Position = "كاشير", Department = "المبيعات", Phone = "0504567890", Email = "layla@company.com", Salary = 4000, HireDate = DateTime.Today.AddMonths(-5), Status = EmployeeStatus.OnLeave },
            new Employee { Name = "خالد سعيد", Position = "مدير المبيعات", Department = "المبيعات", Phone = "0509876543", Email = "khaled@company.com", Salary = 9000, HireDate = DateTime.Today.AddYears(-3), Status = EmployeeStatus.Active },
        };
        db.Employees.AddRange(employees);

        var products = new[]
        {
            new Product { Name = "هاتف ذكي", Sku = "PH-001", Category = "إلكترونيات", Price = 1200, Cost = 950, Quantity = 25, MinQuantity = 5, ImageEmoji = "📱" },
            new Product { Name = "سماعة بلوتوث", Sku = "AU-002", Category = "إلكترونيات", Price = 150, Cost = 90, Quantity = 40, MinQuantity = 10, ImageEmoji = "🎧" },
            new Product { Name = "شاشة كمبيوتر", Sku = "MN-003", Category = "إلكترونيات", Price = 800, Cost = 600, Quantity = 12, MinQuantity = 4, ImageEmoji = "🖥️" },
            new Product { Name = "زيت زيتون 1 لتر", Sku = "GR-004", Category = "مواد غذائية", Price = 35, Cost = 22, Quantity = 80, MinQuantity = 20, ImageEmoji = "🫒" },
            new Product { Name = "أرز 5 كجم", Sku = "GR-005", Category = "مواد غذائية", Price = 60, Cost = 42, Quantity = 50, MinQuantity = 15, ImageEmoji = "🍚" },
            new Product { Name = "قميص قطن", Sku = "CL-006", Category = "ملابس", Price = 120, Cost = 70, Quantity = 35, MinQuantity = 10, ImageEmoji = "👕" },
            new Product { Name = "حذاء رياضي", Sku = "CL-007", Category = "ملابس", Price = 250, Cost = 160, Quantity = 18, MinQuantity = 5, ImageEmoji = "👟" },
            new Product { Name = "كرتون حليب", Sku = "GR-008", Category = "مواد غذائية", Price = 45, Cost = 30, Quantity = 4, MinQuantity = 10, ImageEmoji = "🥛" },
        };
        db.Products.AddRange(products);

        var suppliers = new[]
        {
            new Supplier { Name = "شركة الشرق للتوريدات", Phone = "0112345678", Email = "info@sharq.com", Address = "الرياض", Balance = 0 },
            new Supplier { Name = "مؤسسة النور التجارية", Phone = "0113456789", Email = "info@noor.com", Address = "جدة", Balance = 1200 },
            new Supplier { Name = "شركة الأمل", Phone = "0114567890", Email = "info@amal.com", Address = "الدمام", Balance = 0 },
        };
        db.Suppliers.AddRange(suppliers);

        db.SaveChanges();

        var prods = db.Products.ToList();
        var rnd = new Random(42);
        var sales = new List<SaleInvoice>();
        for (int i = 0; i < 12; i++)
        {
            var date = DateTime.Now.AddDays(-rnd.Next(0, 7)).AddHours(-rnd.Next(0, 8));
            var inv = new SaleInvoice
            {
                InvoiceNumber = $"#10{20 + i}",
                Date = date,
                PaymentMethod = i % 3 == 0 ? "بطاقة" : "نقدي",
                CustomerName = i % 4 == 0 ? "عميل دائم" : "زبون نقدي",
            };
            int itemsCount = rnd.Next(1, 4);
            for (int j = 0; j < itemsCount; j++)
            {
                var p = prods[rnd.Next(prods.Count)];
                int qty = rnd.Next(1, 3);
                inv.Items.Add(new SaleInvoiceItem
                {
                    ProductId = p.Id,
                    ProductName = p.Name,
                    Quantity = qty,
                    UnitPrice = p.Price,
                    LineTotal = qty * p.Price,
                });
            }
            inv.Subtotal = inv.Items.Sum(x => x.LineTotal);
            inv.Tax = Math.Round(inv.Subtotal * 0.15m, 2);
            inv.Total = inv.Subtotal + inv.Tax;
            sales.Add(inv);
        }
        db.SaleInvoices.AddRange(sales);

        var supList = db.Suppliers.ToList();
        var purchases = new List<PurchaseInvoice>();
        for (int i = 0; i < 4; i++)
        {
            var sup = supList[i % supList.Count];
            var inv = new PurchaseInvoice
            {
                InvoiceNumber = $"PUR-{2024}-{100 + i}",
                SupplierId = sup.Id,
                Date = DateTime.Now.AddDays(-rnd.Next(1, 30)),
                Status = i % 3 == 0 ? "معلق" : "مدفوع",
            };
            for (int j = 0; j < rnd.Next(1, 3); j++)
            {
                var p = prods[rnd.Next(prods.Count)];
                int qty = rnd.Next(5, 20);
                inv.Items.Add(new PurchaseInvoiceItem
                {
                    ProductId = p.Id,
                    ProductName = p.Name,
                    Quantity = qty,
                    UnitCost = p.Cost,
                    LineTotal = qty * p.Cost,
                });
            }
            inv.Total = inv.Items.Sum(x => x.LineTotal);
            purchases.Add(inv);
        }
        db.PurchaseInvoices.AddRange(purchases);

        var entries = new List<JournalEntry>
        {
            new() { Date = DateTime.Now.AddDays(-25), Type = EntryType.Income, Category = "مبيعات", Description = "إيراد مبيعات الأسبوع", Amount = 12500, Reference = "SALE-W1" },
            new() { Date = DateTime.Now.AddDays(-20), Type = EntryType.Expense, Category = "إيجار", Description = "إيجار المحل", Amount = 3500, Reference = "RENT-M" },
            new() { Date = DateTime.Now.AddDays(-15), Type = EntryType.Expense, Category = "كهرباء", Description = "فاتورة الكهرباء", Amount = 750, Reference = "ELEC" },
            new() { Date = DateTime.Now.AddDays(-10), Type = EntryType.Income, Category = "مبيعات", Description = "إيراد مبيعات الأسبوع", Amount = 18200, Reference = "SALE-W2" },
            new() { Date = DateTime.Now.AddDays(-5), Type = EntryType.Expense, Category = "رواتب", Description = "رواتب الموظفين", Amount = 25500, Reference = "PAYROLL" },
        };
        db.JournalEntries.AddRange(entries);

        db.SaveChanges();
    }
}
