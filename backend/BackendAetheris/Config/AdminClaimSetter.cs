using FirebaseAdmin.Auth;
using System.Collections.Generic;
using System.Threading.Tasks;

public class AdminClaimSetter
{
    public static async Task SetAdminClaim(string userEmailOrUid)
    {
        try
        {
            UserRecord userRecord;
            try
            {
                userRecord = await FirebaseAuth.DefaultInstance.GetUserByEmailAsync(userEmailOrUid);
            }
            catch (FirebaseAuthException ex) when (ex.AuthErrorCode == AuthErrorCode.UserNotFound)
            {
                userRecord = await FirebaseAuth.DefaultInstance.GetUserAsync(userEmailOrUid);
            }


            var claims = new Dictionary<string, object>
            {
                { "admin", true }
            };

            await FirebaseAuth.DefaultInstance.SetCustomUserClaimsAsync(userRecord.Uid, claims);

            await FirebaseAuth.DefaultInstance.RevokeRefreshTokensAsync(userRecord.Uid);

            Console.WriteLine($"Claims 'admin: true' establecidos para el usuario con UID: {userRecord.Uid}");
            Console.WriteLine("Los tokens de sesión existentes han sido revocados. El usuario deberá volver a iniciar sesión.");
        }
        catch (FirebaseAuthException ex)
        {
            Console.WriteLine($"Error de Firebase al establecer claims: {ex.Message} (Code: {ex.AuthErrorCode})");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error inesperado: {ex.Message}");
        }
    }
}