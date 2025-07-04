public class PersonalResponse : JsonResponse
{
    public Personal Personal { get; set; }

    public static PersonalResponse GetResponse(Personal _Personal)
    {
        PersonalResponse r = new PersonalResponse();
        r.Status = 0;
        r.Personal = _Personal;
        return r;
    }
}