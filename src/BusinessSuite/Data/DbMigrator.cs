using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Data;

public static class DbMigrator
{
    public static void Apply(AppDbContext db)
    {
        var connStr = db.Database.GetConnectionString()!;
        using var conn = new SqliteConnection(connStr);
        conn.Open();

        var columns = GetColumns(conn);

        TryAdd(conn, columns, "SaleInvoices", "CashierId", "INTEGER NULL");
        TryAdd(conn, columns, "SaleInvoices", "CashierName", "TEXT NOT NULL DEFAULT ''");
        TryAdd(conn, columns, "SaleInvoices", "OrderType", "TEXT NOT NULL DEFAULT 'محلي'");
        TryAdd(conn, columns, "SaleInvoices", "OrderNumber", "INTEGER NOT NULL DEFAULT 0");
        TryAdd(conn, columns, "SaleInvoices", "Notes", "TEXT NOT NULL DEFAULT ''");
        TryAdd(conn, columns, "SaleInvoices", "ShiftId", "INTEGER NULL");

        TryAdd(conn, columns, "Products", "DisplayNumber", "INTEGER NOT NULL DEFAULT 0");
        TryAdd(conn, columns, "SaleInvoiceItems", "DisplayNumber", "INTEGER NOT NULL DEFAULT 0");

        TryAdd(conn, columns, "Users", "UserNumber", "INTEGER NULL");
        TryAdd(conn, columns, "Users", "Email", "TEXT NOT NULL DEFAULT ''");
        TryAdd(conn, columns, "Users", "Phone", "TEXT NOT NULL DEFAULT ''");
        TryAdd(conn, columns, "Users", "Address", "TEXT NOT NULL DEFAULT ''");
        TryAdd(conn, columns, "Users", "Position", "TEXT NOT NULL DEFAULT ''");
        TryAdd(conn, columns, "Users", "Department", "TEXT NOT NULL DEFAULT ''");
        TryAdd(conn, columns, "Users", "DateOfBirth", "TEXT NULL");
        TryAdd(conn, columns, "Users", "EmployeeId", "INTEGER NULL");

        TryAdd(conn, columns, "CompanySettings", "ReceiptHeader", "TEXT NOT NULL DEFAULT 'مرحباً بكم'");
        TryAdd(conn, columns, "CompanySettings", "ReceiptFooter", "TEXT NOT NULL DEFAULT 'شكراً لزيارتكم'");
        TryAdd(conn, columns, "CompanySettings", "ShowTaxOnReceipt", "INTEGER NOT NULL DEFAULT 1");
        TryAdd(conn, columns, "CompanySettings", "ShowQrOnReceipt", "INTEGER NOT NULL DEFAULT 1");
        TryAdd(conn, columns, "CompanySettings", "PrintKitchenCopy", "INTEGER NOT NULL DEFAULT 1");
        TryAdd(conn, columns, "CompanySettings", "RestaurantMode", "INTEGER NOT NULL DEFAULT 0");
        TryAdd(conn, columns, "CompanySettings", "OrderTypeLocal", "TEXT NOT NULL DEFAULT 'محلي'");
        TryAdd(conn, columns, "CompanySettings", "OrderTypeTakeaway", "TEXT NOT NULL DEFAULT 'آمر صرف'");
        TryAdd(conn, columns, "CompanySettings", "OrderTypeDelivery", "TEXT NOT NULL DEFAULT 'توصيل'");

        EnsureTable(conn, "CashierShifts", @"
            CREATE TABLE IF NOT EXISTS ""CashierShifts"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_CashierShifts"" PRIMARY KEY AUTOINCREMENT,
                ""CashierId"" INTEGER NOT NULL DEFAULT 0,
                ""CashierName"" TEXT NOT NULL DEFAULT '',
                ""OpenedAt"" TEXT NOT NULL DEFAULT '',
                ""ClosedAt"" TEXT NULL,
                ""OpeningCash"" REAL NOT NULL DEFAULT 0,
                ""ClosingCash"" REAL NOT NULL DEFAULT 0,
                ""TotalSales"" REAL NOT NULL DEFAULT 0,
                ""TotalCash"" REAL NOT NULL DEFAULT 0,
                ""TotalCard"" REAL NOT NULL DEFAULT 0,
                ""TotalOther"" REAL NOT NULL DEFAULT 0,
                ""InvoiceCount"" INTEGER NOT NULL DEFAULT 0,
                ""Notes"" TEXT NOT NULL DEFAULT '',
                ""IsClosed"" INTEGER NOT NULL DEFAULT 0
            );");

        EnsureTable(conn, "Licenses", @"
            CREATE TABLE IF NOT EXISTS ""Licenses"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Licenses"" PRIMARY KEY AUTOINCREMENT,
                ""CustomerName"" TEXT NOT NULL DEFAULT '',
                ""LicenseKey"" TEXT NOT NULL DEFAULT '',
                ""MaxManagerDevices"" INTEGER NOT NULL DEFAULT 1,
                ""MaxCashierDevices"" INTEGER NOT NULL DEFAULT 1,
                ""MaxAccountantDevices"" INTEGER NOT NULL DEFAULT 0,
                ""ActivatedAt"" TEXT NOT NULL DEFAULT '',
                ""ExpiresAt"" TEXT NULL,
                ""IsActive"" INTEGER NOT NULL DEFAULT 1,
                ""Notes"" TEXT NOT NULL DEFAULT '',
                ""IssuedBy"" TEXT NOT NULL DEFAULT ''
            );");

        EnsureTable(conn, "Devices", @"
            CREATE TABLE IF NOT EXISTS ""Devices"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Devices"" PRIMARY KEY AUTOINCREMENT,
                ""DeviceFingerprint"" TEXT NOT NULL DEFAULT '',
                ""DeviceName"" TEXT NOT NULL DEFAULT '',
                ""Kind"" INTEGER NOT NULL DEFAULT 1,
                ""IpAddress"" TEXT NOT NULL DEFAULT '',
                ""UserAgent"" TEXT NOT NULL DEFAULT '',
                ""RegisteredAt"" TEXT NOT NULL DEFAULT '',
                ""LastSeenAt"" TEXT NOT NULL DEFAULT '',
                ""IsActive"" INTEGER NOT NULL DEFAULT 1,
                ""IsBlocked"" INTEGER NOT NULL DEFAULT 0,
                ""Notes"" TEXT NOT NULL DEFAULT ''
            );
            CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Devices_DeviceFingerprint"" ON ""Devices"" (""DeviceFingerprint"");");

        EnsureTable(conn, "UserPermissions", @"
            CREATE TABLE IF NOT EXISTS ""UserPermissions"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_UserPermissions"" PRIMARY KEY AUTOINCREMENT,
                ""UserId"" INTEGER NOT NULL DEFAULT 0,
                ""PermissionKey"" TEXT NOT NULL DEFAULT '',
                ""IsGranted"" INTEGER NOT NULL DEFAULT 1
            );
            CREATE UNIQUE INDEX IF NOT EXISTS ""IX_UserPermissions_UserId_PermissionKey"" ON ""UserPermissions"" (""UserId"", ""PermissionKey"");");

        EnsureTable(conn, "ChartOfAccounts", @"
            CREATE TABLE IF NOT EXISTS ""ChartOfAccounts"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_ChartOfAccounts"" PRIMARY KEY AUTOINCREMENT,
                ""Code"" TEXT NOT NULL DEFAULT '',
                ""Name"" TEXT NOT NULL DEFAULT '',
                ""Kind"" INTEGER NOT NULL DEFAULT 0,
                ""ParentId"" INTEGER NULL,
                ""IsActive"" INTEGER NOT NULL DEFAULT 1,
                ""Notes"" TEXT NOT NULL DEFAULT '',
                ""OpeningBalance"" REAL NOT NULL DEFAULT 0
            );
            CREATE UNIQUE INDEX IF NOT EXISTS ""IX_ChartOfAccounts_Code"" ON ""ChartOfAccounts"" (""Code"");");

        EnsureTable(conn, "Vouchers", @"
            CREATE TABLE IF NOT EXISTS ""Vouchers"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Vouchers"" PRIMARY KEY AUTOINCREMENT,
                ""VoucherNumber"" TEXT NOT NULL DEFAULT '',
                ""Type"" INTEGER NOT NULL DEFAULT 0,
                ""Status"" INTEGER NOT NULL DEFAULT 0,
                ""Date"" TEXT NOT NULL DEFAULT '',
                ""PartyName"" TEXT NOT NULL DEFAULT '',
                ""PartyType"" TEXT NOT NULL DEFAULT '',
                ""PartyId"" INTEGER NULL,
                ""Amount"" REAL NOT NULL DEFAULT 0,
                ""PaymentMethod"" TEXT NOT NULL DEFAULT 'نقدي',
                ""Description"" TEXT NOT NULL DEFAULT '',
                ""Reference"" TEXT NOT NULL DEFAULT '',
                ""CreatedBy"" TEXT NOT NULL DEFAULT '',
                ""CreatedAt"" TEXT NOT NULL DEFAULT '',
                ""PostedAt"" TEXT NULL,
                ""PostedBy"" TEXT NOT NULL DEFAULT '',
                ""DebitAccountId"" INTEGER NULL,
                ""CreditAccountId"" INTEGER NULL
            );");

        EnsureTable(conn, "ManualJournals", @"
            CREATE TABLE IF NOT EXISTS ""ManualJournals"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_ManualJournals"" PRIMARY KEY AUTOINCREMENT,
                ""EntryNumber"" TEXT NOT NULL DEFAULT '',
                ""Date"" TEXT NOT NULL DEFAULT '',
                ""Description"" TEXT NOT NULL DEFAULT '',
                ""IsPosted"" INTEGER NOT NULL DEFAULT 0,
                ""CreatedBy"" TEXT NOT NULL DEFAULT '',
                ""CreatedAt"" TEXT NOT NULL DEFAULT ''
            );");

        EnsureTable(conn, "ManualJournalLines", @"
            CREATE TABLE IF NOT EXISTS ""ManualJournalLines"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_ManualJournalLines"" PRIMARY KEY AUTOINCREMENT,
                ""ManualJournalEntryId"" INTEGER NOT NULL DEFAULT 0,
                ""AccountId"" INTEGER NOT NULL DEFAULT 0,
                ""Description"" TEXT NOT NULL DEFAULT '',
                ""Debit"" REAL NOT NULL DEFAULT 0,
                ""Credit"" REAL NOT NULL DEFAULT 0
            );");

        EnsureTable(conn, "Custodies", @"
            CREATE TABLE IF NOT EXISTS ""Custodies"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Custodies"" PRIMARY KEY AUTOINCREMENT,
                ""EmployeeId"" INTEGER NOT NULL DEFAULT 0,
                ""Date"" TEXT NOT NULL DEFAULT '',
                ""Amount"" REAL NOT NULL DEFAULT 0,
                ""IsDebit"" INTEGER NOT NULL DEFAULT 1,
                ""Description"" TEXT NOT NULL DEFAULT '',
                ""Reference"" TEXT NOT NULL DEFAULT '',
                ""IsSettled"" INTEGER NOT NULL DEFAULT 0,
                ""SettledAt"" TEXT NULL,
                ""CreatedBy"" TEXT NOT NULL DEFAULT ''
            );");

        EnsureTable(conn, "PenaltiesRewards", @"
            CREATE TABLE IF NOT EXISTS ""PenaltiesRewards"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_PenaltiesRewards"" PRIMARY KEY AUTOINCREMENT,
                ""EmployeeId"" INTEGER NOT NULL DEFAULT 0,
                ""Kind"" INTEGER NOT NULL DEFAULT 0,
                ""Date"" TEXT NOT NULL DEFAULT '',
                ""Amount"" REAL NOT NULL DEFAULT 0,
                ""IsRecurring"" INTEGER NOT NULL DEFAULT 0,
                ""Reason"" TEXT NOT NULL DEFAULT '',
                ""CreatedBy"" TEXT NOT NULL DEFAULT '',
                ""CreatedAt"" TEXT NOT NULL DEFAULT ''
            );");

        EnsureTable(conn, "MonthlyAbsences", @"
            CREATE TABLE IF NOT EXISTS ""MonthlyAbsences"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_MonthlyAbsences"" PRIMARY KEY AUTOINCREMENT,
                ""EmployeeId"" INTEGER NOT NULL DEFAULT 0,
                ""Year"" INTEGER NOT NULL DEFAULT 0,
                ""Month"" INTEGER NOT NULL DEFAULT 0,
                ""AbsentDays"" INTEGER NOT NULL DEFAULT 0,
                ""LateDays"" INTEGER NOT NULL DEFAULT 0,
                ""OvertimeHours"" INTEGER NOT NULL DEFAULT 0,
                ""DeductionAmount"" REAL NOT NULL DEFAULT 0,
                ""Notes"" TEXT NOT NULL DEFAULT '',
                ""CreatedAt"" TEXT NOT NULL DEFAULT ''
            );");

        EnsureTable(conn, "Installments", @"
            CREATE TABLE IF NOT EXISTS ""Installments"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Installments"" PRIMARY KEY AUTOINCREMENT,
                ""EmployeeId"" INTEGER NOT NULL DEFAULT 0,
                ""StartDate"" TEXT NOT NULL DEFAULT '',
                ""TotalAmount"" REAL NOT NULL DEFAULT 0,
                ""MonthlyAmount"" REAL NOT NULL DEFAULT 0,
                ""TotalMonths"" INTEGER NOT NULL DEFAULT 0,
                ""PaidMonths"" INTEGER NOT NULL DEFAULT 0,
                ""IsCompleted"" INTEGER NOT NULL DEFAULT 0,
                ""Description"" TEXT NOT NULL DEFAULT '',
                ""CreatedBy"" TEXT NOT NULL DEFAULT '',
                ""CreatedAt"" TEXT NOT NULL DEFAULT ''
            );");

        EnsureTable(conn, "SalesReturns", @"
            CREATE TABLE IF NOT EXISTS ""SalesReturns"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_SalesReturns"" PRIMARY KEY AUTOINCREMENT,
                ""ReturnNumber"" TEXT NOT NULL DEFAULT '',
                ""Date"" TEXT NOT NULL DEFAULT '',
                ""OriginalInvoiceId"" INTEGER NULL,
                ""OriginalInvoiceNumber"" TEXT NOT NULL DEFAULT '',
                ""CustomerId"" INTEGER NULL,
                ""CustomerName"" TEXT NOT NULL DEFAULT '',
                ""Subtotal"" REAL NOT NULL DEFAULT 0,
                ""Tax"" REAL NOT NULL DEFAULT 0,
                ""Total"" REAL NOT NULL DEFAULT 0,
                ""RefundMethod"" TEXT NOT NULL DEFAULT 'نقدي',
                ""Reason"" TEXT NOT NULL DEFAULT '',
                ""CreatedBy"" TEXT NOT NULL DEFAULT ''
            );");

        EnsureTable(conn, "SalesReturnItems", @"
            CREATE TABLE IF NOT EXISTS ""SalesReturnItems"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_SalesReturnItems"" PRIMARY KEY AUTOINCREMENT,
                ""SalesReturnId"" INTEGER NOT NULL DEFAULT 0,
                ""ProductId"" INTEGER NOT NULL DEFAULT 0,
                ""ProductName"" TEXT NOT NULL DEFAULT '',
                ""Quantity"" INTEGER NOT NULL DEFAULT 0,
                ""UnitPrice"" REAL NOT NULL DEFAULT 0,
                ""LineTotal"" REAL NOT NULL DEFAULT 0
            );");

        EnsureTable(conn, "StockIssues", @"
            CREATE TABLE IF NOT EXISTS ""StockIssues"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_StockIssues"" PRIMARY KEY AUTOINCREMENT,
                ""VoucherNumber"" TEXT NOT NULL DEFAULT '',
                ""Date"" TEXT NOT NULL DEFAULT '',
                ""Reason"" INTEGER NOT NULL DEFAULT 0,
                ""Department"" TEXT NOT NULL DEFAULT '',
                ""ReceivedBy"" TEXT NOT NULL DEFAULT '',
                ""Notes"" TEXT NOT NULL DEFAULT '',
                ""CreatedBy"" TEXT NOT NULL DEFAULT '',
                ""IsPosted"" INTEGER NOT NULL DEFAULT 0
            );");

        EnsureTable(conn, "StockIssueItems", @"
            CREATE TABLE IF NOT EXISTS ""StockIssueItems"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_StockIssueItems"" PRIMARY KEY AUTOINCREMENT,
                ""StockIssueVoucherId"" INTEGER NOT NULL DEFAULT 0,
                ""ProductId"" INTEGER NOT NULL DEFAULT 0,
                ""ProductName"" TEXT NOT NULL DEFAULT '',
                ""Quantity"" INTEGER NOT NULL DEFAULT 0,
                ""UnitCost"" REAL NOT NULL DEFAULT 0,
                ""LineTotal"" REAL NOT NULL DEFAULT 0
            );");

        EnsureTable(conn, "MaintenanceRequests", @"
            CREATE TABLE IF NOT EXISTS ""MaintenanceRequests"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_MaintenanceRequests"" PRIMARY KEY AUTOINCREMENT,
                ""TicketNumber"" TEXT NOT NULL DEFAULT '',
                ""Date"" TEXT NOT NULL DEFAULT '',
                ""CustomerId"" INTEGER NULL,
                ""CustomerName"" TEXT NOT NULL DEFAULT '',
                ""Phone"" TEXT NOT NULL DEFAULT '',
                ""DeviceName"" TEXT NOT NULL DEFAULT '',
                ""SerialNumber"" TEXT NOT NULL DEFAULT '',
                ""ProblemDescription"" TEXT NOT NULL DEFAULT '',
                ""Diagnosis"" TEXT NOT NULL DEFAULT '',
                ""TechnicianId"" INTEGER NULL,
                ""TechnicianName"" TEXT NOT NULL DEFAULT '',
                ""Status"" INTEGER NOT NULL DEFAULT 0,
                ""EstimatedCost"" REAL NOT NULL DEFAULT 0,
                ""ActualCost"" REAL NOT NULL DEFAULT 0,
                ""CompletedAt"" TEXT NULL,
                ""Notes"" TEXT NOT NULL DEFAULT ''
            );");

        conn.Close();
    }

    private static HashSet<string> GetColumns(SqliteConnection conn)
    {
        var result = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table'";
        using var rdr = cmd.ExecuteReader();
        var tables = new List<string>();
        while (rdr.Read()) tables.Add(rdr.GetString(0));
        rdr.Close();

        foreach (var table in tables)
        {
            cmd.CommandText = $"PRAGMA table_info(\"{table}\")";
            using var r2 = cmd.ExecuteReader();
            while (r2.Read()) result.Add($"{table}.{r2["name"]}");
            r2.Close();
        }
        return result;
    }

    private static void TryAdd(SqliteConnection conn, HashSet<string> columns, string table, string column, string definition)
    {
        if (columns.Contains($"{table}.{column}")) return;
        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"ALTER TABLE \"{table}\" ADD COLUMN \"{column}\" {definition}";
        try { cmd.ExecuteNonQuery(); }
        catch (Exception ex) { Console.WriteLine($"[Migration] {table}.{column}: {ex.Message}"); }
    }

    private static void EnsureTable(SqliteConnection conn, string table, string createSql)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'";
        var exists = cmd.ExecuteScalar() != null;
        if (!exists)
        {
            cmd.CommandText = createSql;
            try { cmd.ExecuteNonQuery(); }
            catch (Exception ex) { Console.WriteLine($"[Migration] Create {table}: {ex.Message}"); }
        }
    }
}
