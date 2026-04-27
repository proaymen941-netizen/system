using System.Globalization;
using System.Text;
using ClosedXML.Excel;

namespace BusinessSuite.Services;

public class ExportService
{
    public byte[] ToCsv<T>(IEnumerable<T> rows, IEnumerable<(string Header, Func<T, object?> Selector)> columns)
    {
        var sb = new StringBuilder();
        sb.Append('\uFEFF');
        sb.AppendLine(string.Join(",", columns.Select(c => Escape(c.Header))));
        foreach (var row in rows)
        {
            sb.AppendLine(string.Join(",", columns.Select(c => Escape(Format(c.Selector(row))))));
        }
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public byte[] ToExcel<T>(string sheetName, IEnumerable<T> rows, IEnumerable<(string Header, Func<T, object?> Selector)> columns)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add(SafeSheet(sheetName));
        ws.RightToLeft = true;

        var cols = columns.ToList();
        for (int i = 0; i < cols.Count; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = cols[i].Header;
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1e293b");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        int rowIdx = 2;
        foreach (var item in rows)
        {
            for (int i = 0; i < cols.Count; i++)
            {
                var value = cols[i].Selector(item);
                ws.Cell(rowIdx, i + 1).Value = ConvertToCellValue(value);
            }
            rowIdx++;
        }

        ws.Columns().AdjustToContents();
        ws.SheetView.FreezeRows(1);

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    private static XLCellValue ConvertToCellValue(object? value)
    {
        if (value == null) return Blank.Value;
        return value switch
        {
            string s => s,
            DateTime dt => dt,
            bool b => b,
            int i => i,
            long l => l,
            double d => d,
            decimal m => m,
            float f => f,
            _ => value.ToString() ?? string.Empty,
        };
    }

    private static string Escape(string? input)
    {
        if (string.IsNullOrEmpty(input)) return "";
        if (input.Contains(',') || input.Contains('"') || input.Contains('\n'))
            return $"\"{input.Replace("\"", "\"\"")}\"";
        return input;
    }

    private static string Format(object? v) => v switch
    {
        null => "",
        DateTime dt => dt.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture),
        decimal m => m.ToString("0.##", CultureInfo.InvariantCulture),
        double d => d.ToString("0.##", CultureInfo.InvariantCulture),
        _ => v.ToString() ?? "",
    };

    private static string SafeSheet(string name)
    {
        var s = string.IsNullOrWhiteSpace(name) ? "Sheet" : name;
        foreach (var c in new[] { ':', '\\', '/', '?', '*', '[', ']' })
            s = s.Replace(c, ' ');
        return s.Length > 30 ? s.Substring(0, 30) : s;
    }
}
