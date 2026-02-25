#!/bin/bash

CERT_FILENAME="9a5ba575.0"
CERT_LOCAL_PATH="./$CERT_FILENAME"
CERT_REMOTE_PATH="/system/etc/security/cacerts/$CERT_FILENAME"

# Cek apakah adb tersedia
if ! command -v adb &> /dev/null; then
    echo "[!] adb tidak ditemukan. Pastikan adb sudah terinstal dan ada di PATH."
    exit 1
fi

# Cek apakah emulator tersedia
if ! command -v emulator &> /dev/null; then
    echo "[!] emulator tidak ditemukan. Pastikan Android SDK emulator sudah terinstal dan ada di PATH."
    exit 1
fi

# Tampilkan daftar AVD
echo "[*] Mendeteksi AVD yang tersedia..."
AVD_LIST=$(emulator -list-avds)

if [ -z "$AVD_LIST" ]; then
    echo "[!] Tidak ditemukan AVD. Buat AVD terlebih dahulu menggunakan Android Studio atau avdmanager."
    exit 1
fi

echo "[*] Daftar AVD yang tersedia:"
i=1
declare -a AVD_ARRAY
while IFS= read -r line; do
    echo "  [$i] $line"
    AVD_ARRAY+=("$line")
    ((i++))
done <<< "$AVD_LIST"

# Pilih AVD
read -p "[?] Pilih nomor AVD yang ingin dijalankan: " CHOICE
if ! [[ "$CHOICE" =~ ^[0-9]+$ ]] || (( CHOICE < 1 || CHOICE > ${#AVD_ARRAY[@]} )); then
    echo "[!] Pilihan tidak valid."
    exit 1
fi

SELECTED_AVD=${AVD_ARRAY[$((CHOICE - 1))]}
echo "[*] Menjalankan emulator: $SELECTED_AVD"

# Jalankan emulator dengan opsi writable system & permissive SELinux
emulator -avd "$SELECTED_AVD" -writable-system -selinux permissive &
EMULATOR_PID=$!

# Tunggu emulator siap
echo "[*] Menunggu device siap..."
adb wait-for-device

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
        kill $EMULATOR_PID
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
    kill $EMULATOR_PID
    exit 1
fi

# Temukan nama file frida-server di /data/local/tmp
echo "[*] Mencari file binary frida-server di device..."
FRIDA_PATH=$(adb shell 'ls /data/local/tmp | grep frida | head -n 1' | tr -d '\r')

if [ -z "$FRIDA_PATH" ]; then
    echo "[!] Tidak ditemukan file frida-server di /data/local/tmp"
    echo "    Silakan push file frida-server ke device:"
    echo "    adb push frida-server-<versi> /data/local/tmp/"
    kill $EMULATOR_PID
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

