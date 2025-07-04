using System.Collections.Generic;

public class PersonalListResponse : JsonResponse
{
    public List<Personal> Personal { get; set; }

    public static PersonalListResponse GetResponse(List<Personal> _Personal)
    {
        PersonalListResponse r = new PersonalListResponse();
        r.Status = 0;
        r.Personal = _Personal;
        return r;
    }
}