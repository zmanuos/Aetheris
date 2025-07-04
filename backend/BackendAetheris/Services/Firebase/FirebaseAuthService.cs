// Services/Firebase/FirebaseAuthService.cs
using FirebaseAdmin.Auth;
using System.Threading.Tasks;
using System;

public class FirebaseAuthService : IFirebaseAuthService
{
    public async Task UpdateUserEmailAsync(string firebaseUid, string newEmail)
    {
        await FirebaseAuth.DefaultInstance.UpdateUserAsync(new UserRecordArgs
        {
            Uid = firebaseUid,
            Email = newEmail,
            EmailVerified = false
        });
    }

    public async Task SetUserPasswordAsync(string firebaseUid, string newPassword)
    {
        await FirebaseAuth.DefaultInstance.UpdateUserAsync(new UserRecordArgs
        {
            Uid = firebaseUid,
            Password = newPassword
        });
    }

    public async Task<UserRecord> GetUserByUidAsync(string firebaseUid)
    {
        return await FirebaseAuth.DefaultInstance.GetUserAsync(firebaseUid);
    }
}