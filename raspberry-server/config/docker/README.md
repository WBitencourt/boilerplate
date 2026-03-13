# Docker Installation on Raspberry (Debian)

This guide describes two ways to install Docker: a **quick** method (for development) and the **official repository** method (recommended for production).

## 🛠 Hardware used (Raspberry Pi) as server

- **Device:** Raspberry Pi 3 Model B+ (1GB RAM)
- **Storage:** 64GB Micro SD
- **Initial access:** HDMI cable + Monitor (only for first boot)

---

# 1. Quick method (development)

Create a folder for downloads and fetch the installation script:

```bash
mkdir downloads
curl -fsSL https://get.docker.com -o get-docker.sh
```

Install Docker:

```bash
sudo sh get-docker.sh
```

This method is convenient for development; for **production**, use the method in section 2.

---

# 2. Recommended method for production

Follow the official Docker documentation for Debian:

**https://docs.docker.com/engine/install/debian**

---

# 3. Commands used during installation (official repository)

The commands below were used when installing via the official repository.

## 3.1. GPG key and repository

```bash
# Update and install dependencies
sudo apt update
sudo apt install ca-certificates curl

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
```

## 3.2. Add your user to the docker group

To avoid using `sudo` every time you run Docker:

```bash
# Logged user
sudo usermod -aG docker $USER

# Choose an user, my user is wbitencourt
sudo usermod -aG docker wbitencourt
```

**Important:** after `usermod`, you must **log out and log back in** to your SSH session for the permission to take effect.

---

# 4. Fine-tuning (service and permissions)

Ensure the service is enabled and set to start on boot:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

If you have not done so yet, add your user to the docker group (replace `wbitencourt` with your username):

---

# 5. Verification

Confirm everything is working:

```bash
docker version
```
