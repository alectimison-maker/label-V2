@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0"
set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "REQUESTED_PORT=8765"
if not "%~1"=="" set "REQUESTED_PORT=%~1"

set "PORT=%REQUESTED_PORT%"

:find_free_port
powershell -Command "try { $l = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, %PORT%); $l.Start(); $l.Stop(); exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% == 0 goto port_found
set /a PORT+=1
goto find_free_port

:port_found
echo Serving %ROOT_DIR%
if not "%PORT%"=="%REQUESTED_PORT%" (
    echo Port %REQUESTED_PORT% is busy, switched to %PORT%
)
echo Open http://127.0.0.1:%PORT%

cd /d "%ROOT_DIR%"

python3 -m http.server %PORT% --bind 127.0.0.1 >nul 2>&1
if %errorlevel% == 0 exit /b 0

python -m http.server %PORT% --bind 127.0.0.1
