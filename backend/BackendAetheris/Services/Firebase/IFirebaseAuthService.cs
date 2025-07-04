// Services/Firebase/IFirebaseAuthService.cs
using FirebaseAdmin.Auth;
using System.Threading.Tasks;

public interface IFirebaseAuthService
{
    Task UpdateUserEmailAsync(string firebaseUid, string newEmail);
    Task SetUserPasswordAsync(string firebaseUid, string newPassword);
    Task<UserRecord> GetUserByUidAsync(string firebaseUid);

}