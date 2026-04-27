namespace BusinessSuite.Services;

public class BackupService
{
    public string DbPath { get; }
    public string BackupDir { get; }

    public BackupService()
    {
        DbPath = Path.Combine(AppContext.BaseDirectory, "AppData", "businesssuite.db");
        BackupDir = Path.Combine(AppContext.BaseDirectory, "AppData", "Backups");
        Directory.CreateDirectory(BackupDir);
    }

    public string CreateBackup()
    {
        var name = $"backup_{DateTime.Now:yyyyMMdd_HHmmss}.db";
        var path = Path.Combine(BackupDir, name);
        File.Copy(DbPath, path, overwrite: true);
        return path;
    }

    public List<BackupFile> ListBackups()
    {
        if (!Directory.Exists(BackupDir)) return new();
        return new DirectoryInfo(BackupDir)
            .GetFiles("*.db")
            .OrderByDescending(f => f.LastWriteTime)
            .Select(f => new BackupFile(f.Name, f.LastWriteTime, f.Length))
            .ToList();
    }

    public byte[] ReadBackup(string fileName)
    {
        var path = Path.Combine(BackupDir, Path.GetFileName(fileName));
        if (!File.Exists(path)) throw new FileNotFoundException();
        return File.ReadAllBytes(path);
    }

    public byte[] ReadCurrentDb() => File.ReadAllBytes(DbPath);

    public void DeleteBackup(string fileName)
    {
        var path = Path.Combine(BackupDir, Path.GetFileName(fileName));
        if (File.Exists(path)) File.Delete(path);
    }
}

public record BackupFile(string Name, DateTime CreatedAt, long Size);
