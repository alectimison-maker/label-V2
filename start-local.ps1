#Requires -Version 3.0

$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition
$REQUESTED_PORT = if ($args[0]) { [int]$args[0] } else { 8765 }

function Test-PortInUse {
    param([int]$Port)
    try {
        $listener = New-Object System.Net.Sockets.TcpListener ([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $false
    } catch {
        return $true
    }
}

function Find-FreePort {
    param([int]$Port)
    while (Test-PortInUse -Port $Port) {
        $Port++
    }
    return $Port
}

$PORT = Find-FreePort -Port $REQUESTED_PORT

Write-Host "Serving $ROOT_DIR"
if ($PORT -ne $REQUESTED_PORT) {
    Write-Host "Port $REQUESTED_PORT is busy, switched to $PORT"
}
Write-Host "Open http://127.0.0.1:$PORT"

Set-Location $ROOT_DIR

$pythonCmd = if (Get-Command python3 -ErrorAction SilentlyContinue) { "python3" } else { "python" }
& $pythonCmd -m http.server $PORT --bind 127.0.0.1
