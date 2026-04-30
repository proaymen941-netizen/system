using BusinessSuite.Data;
using BusinessSuite.Data.Models;
using BusinessSuite.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BusinessSuite.Tests;

public class LicenseServiceTests
{
    private class MockDbContextFactory : IDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }
    }

    [Fact]
    public async Task ValidateLicense_ShouldReturnTrue_ForCorrectHash()
    {
        // Arrange
        var factory = new MockDbContextFactory();
        var service = new LicenseService(factory);
        var lic = await service.GetOrCreateAsync();

        // Act
        var isValid = service.ValidateLicense(lic);

        // Assert
        Assert.True(isValid);
    }

    [Fact]
    public async Task ValidateLicense_ShouldReturnFalse_WhenKeyIsModified()
    {
        // Arrange
        var factory = new MockDbContextFactory();
        var service = new LicenseService(factory);
        var lic = await service.GetOrCreateAsync();
        
        // Modify key manually without updating hash
        lic.LicenseKey = "MODIFIED-KEY";

        // Act
        var isValid = service.ValidateLicense(lic);

        // Assert
        Assert.False(isValid);
    }
}
