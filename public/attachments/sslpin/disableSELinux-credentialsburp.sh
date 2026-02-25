#!/bin/bash

CERT_FILENAME="9a5ba575.0"
CERT_LOCAL_PATH="./$CERT_FILENAME"
CERT_REMOTE_PATH="/system/etc/security/cacerts/$CERT_FILENAME"

# Cek apakah adb tersedia
if ! command -v adb &> /dev/null; then
    echo "[!] adb tidak ditemukan. Pastikan adb sudah terinstal dan ada di PATH."
    exit 1
fi

# Cek device terhubung
echo "[*] Mendeteksi device..."
adb get-state 1>/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "[!] Tidak ada device yang terhubung. Hubungkan device dan pastikan USB debugging aktif."
    exit 1
fi

# Root
echo "[*] Menjalankan adb root..."
adb root
sleep 1

# Remount /system sebagai read-write
echo "[*] Remounting /system sebagai read-write..."
adb remount

# Cek apakah sertifikat sudah ada
echo "[*] Mengecek apakah certificate Burp sudah ada di device..."
if adb shell "[ -f $CERT_REMOTE_PATH ]"; then
    echo "[✓] Sertifikat sudah ada di device: $CERT_REMOTE_PATH"
else
    echo "[*] Sertifikat belum ada. Mem-push certificate $CERT_FILENAME..."
    if [ ! -f "$CERT_LOCAL_PATH" ]; then
        echo "[!] File certificate $CERT_FILENAME tidak ditemukan di direktori lokal."
        exit 1
    fi
    adb push "$CERT_LOCAL_PATH" "$CERT_REMOTE_PATH"
    adb shell "chmod 644 $CERT_REMOTE_PATH"
    echo "[✓] Sertifikat berhasil ditambahkan ke sistem"
fi

# Disable SELinux
echo "[*] Menonaktifkan SELinux (setenforce 0)..."
adb shell "setenforce 0"

# Verifikasi status SELinux
SELINUX_STATUS=$(adb shell getenforce | tr -d '\r')
if [ "$SELINUX_STATUS" == "Permissive" ]; then
    echo "[✓] SELinux berhasil diset ke Permissive"
else
    echo "[!] Gagal mengubah SELinux. Status saat ini: $SELINUX_STATUS"
    echo "    Tidak bisa melanjutkan menjalankan frida-server."
    exit 1
fi

# Temukan nama file frida-server di /data/local/tmp
echo "[*] Mencari file binary frida-server di device..."
FRIDA_PATH=$(adb shell 'ls /data/local/tmp | grep frida | head -n 1' | tr -d '\r')

if [ -z "$FRIDA_PATH" ]; then
    echo "[!] Tidak ditemukan file frida-server di /data/local/tmp"
    echo "    Silakan push file frida-server ke device:"
    echo "    adb push frida-server-<versi> /data/local/tmp/"
    exit 1
fi

FRIDA_FULL_PATH="/data/local/tmp/$FRIDA_PATH"

# Beri permission
echo "[*] Memberi permission execute pada $FRIDA_FULL_PATH..."
adb shell "chmod 755 $FRIDA_FULL_PATH"

echo "[*] Menjalankan frida-server secara langsung (foreground)..."
echo "[...] Tekan Ctrl+C untuk menghentikan."

# Jalankan frida-server langsung di foreground (interactive)
adb shell "$FRIDA_FULL_PATH"

