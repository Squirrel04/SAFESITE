import bcrypt

hash_str = b"$2b$12$yo.PdZVQxthAfKeXt3T5PenxC.MAmPeJjlgzdzMsR7BRlz6wH1BhS"
guesses = [
    "safesite50", "safesite50@gmail.com"
]

found = False
for g in guesses:
    if bcrypt.checkpw(g.encode('utf-8'), hash_str):
        print("FOUND MATCH:", g)
        found = True

if not found:
    print("NO MATCH FOUND")
