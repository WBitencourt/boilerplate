# 🚀 Raspberry Pi server setup guide

[English](README.md) | [Português](README.pt-br.md)

This guide documents the setup of a Raspberry Pi 3 B+ server focused on security, remote access via Meshnet, and preparation for development environments. The configuration was performed from a computer running Ubuntu Linux.

## 💻 Setup used (configuration computer)

- **Laptop:** Samsung Galaxy Book 2
- **Processor:** Intel Core i5 (11th generation)
- **Memory:** 32 GB RAM DDR4 3200 MHz (Kingston FURY)
- **Storage:** 980 GB SSD (Kingston) + 256 GB SSD (native)
- **Operating system:** Ubuntu Linux

## 🛠 Hardware used (Raspberry Pi) as server

- **Device:** Raspberry Pi 3 Model B+ (1GB RAM)
- **Storage:** 64GB Micro SD
- **Initial access:** HDMI cable + Monitor (only for first boot)

## 💾 1. OS image preparation

Use Raspberry Pi Imager to write the image to the SD card and follow the steps.

```bash
https://www.raspberrypi.com/software
```

```bash
# Permissions (Linux)
chmod 700 ./name-of-appimage.AppImage
sudo ./name-of-appimage.AppImage
```

- **Advanced settings (gear icon):**
  - Hostname: raspberry-server
  - User: wbitencourt
  - Wi-fi: Configure SSID and password.
  - SSH: Select "Allow public-key authentication only".
  - I recommend configuring and accepting Raspberry Connect for easier access in case you get locked out of your server

## 🔑 SSH key generation

To access the server from your machine, use an existing key or create a dedicated key for the server:

If you prefer to create a dedicated key:
```bash
ssh-keygen -t ed25519 -C "one comment here - raspberry-server"
# Save as: ~/.ssh/id_ed25519_raspberry_server
```

Copy the contents of the public key (.pub) and paste it into the Imager SSH field.

## 🛡 2. First access and initial security

After boot, remove the SD card with the Imager properly configured and insert it into your Raspberry Pi.

In parallel, simplify server access by creating a shortcut in your `~/.ssh/config` file:

```
Host raspberry-server
  HostName raspberry-server.local #Important: .local at the end of the hostname
  User wbitencourt
  IdentityFile ~/.ssh/id_ed25519_raspberry_server
  IdentitiesOnly yes
```

### System update and base firewall (on the server)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install ufw -y

# WARNING: Allow port 22 before enabling UFW
sudo ufw allow 22/tcp
sudo ufw enable
```

## ✅ Firewall status (`sudo ufw status`)

| To              | Action | From            |
| --------------- | ------ | --------------- |
| 22/tcp          | ALLOW  | Anywhere        |
| 22/tcp (v6)     | ALLOW  | Anywhere (v6)   |

## 🌐 3. NordVPN & Meshnet (worldwide remote access)

### Installation

```bash
sh <(curl -sSf https://downloads.nordcdn.com/apps/linux/install.sh)
sudo usermod -aG nordvpn $USER

# usermod: System tool to modify user accounts.
# -aG:
#     -a stands for append. It ensures you are added to the new group without being removed from groups you already belong to.
#     -G indicates that what follows is a group name.
# nordvpn: Name of the user group created by the NordVPN application.
# $USER: System variable that automatically expands to your current username.
```

### Authentication via access token

Generate a token in the NordAccount dashboard and run on the Raspberry Pi:

```bash
# https://my.nordaccount.com/dashboard/nordvpn/access-tokens
nordvpn login --token YOUR_TOKEN_HERE
```

### Network settings

To avoid blocking local access when using the VPN:

```bash
# Enables discovery via .local and automatic local network
nordvpn set lan-discovery on

# Or whitelist explicitly
nordvpn whitelist add subnet 192.168.10.0/24
nordvpn whitelist add port 22
```

```bash
# Enable NordLynx technology and Meshnet
nordvpn set technology nordlynx
nordvpn set meshnet on
```

### Meshnet IPs and shortcut

Get your Meshnet IP: `ip addr show nordlynx`. Add a second host in your `~/.ssh/config`:

```
Host raspberry-server-nordvpn
  HostName 100.XX.XX.XX # Your Meshnet IP
  User wbitencourt
  IdentityFile ~/.ssh/id_ed25519_raspberry_server
  IdentitiesOnly yes
```

View all devices on your private network
```bash
nordvpn meshnet peer list
```

## 🔒 4. Firewall hardening (UFW)

Now that Meshnet is active, we will restrict access to what is secure only.

```bash
# 1. Allow full access via Meshnet virtual interface
sudo ufw allow in on nordlynx

# 2. Allow SSH only from local network (SBC/Home)
sudo ufw allow from 192.168.10.0/24 to any port 22 proto tcp

# 3. Remove the generic rule (Do not accept SSH from the public internet)
sudo ufw delete allow 22/tcp
```

## ⚙️ 5. System adjustments

```bash
# Ensure firewall starts on boot
sudo systemctl enable ufw

# Set correct timezone (Brazil/SBC)
sudo timedatectl set-timezone America/Sao_Paulo
```

## 📂 6. Usage tips: file sharing

Meshnet allows you to send files encrypted between your devices:

- **On the sending device (Galaxy Book 2):**

```bash
nordvpn fileshare send [RASPBERRY-IP] ~/path/to/file.pdf
```

- **On the server (Raspberry Pi):** List received files: `nordvpn fileshare list`  
  Accept the file:

```bash
nordvpn fileshare accept --path /home/wbitencourt/files [FILE-UUID]
```

## ✅ Final firewall status (`sudo ufw status`)

| To                        | Action | From            |
| ------------------------- | ------ | --------------- |
| Anywhere on nordlynx      | ALLOW  | Anywhere        |
| Anywhere (v6) on nordlynx | ALLOW  | Anywhere (v6)   |
| 22/tcp                    | ALLOW  | 192.168.10.0/24 |
