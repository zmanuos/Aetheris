public class EmailResponse : JsonResponse
{
    public string Email { get; set; }

    public static EmailResponse GetResponse(string email)
    {
        return new EmailResponse
        {
            Status = 0,
            Email = email
        };
    }
}