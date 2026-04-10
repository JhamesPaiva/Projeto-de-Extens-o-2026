@echo off
setlocal enabledelayedexpansion
REM Script para encontrar MySQL nas localizacoes comuns

echo.
echo ============================================
echo   Procurando MySQL...
echo ============================================
echo.

set "mysql_found=0"
set "MYSQL_PATH="

REM Procurar em Program Files (64-bit)
for /d %%D in ("C:\Program Files\MySQL\*") do (
    if exist "%%D\bin\mysql.exe" (
        set "MYSQL_PATH=%%D\bin"
        set "mysql_found=1"
        goto found
    )
)

REM Procurar em Program Files (x86)
for /d %%D in ("C:\Program Files (x86)\MySQL\*") do (
    if exist "%%D\bin\mysql.exe" (
        set "MYSQL_PATH=%%D\bin"
        set "mysql_found=1"
        goto found
    )
)

:found
if !mysql_found! equ 1 (
    echo.
    echo Encontrado em: !MYSQL_PATH!
    echo.
    echo Testando...
    "!MYSQL_PATH!\mysql.exe" --version
    if !errorlevel! equ 0 (
        echo.
        echo Adicionando ao PATH...
        set "PATH=!MYSQL_PATH!;!PATH!"
        echo.
        echo MySQL OK! Pode rodar agora:
        echo   .\setup.bat
        echo.
        pause
        exit /b 0
    )
)

echo.
echo MySQL nao encontrado em locais esperados.
echo.
echo Por favor, abra o explorador e procure manualmente em:
echo   C:\Program Files\MySQL\
echo   C:\Program Files (x86)\MySQL\
echo.
echo Anote o caminho (ex: C:\Program Files\MySQL\MySQL Server 8.0\bin)
echo.
echo Depois, adicione ao PATH do Windows seguindo estes passos:
echo  1. Pressione: Win + R
echo  2. Digite: sysdm.cpl
echo  3. Clique em "Variaveis de Ambiente..."
echo  4. Procure "Path" em Variaveis do Sistema
echo  5. Clique "Editar..." e adicione o caminho encontrado
echo  6. Reinicie o terminal
echo.
pause
exit /b 1
