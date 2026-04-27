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
        try
        {
            cmd.ExecuteNonQuery();
            Console.WriteLine($"[Migration] Added column {table}.{column}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Migration] Failed to add column {table}.{column}: {ex.Message}");
            
            // If column doesn't exist, try to recreate the table (for severe schema mismatches)
            if (ex.Message.Contains("no such table") || ex.Message.Contains("already exists"))
            {
                // These are expected errors if table/column exists, silence them
            }
            else
            {
                // For other errors, attempt a more aggressive fix: drop and recreate
                try
                {
                    Console.WriteLine($"[Migration] Attempting to recreate {table} table...");
                    RecreateTable(conn, table, column, definition);
                }
                catch (Exception rex)
                {
                    Console.WriteLine($"[Migration] Failed to recreate {table}: {rex.Message}");
                }
            }
        }
    }

    private static void RecreateTable(SqliteConnection conn, string table, string newColumn, string newDefinition)
    {
        // Get existing table schema
        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table}'";
        var existingSql = cmd.ExecuteScalar()?.ToString();
        if (string.IsNullOrEmpty(existingSql)) return;

        // Read all data from the table
        var data = new List<Dictionary<string, object?>>();
        cmd.CommandText = $"SELECT * FROM \"{table}\"";
        using var rdr = cmd.ExecuteReader();
        var colNames = Enumerable.Range(0, rdr.FieldCount).Select(rdr.GetName).ToArray();
        while (rdr.Read())
        {
            var row = new Dictionary<string, object?>();
            foreach (var col in colNames)
                row[col] = rdr[col];
            data.Add(row);
        }
        rdr.Close();

        // Drop and recreate with new column
        cmd.CommandText = $"DROP TABLE \"{table}\"";
        cmd.ExecuteNonQuery();

        // Modify CREATE TABLE statement to include new column
        var newCreateSql = AddColumnToCreateStatement(existingSql, table, newColumn, newDefinition);
        cmd.CommandText = newCreateSql;
        cmd.ExecuteNonQuery();

        // Restore data
        var columnList = string.Join(", ", colNames);
        var paramList = string.Join(", ", colNames.Select((c, i) => "@p" + i));
        cmd.CommandText = $"INSERT INTO \"{table}\" ({columnList}) VALUES ({paramList})";
        foreach (var row in data)
        {
            cmd.Parameters.Clear();
            for (int i = 0; i < colNames.Length; i++)
                cmd.Parameters.AddWithValue("@p" + i, row[colNames[i]] ?? DBNull.Value);
            cmd.ExecuteNonQuery();
        }
    }

    private static string AddColumnToCreateStatement(string createSql, string table, string column, string definition)
    {
        // Find the closing parenthesis and insert the new column before it
        var idx = createSql.LastIndexOf(')');
        if (idx < 0) return createSql;
        return createSql.Insert(idx, $", \"{column}\" {definition}");
    }

    private static void EnsureTable(SqliteConnection conn, string table, string createSql)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'";
        var exists = cmd.ExecuteScalar() != null;
        if (!exists)
        {
            cmd.CommandText = createSql;
            cmd.ExecuteNonQuery();
        }
    }
}
