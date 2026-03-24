from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash_str = r"$2b$12$yo.PdZVQxthAfKeXt3T5PenxC.MAmPeJjlgzdzMsR7BRlz6wH1BhS"

guesses = [
    "safesite03", "password", "admin", "admin123", "safesite", 
    "password123", "admin@123", "safesite@123", "test", "123456", 
    "12345678", "Safesite03", "Password", "Safesite@123", "Safesite",
    "Admin", "Admin123"
]

found = False
for g in guesses:
    if pwd_context.verify(g, hash_str):
        print("FOUND MATCH:", g)
        found = True

if not found:
    print("NO MATCH FOUND")
