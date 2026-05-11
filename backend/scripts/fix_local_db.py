import sqlite3
import os

db_path = "joblume.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(50) DEFAULT 'free'")
        conn.commit()
        print("[+] Successfully patched subscription_tier locally!")
    except Exception as e:
        print(f"[!] Skipped/Error: {e}")
    conn.close()
else:
    print("[-] Could not find local sqlite file.")
