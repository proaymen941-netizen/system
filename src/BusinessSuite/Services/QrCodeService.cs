using QRCoder;

namespace BusinessSuite.Services;

public class QrCodeService
{
    public string GenerateBase64Png(string content, int pixelsPerModule = 8)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(content, QRCodeGenerator.ECCLevel.M);
        var png = new PngByteQRCode(data);
        var bytes = png.GetGraphic(pixelsPerModule);
        return $"data:image/png;base64,{Convert.ToBase64String(bytes)}";
    }
}
