# EventoCom Setup Script
# Este script configura e inicia o projeto EventoCom

param(
    [switch]$SkipDB = $false,
    [switch]$Backend = $false,
    [switch]$Frontend = $false
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         EventoCom Setup - Sistema de Gerenciamento de Eventos     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Função para exibir status
function Show-Status($step, $message, $success = $true) {
    $icon = if ($success) { "✅" } else { "❌" }
    Write-Host "$icon [$step] $message" -ForegroundColor $(if ($success) { "Green" } else { "Red" })
}

function Show-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

function Show-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

# ============================================================================
# PASSO 1: Verificar Prerequisites
# ============================================================================
Write-Host "`n📋 Verificando Prerequisites..." -ForegroundColor Yellow

# Verificar Python
Show-Info "Verificando Python..."
try {
    $pythonVersion = python --version 2>&1
    Show-Status "Python" $pythonVersion
} catch {
    Show-Status "Python" "Python não encontrado!" $false
    Write-Host "`n⚠️  Instale Python em: https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

# Verificar pip
Show-Info "Verificando pip..."
try {
    $pipVersion = pip --version 2>&1
    Show-Status "pip" "OK"
} catch {
    Show-Status "pip" "pip não encontrado!" $false
    exit 1
}

# Verificar MySQL
Show-Info "Verificando MySQL..."
try {
    $mysqlVersion = mysql --version 2>&1
    Show-Status "MySQL" $mysqlVersion
} catch {
    Show-Status "MySQL" "MySQL não encontrado!" $false
    Write-Host "`n⚠️  Instale MySQL em: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Red
    Write-Host "   Ou use: choco install mysql (se tiver Chocolatey)" -ForegroundColor Gray
    exit 1
}

# ============================================================================
# PASSO 2: Configurar Banco de Dados
# ============================================================================
if (-not $SkipDB) {
    Write-Host "`n💾 Configurando Banco de Dados..." -ForegroundColor Yellow
    
    Show-Info "Criando banco de dados 'eventocom'..."
    try {
        mysql -u root -e "DROP DATABASE IF EXISTS eventocom;" 2>$null
        mysql -u root -e "CREATE DATABASE IF NOT EXISTS eventocom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1
        Show-Status "Banco criado" "eventocom"
        
        Show-Info "Importando schema..."
        $schemaFile = Join-Path $ProjectRoot "database\squema.sql"
        mysql -u root eventocom < $schemaFile 2>&1
        Show-Status "Schema" "Tabelas criadas com sucesso"
    } catch {
        Show-Status "Banco" "Erro ao configurar banco!" $false
        Write-Host "   Erro: $_" -ForegroundColor Red
        Write-Host "`n💡 Dicas:" -ForegroundColor Cyan
        Write-Host "   - Verifique se MySQL está rodando" -ForegroundColor Gray
        Write-Host "   - Tente criar manualmente: mysql -u root eventocom (and pipe database\squema.sql)" -ForegroundColor Gray
        Write-Host "   - Use --SkipDB flag se já têm o banco configurado" -ForegroundColor Gray
        exit 1
    }
}

# ============================================================================
# PASSO 3: Instalar Dependências Python
# ============================================================================
Write-Host "`n📦 Instalando Dependências Python..." -ForegroundColor Yellow

$backendPath = Join-Path $ProjectRoot "backend"
$requirementsFile = Join-Path $backendPath "requirements.txt"

Show-Info "Lendo requirements.txt..."
if (Test-Path $requirementsFile) {
    Show-Status "requirements.txt" (Get-Content $requirementsFile | Measure-Object -Line).Lines + " pacotes"
    
    Show-Info "Instalando pacotes (isso pode levar alguns minutos)..."
    try {
        Set-Location $backendPath
        pip install -q -r requirements.txt --disable-pip-version-check
        Show-Status "Dependências" "Instaladas com sucesso"
    } catch {
        Show-Status "Dependências" "Erro ao instalar!" $false
        Write-Host "   Erro: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Show-Status "requirements.txt" "Arquivo não encontrado!" $false
    exit 1
}

# ============================================================================
# PASSO 4: Verificar Configurações
# ============================================================================
Write-Host "`n⚙️  Verificando Configurações..." -ForegroundColor Yellow

$envFile = Join-Path $backendPath ".env"
if (Test-Path $envFile) {
    Show-Status ".env" "Encontrado"
    Show-Warning "Verifique se as configurações estão corretas:"
    $envContent = Get-Content $envFile
    $envContent | ForEach-Object { Write-Host "     $_" -ForegroundColor Gray }
} else {
    Show-Status ".env" "Arquivo não encontrado!" $false
}

# ============================================================================
# PASSO 5: Iniciar Servidores
# ============================================================================
Write-Host "`n🚀 Iniciando Servidores..." -ForegroundColor Yellow
Write-Host ""

# Decidir o que iniciar
$shouldStartBackend = $Backend -or (Read-Host "Iniciar Backend? (s/n)") -like "s*"
$shouldStartFrontend = $Frontend -or (Read-Host "Iniciar Frontend? (s/n)") -like "s*"

if ($shouldStartBackend) {
    Show-Info "Iniciando Backend (Flask)..."
    Write-Host "`n" -ForegroundColor Gray
    
    Set-Location $backendPath
    
    # Clear de histórico de comando anterior
    cmd /c "cls"
    
    python app.py
} elseif ($shouldStartFrontend) {
    Show-Info "Iniciando Frontend (HTTP Server)..."
    
    $frontendPath = Join-Path $ProjectRoot "frontend"
    Set-Location $frontendPath
    
    Write-Host "`n🌐 Frontend disponível em:" -ForegroundColor Green
    Write-Host "   http://localhost:3000" -ForegroundColor Cyan
    Write-Host "`n⌨️  Pressione CTRL+C para parar o servidor`n" -ForegroundColor Yellow
    
    python -m http.server 3000
}

Write-Host "`n✅ Setup concluído!" -ForegroundColor Green
Write-Host "`n📖 Documentação:" -ForegroundColor Cyan
Write-Host "   - Backend (Flask): http://localhost:5000/api/ping" -ForegroundColor Gray
Write-Host "   - Frontend (Web):  http://localhost:3000" -ForegroundColor Gray
Write-Host ""
