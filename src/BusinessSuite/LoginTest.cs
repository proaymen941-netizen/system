using System;
using System.Text;
using System.Security.Cryptography;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using BusinessSuite.Services;

namespace BusinessSuite;

class LoginTest
{
    static void Main(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("Data Source=C:/Users/DZ/Downloads/src/BusinessSuite/bin/Debug/net8.0/AppData/businesssuite.db")
            .Options;

        using var db = new AppDbContext(options);
        var users = db.Users.ToList();
        Console.WriteLine($"Total users in DB: {users.Count}");
        foreach (var u in users)
        {
            var hash = ConvertToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("123456")));
            Console.WriteLine($"User: Username='{u.Username}' (hex: {BitConverter.ToString(Encoding.UTF8.GetBytes(u.Username))}), FullName='{u.FullName}', Role={u.Role}, IsActive={u.IsActive}, UserNumber={u.UserNumber}");
            Console.WriteLine($"  PasswordHash in DB: {u.PasswordHash}");
            Console.WriteLine($"  SHA256('123456'):     {hash}");
            Console.WriteLine($"  Match: {u.PasswordHash == hash}");
        }

        var factory = new DbContextFactory(options);
        var auth = new AuthService(factory);
        
        Console.WriteLine("\n--- Testing login with Username 'ايمن' and Password '123456' ---");
        var result = auth.LoginAsync("ايمن", "123456").Result;
        Console.WriteLine($"Login result: {result}");
        Console.WriteLine($"CurrentUser after login: {auth.CurrentUser?.Username ?? "null"}");
        Console.WriteLine($"IsAuthenticated: {auth.IsAuthenticated}");
        
        if (result)
        {
            Console.WriteLine("\n[SUCCESS] Login with credentials (ايمن / 123456) succeeded!");
        }
        else
        {
            Console.WriteLine("\n[FAILED] Login with credentials (ايمن / 123456) failed!");
        }
    }

    static string ConvertToHexString(byte[] bytes) => string.Concat(bytes.Select(b => b.ToString("X2")));
}

class DbContextFactory : IDbContextFactory<AppDbContext>
{
    private readonly DbContextOptions<AppDbContext> _options;
    public DbContextFactory(DbContextOptions<AppDbContext> options) => _options = options;
    public AppDbContext CreateDbContext() => new AppDbContext(_options);
}
