using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessSuite.Services;

public record EmployeeMonthlySummary(int EmployeeId, string EmployeeName, decimal Salary, decimal Penalties, decimal Rewards, decimal Installments, decimal AbsenceDeductions, decimal NetPay);

public class HrExtendedService
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly AuthService _auth;

    public HrExtendedService(IDbContextFactory<AppDbContext> factory, AuthService auth)
    {
        _factory = factory;
        _auth = auth;
    }

    public async Task<List<EmployeePenaltyReward>> GetPenaltiesAsync(int? employeeId = null, PenaltyKind? kind = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.PenaltiesRewards.Include(p => p.Employee).AsQueryable();
        if (employeeId.HasValue) q = q.Where(p => p.EmployeeId == employeeId.Value);
        if (kind.HasValue) q = q.Where(p => p.Kind == kind.Value);
        return await q.OrderByDescending(p => p.Date).ToListAsync();
    }

    public async Task SavePenaltyAsync(EmployeePenaltyReward p)
    {
        await using var db = _factory.CreateDbContext();
        if (p.Id == 0)
        {
            p.CreatedBy = _auth.CurrentUser?.FullName ?? "النظام";
            db.PenaltiesRewards.Add(p);
        }
        else
        {
            db.PenaltiesRewards.Update(p);
        }
        await db.SaveChangesAsync();
    }

    public async Task DeletePenaltyAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var p = await db.PenaltiesRewards.FindAsync(id);
        if (p != null) { db.PenaltiesRewards.Remove(p); await db.SaveChangesAsync(); }
    }

    public async Task<List<MonthlyAbsence>> GetAbsencesAsync(int year, int month)
    {
        await using var db = _factory.CreateDbContext();
        return await db.MonthlyAbsences.Include(a => a.Employee)
            .Where(a => a.Year == year && a.Month == month)
            .ToListAsync();
    }

    public async Task SaveAbsenceAsync(MonthlyAbsence a)
    {
        await using var db = _factory.CreateDbContext();
        var existing = await db.MonthlyAbsences.FirstOrDefaultAsync(x => x.EmployeeId == a.EmployeeId && x.Year == a.Year && x.Month == a.Month);
        if (existing == null)
        {
            db.MonthlyAbsences.Add(a);
        }
        else
        {
            existing.AbsentDays = a.AbsentDays;
            existing.LateDays = a.LateDays;
            existing.OvertimeHours = a.OvertimeHours;
            existing.DeductionAmount = a.DeductionAmount;
            existing.Notes = a.Notes;
        }
        await db.SaveChangesAsync();
    }

    public async Task<List<EmployeeInstallment>> GetInstallmentsAsync(int? employeeId = null)
    {
        await using var db = _factory.CreateDbContext();
        var q = db.Installments.Include(i => i.Employee).AsQueryable();
        if (employeeId.HasValue) q = q.Where(i => i.EmployeeId == employeeId.Value);
        return await q.OrderByDescending(i => i.StartDate).ToListAsync();
    }

    public async Task SaveInstallmentAsync(EmployeeInstallment i)
    {
        await using var db = _factory.CreateDbContext();
        if (i.Id == 0)
        {
            i.CreatedBy = _auth.CurrentUser?.FullName ?? "النظام";
            db.Installments.Add(i);
        }
        else
        {
            db.Installments.Update(i);
        }
        await db.SaveChangesAsync();
    }

    public async Task RegisterInstallmentPaymentAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var i = await db.Installments.FindAsync(id);
        if (i == null || i.IsCompleted) return;
        i.PaidMonths++;
        if (i.PaidMonths >= i.TotalMonths) i.IsCompleted = true;
        await db.SaveChangesAsync();
    }

    public async Task DeleteInstallmentAsync(int id)
    {
        await using var db = _factory.CreateDbContext();
        var i = await db.Installments.FindAsync(id);
        if (i != null) { db.Installments.Remove(i); await db.SaveChangesAsync(); }
    }

    public async Task<EmployeeMonthlySummary> GetMonthlySummaryAsync(int employeeId, int year, int month)
    {
        await using var db = _factory.CreateDbContext();
        var emp = await db.Employees.FindAsync(employeeId);
        if (emp == null) return new(0, "", 0, 0, 0, 0, 0, 0);

        var penalties = await db.PenaltiesRewards
            .Where(p => p.EmployeeId == employeeId && p.Kind == PenaltyKind.Penalty
                        && (p.IsRecurring || (p.Date.Year == year && p.Date.Month == month)))
            .SumAsync(p => p.Amount);
        var rewards = await db.PenaltiesRewards
            .Where(p => p.EmployeeId == employeeId && p.Kind == PenaltyKind.Reward
                        && (p.IsRecurring || (p.Date.Year == year && p.Date.Month == month)))
            .SumAsync(p => p.Amount);
        var installments = await db.Installments
            .Where(i => i.EmployeeId == employeeId && !i.IsCompleted)
            .SumAsync(i => i.MonthlyAmount);
        var absence = await db.MonthlyAbsences
            .Where(a => a.EmployeeId == employeeId && a.Year == year && a.Month == month)
            .SumAsync(a => a.DeductionAmount);

        var net = emp.Salary - penalties + rewards - installments - absence;
        return new(emp.Id, emp.Name, emp.Salary, penalties, rewards, installments, absence, net);
    }
}
