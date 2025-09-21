using System.Security.Cryptography;
using System.Text;

namespace UserApi_20250911.Security
{
    public static class PasswordHasher
    {
        public static (byte[] Salt, byte[] Hash) HashPassword(string password, int iterations = 100_000)
        {
            // 32 bytes salt
            byte[] salt = RandomNumberGenerator.GetBytes(32);
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> developer
            // PBKDF2-HMACSHA256 ? 32 bytes key
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256);
            byte[] key = pbkdf2.GetBytes(32);

            // ?????,????? salt/hash;iterations ????????
<<<<<<< HEAD
=======
            // PBKDF2-HMACSHA256 → 32 bytes key
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256);
            byte[] key = pbkdf2.GetBytes(32);

            // 回傳 salt/hash;iterations 已鎖定在參數
>>>>>>> developer
=======
>>>>>>> developer
            return (salt, key);
        }

        public static bool Verify(string password, byte[] salt, byte[] expected, int iterations = 100_000)
        {
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256);
            byte[] key = pbkdf2.GetBytes(32);
            return CryptographicOperations.FixedTimeEquals(key, expected);
        }
    }
}
