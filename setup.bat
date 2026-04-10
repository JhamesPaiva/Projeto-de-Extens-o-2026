@echo off
REM EventoCom - Quick Setup Script for Windows
REM Este script configura rapidamente o ambiente para rodar o projeto

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║      EventoCom Setup - Sistema de Gerenciamento de Eventos    ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Verificar se está na pasta correta
if not exist "database\squema.sql" (
    echo ❌ Erro: Execute este script da raiz do projeto!
    echo    Local esperado: Projeto-de-Extensão-2026\setup.bat
    pause
    exit /b 1
)

REM Verificar Python
echo Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado!
    echo    Instale em: https://www.python.org/downloads
    pause
    exit /b 1
)
echo ✅ Python OK

REM Verificar MySQL
echo Verificando MySQL...
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ MySQL não encontrado!
    echo    Instale em: https://dev.mysql.com/downloads/mysql/
    pause
    exit /b 1
)
echo ✅ MySQL OK

echo.
echo 📋 Configurando Banco de Dados...
echo    Criando database 'eventocom'...

REM Definir caminho do MySQL
set "MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 9.6\bin"

REM Limpar banco anterior (opcional)
"%MYSQL_PATH%\mysql.exe" -u root -p12345678 -e "DROP DATABASE IF EXISTS eventocom;" 2>nul

REM Criar banco
"%MYSQL_PATH%\mysql.exe" -u root -p12345678 -e "CREATE DATABASE IF NOT EXISTS eventocom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if errorlevel 1 (
    echo ❌ Erro ao criar banco!
    echo    Verifique se MySQL está rodando com credenciais root/sem-senha
    pause
    exit /b 1
)
echo ✅ Banco criado

REM Importar schema
echo    Importando schema...
"%MYSQL_PATH%\mysql.exe" -u root -p12345678 eventocom < database\squema.sql
if errorlevel 1 (
    echo ❌ Erro ao importar schema!
    pause
    exit /b 1
)
echo ✅ Schema importado

echo.
echo 📦 Instalando Dependências Python...
cd backend
pip install -q -r requirements.txt --disable-pip-version-check
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências!
    cd ..
    pause
    exit /b 1
)
echo ✅ Dependências instaladas
cd ..

echo.
echo ⚙️  Configurações:
echo    Backend URL: http://localhost:5000/api
echo    Banco:       localhost:3306 (root/sem-senha)
echo    Banco:       eventocom
echo.

echo 🚀 Escolha uma opção:
echo.
echo    1 = Iniciar Backend (Flask - recomendado primeiro)
echo    2 = Iniciar Frontend (HTTP Server)
echo    3 = Ambos em terminais separados (avançado)
echo    0 = Sair
echo.
set /p choice="Opção: "

if "%choice%"=="1" (
    echo.
    echo ⚡ Iniciando Backend em http://localhost:5000
    echo    Pressione CTRL+C para parar
    echo.
    cd backend
    python app.py
    cd ..
) else if "%choice%"=="2" (
    echo.
    echo ⚡ Iniciando Frontend em http://localhost:3000
    echo    Pressione CTRL+C para parar
    echo.
    cd frontend
    echo    Abra no navegador: http://localhost:3000
    echo.
    python -m http.server 3000
    cd ..
) else if "%choice%"=="3" (
    echo.
    echo ⚡ Abrindo 2 terminais...
    echo    Terminal 1: Backend
    echo    Terminal 2: Frontend
    echo.
    start "EventoCom Backend" cmd /k "cd backend && python app.py"
    timeout /t 2 /nobreak
    start "EventoCom Frontend" cmd /k "cd frontend && echo Abra no navegador: http://localhost:3000 && python -m http.server 3000"
    echo.
    echo ✅ Servidores iniciados!
    echo    Backend:  http://localhost:5000
    echo    Frontend: http://localhost:3000
    echo.
    pause
) else (
    echo ❌ Opção inválida
    pause
    exit /b 1
)

pause
