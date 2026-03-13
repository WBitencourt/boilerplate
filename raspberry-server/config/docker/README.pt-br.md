# Instalação do Docker no Raspberry (Debian)

Este guia descreve duas formas de instalar o Docker: uma **rápida** (indicada para desenvolvimento) e outra **oficial via repositório** (recomendada para produção).

## 🛠 Hardware utilizado (Raspberry Pi) como servidor

- **Dispositivo:** Raspberry Pi 3 Model B+ (1GB RAM)
- **Armazenamento:** Micro SD 64GB
- **Acesso Inicial:** Cabo HDMI + Monitor (apenas para o primeiro boot)

---

# 1. Método rápido (desenvolvimento)

Crie uma pasta para os downloads e baixe o script de instalação:

```bash
mkdir downloads
curl -fsSL https://get.docker.com -o get-docker.sh
```

Instale o Docker:

```bash
sudo sh get-docker.sh
```

Este método é prático para desenvolvimento; para **produção**, use o método da seção 2.

---

# 2. Método recomendado para produção

Siga a documentação oficial do Docker para Debian:

**https://docs.docker.com/engine/install/debian**

---

# 3. Comandos utilizados na instalação (repositório oficial)

Os comandos abaixo foram usados no momento da instalação via repositório.

## 3.1. Chave GPG e repositório

```bash
# Atualizar e instalar dependências
sudo apt update
sudo apt install ca-certificates curl

# Adicionar chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Adicionar o repositório às fontes Apt
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
```

## 3.2. Adicionar seu usuário ao grupo docker

Para não precisar usar `sudo` sempre que rodar o Docker:

```bash
# Usuário logado
sudo usermod -aG docker $USER

# Usuário específico
sudo usermod -aG docker wbitencourt
```

**Importante:** após o `usermod`, é necessário **sair e entrar de novo na sessão SSH** para que a permissão seja aplicada.

---

# 4. Ajuste fino (serviço e permissões)

Garanta que o serviço está ativo e configurado para iniciar no boot:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

---

# 5. Verificação

Confirme se está tudo ok:

```bash
docker version
```
