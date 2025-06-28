
public class MessageResponse : JsonResponse
{
    public string Message { get; set;}

    public string Type { get; set; }

    public static MessageResponse GetReponse(int status, string message, MessageType type)
    {
        MessageResponse r = new MessageResponse();
        r.Status = status;
        r.Message = message;
        r.Type = type.ToString();
        return r;
    }
}
