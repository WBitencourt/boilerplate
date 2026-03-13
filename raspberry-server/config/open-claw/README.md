# 🦞 Configurando o Open-Claw

Este método requer um servidor com Docker instalado. Se ainda não configurou o Docker no seu Raspberry Pi, siga nosso guia em [Docker Setup Guide](../docker/README.md).

## 📂 1. Preparação do Diretório

Primeiro, criamos uma pasta dedicada para manter os arquivos de configuração e persistência organizados:

```bash
mkdir ~/open-claw && cd ~/open-claw
```

## 🐳 2. Criando o Dockerfile (Hardened Multi-stage)

Utilizamos um build de múltiplos estágios para garantir uma imagem leve e segura, rodando com um usuário não-root (UID 1001).

Crie o arquivo e cole o conteúdo abaixo:

```bash
nano Dockerfile
```

```dockerfile
# Estágio Base: Node 24 (Recomendado)
FROM node:24-bookworm-slim AS base

# Estágio de Instalação
FROM base AS installer
RUN apt-get update && apt-get install -y curl bash procps git
WORKDIR /install

# Instalamos o pacote globalmente em uma pasta específica para podermos copiar depois
RUN npm install -g openclaw@latest --prefix /root/.openclaw

# ---------

# Estágio de Execução (Runner)
FROM base AS runner
WORKDIR /app

# Criando grupo e usuário conforme o padrão de segurança (1001)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 app

# Variáveis de ambiente para persistência
ENV OPENCLAW_HOME=/app/data
ENV OPENCLAW_STATE_DIR=/app/data/state
ENV OPENCLAW_CONFIG_PATH=/app/data/config.toml
ENV PATH="/app/bin:${PATH}"

# Copiamos os arquivos instalados no estágio anterior
COPY --from=installer --chown=app:nodejs /root/.openclaw/bin /app/bin
COPY --from=installer --chown=app:nodejs /root/.openclaw/lib /app/lib

# Criar pastas de dados e garantir permissões internas
RUN mkdir -p /app/data /app/bin && chown -R app:nodejs /app

# Mudar para o usuário seguro
USER app

# Porta do Dashboard/Control UI
EXPOSE 18789

# Comando para rodar o gateway em modo foreground
ENTRYPOINT ["openclaw", "gateway", "run", "--allow-unconfigured"]
```

## ⚙️ 3. Configurando o Docker Compose

O Compose gerencia o container e limita os recursos para não sobrecarregar o hardware do Raspberry Pi.

Crie o arquivo e cole o conteúdo abaixo:

```bash
nano docker-compose.yml
```

```yaml
services:
  open-claw:
    build: .
    container_name: open-claw
    restart: unless-stopped
    ports:
      - "18789:18789"
    volumes:
      - ./openclaw_data:/app/data  # Persistência de dados e config
    # Limite de memória para RPi 3 B+
    deploy:
      resources:
        limits:
          memory: 600M
```

## 🛡️ 4. Permissões de Host e Firewall

Para que o container consiga escrever na pasta do Raspberry Pi e para permitir o acesso remoto via Meshnet:

```bash
# 1. Garante que o host respeite o UID 1001 do container
sudo chown -R 1001:1001 ~/open-claw/openclaw_data

# 2. Ajusta o firewall para acesso via Meshnet (NordVPN)
sudo ufw allow in on nordlynx to any port 18789

# 3. (Opcional) Permite acesso pela rede local privada
sudo ufw allow from 192.168.10.0/24 to any port 18789
```

**Quando essas regras são necessárias:** As regras das opções 2 e 3 (Meshnet e rede local) são importantes quando a interface NordLynx **não** está configurada para aceitar conexões de qualquer origem ("from anywhere"). Se a NordLynx já estiver liberada para anywhere, esses passos podem ser dispensados. Confira o estado atual com:

```bash
sudo ufw status
```

## 🚀 5. Build e Inicialização

Certifique-se de estar logado no Docker Hub se necessário e suba o serviço:

```bash
# Login no registro (se necessário)
docker login

# Build e start do container
docker compose up --build -d

# Acompanhar o consumo de recursos
docker stats
```

## 🔑 6. Onboarding (Configuração Inicial)

Com o container rodando, execute o assistente para configurar suas chaves de API e senha do Dashboard:

```bash
docker exec -it open-claw openclaw onboard
```

Após configurar, você poderá acessar o dashboard pelo navegador (por exemplo, no Galaxy Book: `http://IP_RASPBERRY:18789` ou via uma das opções de acesso descritas mais abaixo).

Exemplo de saída do assistente (valores sensíveis substituídos por placeholders neste guia):

```
🦞 OpenClaw 2026.3.11 (29dc654)
   Pairing codes exist because even bots believe in consent—and good security hygiene.

▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
██░▄▄▄░██░▄▄░██░▄▄▄██░▀██░██░▄▄▀██░████░▄▄▀██░███░██
██░███░██░▀▀░██░▄▄▄██░█░█░██░█████░████░▀▀░██░█░█░██
██░▀▀▀░██░█████░▀▀▀██░██▄░██░▀▀▄██░▀▀░█░██░██▄▀▄▀▄██
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
                  🦞 OPENCLAW 🦞                    
 
┌  OpenClaw onboarding
│
◇  Security ─────────────────────────────────────────────────────────────────────────────────╮
│                                                                                            │
│  Security warning — please read.                                                           │
│                                                                                            │
│  OpenClaw is a hobby project and still in beta. Expect sharp edges.                        │
│  By default, OpenClaw is a personal agent: one trusted operator boundary.                  │
│  This bot can read files and run actions if tools are enabled.                             │
│  A bad prompt can trick it into doing unsafe things.                                       │
│                                                                                            │
│  OpenClaw is not a hostile multi-tenant boundary by default.                               │
│  If multiple users can message one tool-enabled agent, they share that delegated tool      │
│  authority.                                                                                │
│                                                                                            │
│  If you’re not comfortable with security hardening and access control, don’t run           │
│  OpenClaw.                                                                                 │
│  Ask someone experienced to help before enabling tools or exposing it to the internet.     │
│                                                                                            │
│  Recommended baseline:                                                                     │
│  - Pairing/allowlists + mention gating.                                                    │
│  - Multi-user/shared inbox: split trust boundaries (separate gateway/credentials, ideally  │
│    separate OS users/hosts).                                                               │
│  - Sandbox + least-privilege tools.                                                        │
│  - Shared inboxes: isolate DM sessions (`session.dmScope: per-channel-peer`) and keep      │
│    tool access minimal.                                                                    │
│  - Keep secrets out of the agent’s reachable filesystem.                                   │
│  - Use the strongest available model for any bot with tools or untrusted inboxes.          │
│                                                                                            │
│  Run regularly:                                                                            │
│  openclaw security audit --deep                                                            │
│  openclaw security audit --fix                                                             │
│                                                                                            │
│  Must read: https://docs.openclaw.ai/gateway/security                                      │
│                                                                                            │
├────────────────────────────────────────────────────────────────────────────────────────────╯
│
◇  I understand this is personal-by-default and shared/multi-user use requires lock-down. Continue?
│  Yes
│
◇  Onboarding mode
│  Manual
│
◇  Existing config detected ──╮
│                             │
│  No key settings detected.  │
│                             │
├─────────────────────────────╯
│
◇  Config handling
│  Update values
│
◇  What do you want to set up?
│  Local gateway (this machine)
│
◇  Workspace directory
│  /app/data/.openclaw/workspace
│
◇  Model/auth provider
│  OpenRouter
│
◇  How do you want to provide this API key?
│  Paste API key now
│
◇  Enter OpenRouter API key
│  sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  (substitua pela sua chave em https://openrouter.ai)
│
◇  Model configured ─────────────────────╮
│                                        │
│  Default model set to openrouter/auto  │
│                                        │
├────────────────────────────────────────╯
│
◇  Default model
│  openrouter/google/gemma-3-27b-it:free
│
◇  Gateway port
│  18789
│
◇  Gateway bind
│  LAN (0.0.0.0)
│
◇  Gateway auth
│  Password
│
◇  Tailscale exposure
│  Off
│
◇  How do you want to provide the gateway password?
│  Enter password now
│
◇  Gateway password
│  Ex3mpl0S3nh4F4k3  (defina uma senha forte; este é apenas um exemplo)
│
◇  Channel status ────────────────────────────╮
│                                             │
│  Telegram: needs token                      │
│  WhatsApp (default): not linked             │
│  Discord: needs token                       │
│  Slack: needs tokens                        │
│  Signal: needs setup                        │
│  signal-cli: missing (signal-cli)           │
│  iMessage: needs setup                      │
│  imsg: missing (imsg)                       │
│  IRC: not configured                        │
│  Google Chat: not configured                │
│  LINE: not configured                       │
│  Feishu: install plugin to enable           │
│  Google Chat: install plugin to enable      │
│  Nostr: install plugin to enable            │
│  Microsoft Teams: install plugin to enable  │
│  Mattermost: install plugin to enable       │
│  Nextcloud Talk: install plugin to enable   │
│  Matrix: install plugin to enable           │
│  BlueBubbles: install plugin to enable      │
│  LINE: install plugin to enable             │
│  Zalo: install plugin to enable             │
│  Zalo Personal: install plugin to enable    │
│  Synology Chat: install plugin to enable    │
│  Tlon: install plugin to enable             │
│                                             │
├─────────────────────────────────────────────╯
│
◇  Configure chat channels now?
│  No
Config overwrite: /app/data/config.toml (sha256 541968bc5b8951b7f2d7a641b1c60b54faca9f76a6005d91bea84c71105f4db2 -> 002d57a51dcbb6fd99078fdad813e955b6e70f2ae411a7959ee180880a46ddd9, backup=/app/data/config.toml.bak)
Updated $OPENCLAW_HOME/config.toml
Workspace OK: $OPENCLAW_HOME/.openclaw/workspace
Sessions OK: $OPENCLAW_HOME/state/agents/main/sessions
│
◇  Web search ────────────────────────────────────────╮
│                                                     │
│  Web search lets your agent look things up online.  │
│  Choose a provider and paste your API key.          │
│  Docs: https://docs.openclaw.ai/tools/web           │
│                                                     │
├─────────────────────────────────────────────────────╯
│
◆  Search provider
│  ○ Brave Search (Structured results · country/language/time filters)
│  ○ Gemini (Google Search)
│  ○ Grok (xAI)
│  ○ Kimi (Moonshot)
│  ○ Perplexity Search
│  ● Skip for now
└
```

**Dica — modelos gratuitos vs. crédito pago:** Os modelos marcados como *free* no OpenRouter podem falhar ou não responder com frequência. Após liberar um limite de uso pago na sua conta OpenRouter (ex.: um valor mínimo em dólares), as chamadas aos modelos tendem a funcionar de forma estável. Para uso confiável, considere configurar um crédito mínimo na [OpenRouter](https://openrouter.ai).

### Endereços confiáveis (CORS)

Adicione os endereços de onde você vai acessar o dashboard para evitar erro de CORS. Ajuste a lista abaixo conforme seu uso:

- **IP local do Raspberry:** exige que o servidor tenha HTTPS configurado.
- **Nome do servidor (hostname):** exige que o servidor tenha HTTPS configurado.
- **Nome do servidor na meshnet:** exige que o servidor tenha HTTPS configurado.

Exemplo (substitua os IPs e hostnames pelos seus — ex.: IP da LAN, IP da meshnet, nomes locais):

```bash
docker exec -it open-claw openclaw config set gateway.controlUi.allowedOrigins '["http://localhost:18789","https://IP_DA_SUA_LAN:18789","https://IP_MESHNET:18789","https://raspberry-server.local:18789","https://raspberry-server.nordvpn:18789"]'
docker compose restart open-claw
```

## Opções de acesso ao dashboard

Existem várias formas de acessar o OpenClaw a partir do seu computador. Este guia foi escrito usando a **Opção 1**; outras opções serão documentadas conforme testadas.

---

### Opção 1: Túnel SSH (simula localhost)

Esta é a forma mais rápida de testar sem configurar HTTPS: o seu computador (ex.: Galaxy Book) "enxerga" o OpenClaw como se estivesse rodando nele.

No seu Galaxy Book, abra o terminal

Rode este comando (substitua `SEU_USUARIO` e `IP_DO_RASPBERRY` pelos seus dados):

```bash
ssh -L 18789:localhost:18789 SEU_USUARIO@IP_DO_RASPBERRY
```

**Importante:** Mantenha essa janela do terminal aberta. Enquanto o túnel SSH estiver ativo, você consegue acessar o dashboard em `http://localhost:18789`. Se fechar o túnel, o acesso deixa de funcionar até você abrir o túnel novamente.

Agora, no navegador do Galaxy Book, acesse: [http://localhost:18789](http://localhost:18789).

Resultado: O navegador verá "localhost" na URL, ativará o modo seguro automaticamente e o erro sumirá. O tráfego será tunelado via SSH para o Raspberry.

O que exatamente esse comando faz?
O comando `ssh -L 18789:localhost:18789 SEU_USUARIO@IP_DO_RASPBERRY` cria um Túnel SSH com Redirecionamento de Porta Local (Local Port Forwarding).

ssh: Abre o protocolo de comunicação segura.

-L: Diz que você quer fazer um redirecionamento Local.

18789 (o primeiro): É a porta que será aberta no seu Galaxy Book.

localhost:18789 (o meio): Diz que o tráfego que chegar na porta do Galaxy deve ser enviado para o localhost do destino (o Raspberry), na porta 18789.

`SEU_USUARIO@IP_DO_RASPBERRY`: substitua pelo seu usuário SSH e pelo IP do Raspberry (ex.: `usuario@192.168.10.23`).

Em resumo: O seu Galaxy Book reserva a porta 18789 dele. Tudo o que você digita no navegador do Galaxy apontando para localhost:18789 é empacotado, criptografado, enviado pelo cabo de rede até o Raspberry e entregue diretamente ao OpenClaw. Para o navegador, os dados nunca saíram do seu computador, por isso ele ativa o "Secure Context".

---

### Opção 2: HTTPS com reverse proxy (Nginx)

Se você quer acessar "direto" pelo endereço, sem túnel, use um reverse proxy com certificado SSL/TSL. Esta seção será preenchida em breve.

---

### Opção 3: (Em breve)

Outras formas de acesso estão sendo testadas. Esta seção será preenchida em breve.

---

## Login, aprovação de dispositivo e uso do chat

**Na Opção 1**, acesse `http://localhost:18789/overview`. Na tela de visão geral, faça login: como foi escolhida autenticação por senha no onboarding, use o campo **Password** e cole a senha do gateway. (Ver [image.png](./image.png).)

É necessário aprovar o dispositivo no Raspberry. No terminal do Raspberry:

1. Liste os dispositivos pendentes:
  ```bash
   docker exec -it open-claw openclaw devices list
  ```
2. Aprove usando o ID que aparecer na lista (o ID correto é exibido por `openclaw devices list`; o exemplo abaixo é apenas placeholder):
  ```bash
   docker exec -it open-claw openclaw devices approve xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  ```

Depois de aprovar, na interface web clique em **Conectar** e veja que no canto superior o icone ira ficar verde

---

## Adicionar e remover modelos

O comando `models set` adiciona modelos ao conjunto disponível. Exemplos:

```bash
docker exec -it open-claw openclaw models set 'openrouter/google/gemini-2.5-flash-lite'
docker exec -it open-claw openclaw models set 'openrouter/deepseek/deepseek-v3.2'
docker exec -it open-claw openclaw models set 'openrouter/openai/gpt-oss-120b:free'
docker exec -it open-claw openclaw models set 'openrouter/meta-llama/llama-3.3-70b-instruct:free'
```

Para remover modelos, edite o arquivo de configuração e apague as entradas desejadas em `agents.defaults.models`:

```bash
sudo nano ~/open-claw/openclaw_data/config.toml
```

Por fim, teste o chat, enviando um "Olá" e veja se há resposta.

Se aparecer erro 404 ou falha ao interagir: verifique no painel lateral em Agentes se o modelo que você definiu nas configurações está selecionado para o agente em uso. (Ver image2.png como exemplo.)

