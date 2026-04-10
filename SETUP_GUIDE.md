# 🚀 Guia de Setup - EventoCom

## ⚡ Quick Start (Recomendado)

### Opção 1: Clique duplo em setup.bat (MAIS FÁCIL) 🎯
```
1. Vá até: Projeto-de-Extensão-2026/
2. Clique duplo em: setup.bat
3. Escolha uma opção (1 ou 2)
4. Pronto!
```

### Opção 2: PowerShell (Avançado)
```powershell
# Abra PowerShell como Admin
cd "Seu\Caminho\Projeto-de-Extens-o-2026"

# Execute:
.\setup.ps1

# Ou se der erro de permissão:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
```

---

## 📋 O que o Script Faz

✅ Verifica se Python e MySQL estão instalados  
✅ Cria o banco de dados `eventocom`  
✅ Importa as tabelas (users, events, event_tickets)  
✅ Instala todas as dependências Python  
✅ Inicia Backend ou Frontend conforme você escolher  

---

## 🛠️ Pré-requisitos

### Python
- **Versão:** 3.8+
- **Download:** https://www.python.org/downloads
- **Verificar:** Abra prompt e digite `python --version`

### MySQL
- **Versão:** 5.7+
- **Download:** https://dev.mysql.com/downloads/mysql/
- **Verificar:** Abra prompt e digite `mysql --version`
- **Usuário padrão:** `root` (sem senha)
- **Serviço:** Deve estar rodando

---

## 🚀 Como Rodar (Passo a Passo)

### 1️⃣ **Executar Setup**
```bash
# Windows (recomendado)
setup.bat

# PowerShell
.\setup.ps1
```

### 2️⃣ **Escolher o Servidor**
```
Opção 1: Backend (Flask) - Recomendado começar aqui
Opção 2: Frontend (HTTP)
Opção 3: Ambos em 2 terminais
```

### 3️⃣ **Acessar a Aplicação**
```
Backend: http://localhost:5000/api/ping
Frontend: http://localhost:3000
```

---

## ✅ Teste Rápido

### Backend está funcionando?
```bash
# Abra o navegador e acesse:
http://localhost:5000/api/ping

# Você deve ver:
{"message":"Backend Python rodando","status":"ok"}
```

### Frontend está funcionando?
```bash
# Abra o navegador e acesse:
http://localhost:3000

# Você deve ver a página inicial do EventoCom
```

---

## ❌ Resolução de Problemas

### "Python não encontrado"
```bash
# Verifique:
python --version

# Se não funcionar:
# 1. Reinstale Python (check "Add to PATH")
# 2. Abra novo terminal/CMD
# 3. Tente novamente
```

### "MySQL não encontrado"
```bash
# Verifique:
mysql --version

# Se não funcionar:
# 1. Instale MySQL Community Server
# 2. Escolha "Standalone MySQL Server"
# 3. Use credenciais padrão (root/sem senha)
# 4. Inicie o serviço MySQL
```

### Erro ao criar banco de dados
```
Problema: "Access denied for user 'root'@'localhost'"

Solução:
1. Abra MySQL Command Line Client
2. Digite sua senha (se tiver)
3. Verifique no setup.bat/ps1 se está usando a senha certa
4. Edite o arquivo config.py:
   DB_PASSWORD = 'sua-senha-aqui'
```

### Porta 5000 já está em uso
```bash
# Verifique qual processo está usando a porta:
netstat -ano | findstr :5000

# Matando o processo (se der ID do processo):
taskkill /PID <ID> /F

# Ou mude a porta em backend/app.py:
app.run(host='0.0.0.0', port=5001)  # <- Mude para outra porta
```

### Porta 3000 já está em uso
```bash
# Similar ao backend, ou use outra porta:
python -m http.server 8000  # <- Mude para porta 8000
```

---

## 📂 Estrutura Após Setup

```
Projeto-de-Extensão-2026/
├── backend/
│   ├── app.py              ✅ Backend Flask (porta 5000)
│   ├── models.py           ✅ Modelos de dados
│   ├── config.py           ✅ Configurações
│   ├── database.py         ✅ Conexão MySQL
│   ├── requirements.txt    ✅ Dependências
│   └── .env                ✅ Variáveis de ambiente
│
├── frontend/
│   ├── src/                ✅ Código JavaScript/HTML/CSS
│   ├── public/index.html   ⚠️ Vazio (frontend em HTML puro)
│   └── (rodando em porta 3000)
│
├── database/
│   ├── squema.sql          ✅ Script de criação de tabelas
│   └── speed.sql           (vazio)
│
├── setup.bat               🎯 Use este! (Windows)
├── setup.ps1               (PowerShell - alternativa)
└── README.md               (este arquivo)
```

---

## 🎯 Fluxo de Desenvolvimento

### Opção A: Terminal Único (Começa com Backend)
```powershell
# Terminal 1 - Backend
.\setup.bat  # Escolha opção 1

# Terminal 2 - Frontend (espere o backend iniciar)
cd frontend
python -m http.server 3000
```

### Opção B: 2 Terminais (Automático)
```bash
.\setup.bat  # Escolha opção 3
# Abre 2 janelas automaticamente
```

### Opção C: Development com Hot Reload
```powershell
# Se instalar nodemon em outro projeto Node.js:
cd backend
pip install watchdog

# E rodar com:
python -m watchdog.auto_reload app.py
```

---

## 📝 Variáveis de Ambiente (.env)

Edite `backend/.env` conforme necessário:

```env
# Chaves de segurança (mudar em produção!)
SECRET_KEY=change-me
JWT_SECRET_KEY=change-me-jwt

# Conexão MySQL
DB_HOST=127.0.0.1          # localhost
DB_PORT=3306               # porta padrão MySQL
DB_USER=root               # usuário MySQL
DB_PASSWORD=               # deixe vazio se não tem senha
DB_NAME=eventocom          # nome do banco
DB_POOL_SIZE=5             # conexões simultâneas
```

---

## 🧪 Testar Endpoints da API

### Com Postman, cURL ou navegador:

```bash
# Health Check
curl http://localhost:5000/api/ping

# Registrar usuário
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"João","email":"joao@test.com","senha":"123456","tipo":"pf"}'

# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@test.com","senha":"123456"}'

# Listar eventos
curl http://localhost:5000/api/events
```

---

## 📞 Suporte

Se tiver problemas:

1. **Verificar logs:** Leia a mensagem de erro no terminal
2. **Validar dependências:** `pip list | findstr Flask`
3. **Testar conectividade MySQL:** `mysql -u root -e "SELECT 1"`
4. **Reiniciar:** Feche e execute setup.bat novamente

---

## 🎉 Próximas Etapas

- ✅ Backend rodando
- ✅ Frontend acessível
- ⏭️ Implementar funcionalidades faltantes (ver PLANO_ACAO.md)
- ⏭️ Testar fluxos com Postman
- ⏭️ Conectar frontend ao backend

---

**Happy coding! 🚀**
