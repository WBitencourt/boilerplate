# 🚀 Raspberry Pi server setup guide

Este guia documenta a configuração de um servidor Raspberry Pi 3 B+ focado em segurança, acesso remoto via Meshnet e preparação para ambientes de desenvolvimento. A configuração foi feita a partir de um computador com Ubuntu Linux.

## 💻 Setup utilizado (computador de configuração)

- **Notebook:** Samsung Galaxy Book 2
- **Processador:** Intel Core i5 (11ª geração)
- **Memória:** 32 GB RAM DDR4 3200 MHz (Kingston FURY)
- **Armazenamento:** SSD 980 GB (Kingston) + SSD 256 GB (nativo)
- **Sistema operacional:** Ubuntu Linux

## 🛠 Hardware utilizado (Raspberry Pi) como servidor

- **Dispositivo:** Raspberry Pi 3 Model B+ (1GB RAM)
- **Armazenamento:** Micro SD 64GB
- **Acesso Inicial:** Cabo HDMI + Monitor (apenas para o primeiro boot)

## 💾 1. Preparação da imagem do SO

Utilize o Raspberry Pi Imager para gravar a imagem no SD, e siga o passo a passo.

```bash
https://www.raspberrypi.com/software
```

```bash
# Permissões (Linux)
chmod 700 ./name-of-appimage.AppImage
sudo ./name-of-appimage.AppImage
```

- **Configurações Avançadas (Engrenagem):**
  - Hostname: raspberry-server
  - Usuário: wbitencourt
  - Wi-fi: Configure SSID e Senha.
  - SSH: Selecione "Allow public-key authentication only".
  - Sugiro configurar e aceitar o Raspberry Connect, para fins de acesso facilitado em caso de ficar trancado para fora do seu servidor

## 🔑 Geração da chave SSH

Para acessar o servidor da sua maquina, use uma chave existente ou crie uma chave exclusiva para o servidor:

Caso prefira criar uma chave exclusiva:
```bash
ssh-keygen -t ed25519 -C "one comment here - raspberry-server"
# Salve como: ~/.ssh/id_ed25519_raspberry_server
```

Copie o conteúdo da chave pública (.pub) e cole no campo de SSH do Imager.

## 🛡 2. Primeiro acesso e segurança inicial

Após o boot remova o cartão SD com o imager devidamente configurado e o insira no seu raspberry.

Em paralelo, facilite o acesso ao servidor criando um atalho no seu arquivo `~/.ssh/config`:

```
Host raspberry-server
  HostName raspberry-server.local #Importante o .local ao final do nome do host
  User wbitencourt
  IdentityFile ~/.ssh/id_ed25519_raspberry_server
  IdentitiesOnly yes
```

### Atualização do sistema e firewall base (no servidor)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install ufw -y

# ATENÇÃO: Libere a porta 22 antes de ativar o UFW
sudo ufw allow 22/tcp
sudo ufw enable
```

## ✅ Status do firewall (`sudo ufw status`)

| To              | Action | From            |
| --------------- | ------ | --------------- |
| 22/tcp          | ALLOW  | Anywhere        |
| 22/tcp (v6)     | ALLOW  | Anywhere (v6)   |

## 🌐 3. NordVPN & Meshnet (acesso remoto mundial)

### Instalação

```bash
sh <(curl -sSf https://downloads.nordcdn.com/apps/linux/install.sh)
sudo usermod -aG nordvpn $USER

# usermod: É a ferramenta do sistema para modificar contas de usuário.
# -aG:
#     O -a vem de append (acrescentar). Ele garante que você seja adicionado ao novo grupo sem ser removido dos grupos em que já está.
#     O -G indica que o que vem a seguir é o nome de um grupo.
# nordvpn: É o nome do grupo de usuários criado pelo aplicativo NordVPN.
# $USER: É uma variável do sistema que se transforma automaticamente no seu nome de usuário atual.
```

### Autenticação via access token

Gere um token no Painel da NordAccount e rode no Raspberry:

```bash
# https://my.nordaccount.com/dashboard/nordvpn/access-tokens
nordvpn login --token SEU_TOKEN_AQUI
```

### Configurações de rede

Para evitar bloqueios de acesso local ao usar a VPN:

```bash
# Permite descoberta via .local e rede local automática
nordvpn set lan-discovery on

# Ou libere explicitamente
nordvpn whitelist add subnet 192.168.10.0/24
nordvpn whitelist add port 22
```

```bash
# Ativa tecnologia NordLynx e Meshnet
nordvpn set technology nordlynx
nordvpn set meshnet on
```

### IPs e atalho Meshnet

Pegue seu IP da Meshnet: `ip addr show nordlynx`. Adicione um segundo host no seu `~/.ssh/config`:

```
Host raspberry-server-nordvpn
  HostName 100.XX.XX.XX # Seu IP Meshnet
  User wbitencourt
  IdentityFile ~/.ssh/id_ed25519_raspberry_server
  IdentitiesOnly yes
```

Veja todos os devices da sua rede privada
```bash
nordvpn meshnet peer list
```

## 🔒 4. Hardening do firewall (UFW)

Agora que a Meshnet está ativa, vamos restringir o acesso apenas ao que é seguro.

```bash
# 1. Liberar acesso total via interface virtual da Meshnet
sudo ufw allow in on nordlynx

# 2. Permitir SSH apenas vindo da rede local (SBC/Casa)
sudo ufw allow from 192.168.10.0/24 to any port 22 proto tcp

# 3. Remover a regra genérica (Não aceitar SSH da internet pública)
sudo ufw delete allow 22/tcp
```

## ⚙️ 5. Ajustes de sistema

```bash
# Garantir que o firewall suba no boot
sudo systemctl enable ufw

# Configurar Timezone correta (Brasil/SBC)
sudo timedatectl set-timezone America/Sao_Paulo
```

## 📂 6. Dicas de uso: file sharing

A Meshnet permite enviar arquivos de forma criptografada entre seus dispositivos:

- **No dispositivo de envio (Galaxy Book 2):**

```bash
nordvpn fileshare send [IP-DO-RASPBERRY] ~/caminho/do/arquivo.pdf
```

- **No servidor (Raspberry Pi):** Liste os arquivos recebidos: `nordvpn fileshare list`  
  Aceite o arquivo:

```bash
nordvpn fileshare accept --path /home/wbitencourt/files [UUID-DO-ARQUIVO]
```

## ✅ Status final do firewall (`sudo ufw status`)

| To                        | Action | From            |
| ------------------------- | ------ | --------------- |
| Anywhere on nordlynx      | ALLOW  | Anywhere        |
| Anywhere (v6) on nordlynx | ALLOW  | Anywhere (v6)   |
| 22/tcp                    | ALLOW  | 192.168.10.0/24 |
