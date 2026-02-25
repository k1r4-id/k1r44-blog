#!/bin/bash

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

