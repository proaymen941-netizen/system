using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public class HrService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;

    public HrService(IDbContextFactory<AppDbContext> factory, AuthService auth)
    {
        _factory = factory;
        _auth = auth;
    }

    public async Task<List<Employee>> GetEmployeesAsync()
    {
        await using var db = _factory.CreateDbContext();
        return await db.Employees.OrderBy(e => e.Name).ToListAsync();
    }

    public async Task<Employee?> GetEmployeeAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        return await db.Employees.FindAsync(id);
    }

    public async Task SaveEmployeeAsync(Employee e)
    {
        if (!_auth.HasRole(UserRole.Admin)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        if (e.Id == 0) db.Employees.Add(e); else db.Employees.Update(e);
        await db.SaveChangesAsync();
    }

    public async Task DeleteEmployeeAsync(int id)
    {
        if (!_auth.HasRole(UserRole.Admin)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var e = await db.Employees.FindAsync(id);
        if (e != null) { db.Employees.Remove(e); await db.SaveChangesAsync(); }
    }

    public async Task<List<Attendance>> GetAttendanceAsync(DateTime? date = null)
    {
        await using var db = _factory.CreateDbContext();
        var d = (date ?? DateTime.Today).Date;
        return await db.Attendances.Include(a => a.Employee).Where(a => a.Date == d).ToListAsync();
    }

    public async Task<List<Attendance>> GetAttendanceRangeAsync(DateTime from, DateTime to, int? employeeId = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.Attendances.Include(a => a.Employee).Where(a => a.Date >= from.Date && a.Date <= to.Date);
        if (employeeId.HasValue) q = q.Where(a => a.EmployeeId == employeeId.Value);
        return await q.OrderByDescending(a => a.Date).ToListAsync();
    }

    public async Task CheckInAsync(int employeeId)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var today = DateTime.Today;
        var existing = await db.Attendances.FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date == today);
        if (existing == null)
        {
            db.Attendances.Add(new Attendance { EmployeeId = employeeId, Date = today, CheckIn = DateTime.Now.TimeOfDay, Status = "حاضر" });
        }
        else if (existing.CheckIn == null)
        {
            existing.CheckIn = DateTime.Now.TimeOfDay;
            existing.Status = "حاضر";
        }
        await db.SaveChangesAsync();
    }

    public async Task CheckOutAsync(int employeeId)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var today = DateTime.Today;
        var existing = await db.Attendances.FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date == today);
        if (existing != null) { existing.CheckOut = DateTime.Now.TimeOfDay; await db.SaveChangesAsync(); }
    }

    public async Task SetAttendanceStatusAsync(int employeeId, DateTime date, string status)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var d = date.Date;
        var existing = await db.Attendances.FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date == d);
        if (existing == null)
        {
            db.Attendances.Add(new Attendance { EmployeeId = employeeId, Date = d, Status = status });
        }
        else
        {
            existing.Status = status;
        }
        await db.SaveChangesAsync();
    }

    public async Task<List<LeaveRequest>> GetLeavesAsync()
    {
        await using var db = _factory.CreateDbContext();
        return await db.Leaves.Include(l => l.Employee).OrderByDescending(l => l.From).ToListAsync();
    }

    public async Task SaveLeaveAsync(LeaveRequest l)
    {
        if (!_auth.HasRole(UserRole.Admin, UserRole.Accountant, UserRole.Employee)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        if (l.Id == 0) db.Leaves.Add(l); else db.Leaves.Update(l);
        await db.SaveChangesAsync();
    }

    public async Task SetLeaveStatusAsync(int id, string status)
    {
        if (!_auth.HasRole(UserRole.Admin)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var l = await db.Leaves.Include(x => x.Employee).FirstOrDefaultAsync(x => x.Id == id);
        if (l == null) return;
        l.Status = status;
        if (l.Employee != null && status == "موافق عليها")
            l.Employee.Status = EmployeeStatus.OnLeave;
        await db.SaveChangesAsync();
    }

    public async Task DeleteLeaveAsync(int id)
    {
        if (!_auth.HasRole(UserRole.Admin)) throw new AuthorizationException();
        await using var db = _factory.CreateDbContext();
        var l = await db.Leaves.FindAsync(id);
        if (l != null) { db.Leaves.Remove(l); await db.SaveChangesAsync(); }
    }

    public async Task<decimal> GetTotalPayrollAsync()
    {
        await using var db = _factory.CreateDbContext();
        return (decimal)await db.Employees.Where(e => e.Status == EmployeeStatus.Active).SumAsync(e => (double)e.Salary);
    }
}
