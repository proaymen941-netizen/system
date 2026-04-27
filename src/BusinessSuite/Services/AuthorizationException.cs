namespace BusinessSuite.Services;

public class AuthorizationException : Exception
{
    public AuthorizationException(string message = "ليس لديك صلاحية لتنفيذ هذا الإجراء")
        : base(message) { }
}
