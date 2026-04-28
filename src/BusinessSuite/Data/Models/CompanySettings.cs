using System.ComponentModel.DataAnnotations;

namespace BusinessSuite.Data.Models;

public class CompanySettings
{
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string Name { get; set; } = "شركتي";

    [MaxLength(50)]
    public string TaxNumber { get; set; } = "";

    [MaxLength(50)]
    public string CommercialRegister { get; set; } = "";

    [MaxLength(20)]
    public string Phone { get; set; } = "";

    [MaxLength(120)]
    public string Email { get; set; } = "";

    [MaxLength(250)]
    public string Address { get; set; } = "";

    [MaxLength(20)]
    public string Currency { get; set; } = "ر.س";

    public decimal TaxRate { get; set; } = 15m;

    [MaxLength(10)]
    public string LogoEmoji { get; set; } = "🌿";

    [MaxLength(200)]
    public string ReceiptHeader { get; set; } = "مرحباً بكم";

    [MaxLength(200)]
    public string ReceiptFooter { get; set; } = "شكراً لزيارتكم — يسعدنا خدمتكم دائماً";

    public bool ShowTaxOnReceipt { get; set; } = true;
    public bool ShowQrOnReceipt { get; set; } = true;
    public bool PrintKitchenCopy { get; set; } = true;
    public bool RestaurantMode { get; set; } = false;

    [MaxLength(100)]
    public string OrderTypeLocal { get; set; } = "محلي";

    [MaxLength(100)]
    public string OrderTypeTakeaway { get; set; } = "آمر صرف";

    [MaxLength(100)]
    public string OrderTypeDelivery { get; set; } = "توصيل";

    // Branch / multi-language data (compatible with classic ERP branch screen)
    [MaxLength(20)]
    public string BranchCode { get; set; } = "";

    [MaxLength(150)]
    public string ArabicName { get; set; } = "";

    [MaxLength(150)]
    public string ForeignName { get; set; } = "";

    [MaxLength(250)]
    public string ArabicAddress { get; set; } = "";

    [MaxLength(250)]
    public string ForeignAddress { get; set; } = "";

    [MaxLength(20)]
    public string FinancialYear { get; set; } = "";

    [MaxLength(30)]
    public string Fax { get; set; } = "";

    [MaxLength(30)]
    public string PoBox { get; set; } = "";

    [MaxLength(150)]
    public string Website { get; set; } = "";
}
