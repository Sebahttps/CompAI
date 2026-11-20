# w-notes de compAI — instalador para Windows 10/11
# Uso: doble clic en instalar.bat  (o: powershell -ExecutionPolicy Bypass -File instalar.ps1 [-Desinstalar] [-SinInicio])
# Qué hace:
#   1. Busca Python 3.10+ (si no está, lo instala con winget).
#   2. Copia w-note a %LOCALAPPDATA%\w-note\app y crea un entorno aislado (venv).
#   3. Instala PySide6, Pillow, PyAudioWPatch y qrcode.
#   4. Crea accesos directos: Escritorio, Menú Inicio e Inicio de Windows (arranca solo).
#   5. Abre w-note.
# Tus datos viven aparte, en Documentos\w-note (notas, actas, config): desinstalar no los toca.

param([switch]$Desinstalar, [switch]$SinInicio)
$ErrorActionPreference = "Stop"

$Raiz      = Join-Path $env:LOCALAPPDATA "w-note"
$AppDir    = Join-Path $Raiz "app"
$Venv      = Join-Path $Raiz "venv"
$Origen    = Split-Path -Parent $PSScriptRoot          # carpeta w-note/
$Escritorio = [Environment]::GetFolderPath("Desktop")
$MenuInicio = Join-Path ([Environment]::GetFolderPath("Programs")) "w-notes.lnk"
$Inicio     = Join-Path ([Environment]::GetFolderPath("Startup")) "w-notes.lnk"
$Atajos     = @((Join-Path $Escritorio "w-notes.lnk"), $MenuInicio, $Inicio)
# Accesos de la versión 1.0 (se llamaba w-note): se reemplazan
$AtajosViejos = @((Join-Path $Escritorio "w-note.lnk"),
  (Join-Path ([Environment]::GetFolderPath("Programs")) "w-note.lnk"),
  (Join-Path ([Environment]::GetFolderPath("Startup")) "w-note.lnk"))

function Paso($t) { Write-Host ""; Write-Host "▸ $t" -ForegroundColor Cyan }

# Cerrar una instancia abierta (para poder reemplazar archivos)
Get-CimInstance Win32_Process -Filter "Name='pythonw.exe' OR Name='python.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*w-note*wnote.py*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

if ($Desinstalar) {
  Paso "Quitando w-notes"
  ($Atajos + $AtajosViejos) | ForEach-Object { Remove-Item $_ -Force -ErrorAction SilentlyContinue }
  Remove-Item $Raiz -Recurse -Force -ErrorAction SilentlyContinue
  Write-Host "Listo. Tus notas y actas siguen en Documentos\w-note." -ForegroundColor Green
  exit 0
}

Write-Host "w-notes de compAI — instalación" -ForegroundColor White

# 1. Python ---------------------------------------------------------------------------
Paso "Buscando Python 3.10 o superior"
function Buscar-Python {
  $candidatos = @(@{ Exe = "py"; Args = @("-3") }, @{ Exe = "python"; Args = @() })
  foreach ($c in $candidatos) {
    try {
      $a = $c.Args
      $v = & $c.Exe @a -c "import sys; print('%d.%d' % sys.version_info[:2]); print(sys.executable)" 2>$null
      if ($LASTEXITCODE -eq 0 -and $v) {
        $ver = [version]$v[0]
        if ($ver -ge [version]"3.10" -and $v[1] -notlike "*WindowsApps*") { return $v[1] }
      }
    } catch {}
  }
  return $null
}
$Python = Buscar-Python
if (-not $Python) {
  Write-Host "No encontré Python. Lo instalo con winget (Python 3.12)…" -ForegroundColor Yellow
  winget install -e --id Python.Python.3.12 --scope user --accept-package-agreements --accept-source-agreements
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine")
  $Python = Buscar-Python
  if (-not $Python) {
    Write-Host "No pude instalar Python solo. Descárgalo de https://www.python.org/downloads/windows/ (marca 'Add python.exe to PATH') y vuelve a abrir instalar.bat." -ForegroundColor Red
    exit 1
  }
}
Write-Host "Python: $Python"

# 2. Copiar archivos --------------------------------------------------------------------
Paso "Copiando w-note a $AppDir"
New-Item -ItemType Directory -Force -Path $AppDir | Out-Null
foreach ($item in @("index.html", "manifest.webmanifest", "sw.js", "marca", "windows")) {
  $src = Join-Path $Origen $item
  if (Test-Path $src) { Copy-Item $src -Destination $AppDir -Recurse -Force }
}

# 3. Entorno y dependencias --------------------------------------------------------------
Paso "Preparando entorno e instalando dependencias (1-3 min la primera vez)"
if (-not (Test-Path (Join-Path $Venv "Scripts\python.exe"))) { & $Python -m venv $Venv }
$VPy  = Join-Path $Venv "Scripts\python.exe"
$VPyw = Join-Path $Venv "Scripts\pythonw.exe"
& $VPy -m pip install --upgrade pip --quiet --disable-pip-version-check
& $VPy -m pip install -r (Join-Path $AppDir "windows\requirements.txt") --quiet --disable-pip-version-check
if ($LASTEXITCODE -ne 0) { Write-Host "Falló la instalación de dependencias. Revisa tu conexión y vuelve a intentar." -ForegroundColor Red; exit 1 }

# 4. Accesos directos ----------------------------------------------------------------------
Paso "Creando accesos directos"
$AtajosViejos | ForEach-Object { Remove-Item $_ -Force -ErrorAction SilentlyContinue }
$Shell  = New-Object -ComObject WScript.Shell
$Script = Join-Path $AppDir "windows\wnote.py"
$Icono  = Join-Path $AppDir "marca\wnote.ico"
$destinos = @((Join-Path $Escritorio "w-notes.lnk"), $MenuInicio)
if (-not $SinInicio) { $destinos += $Inicio }
foreach ($lnk in $destinos) {
  $s = $Shell.CreateShortcut($lnk)
  $s.TargetPath = $VPyw
  $s.Arguments = "`"$Script`""
  $s.WorkingDirectory = Join-Path $AppDir "windows"
  $s.IconLocation = $Icono
  $s.Description = "w-notes de compAI"
  $s.Save()
}
if ($SinInicio) { Remove-Item $Inicio -Force -ErrorAction SilentlyContinue }

# 5. Abrir ---------------------------------------------------------------------------------
Paso "Abriendo w-notes"
Start-Process -FilePath $VPyw -ArgumentList "`"$Script`"" -WorkingDirectory (Join-Path $AppDir "windows")
Write-Host ""
Write-Host "✓ w-notes instalado." -ForegroundColor Green
Write-Host "  · Queda en la bandeja junto al reloj (clic derecho → Salir)."
Write-Host "  · Arranca solo con Windows. Atajos: Ctrl+Alt+N nota · Ctrl+Alt+R grabar · Ctrl+Alt+P print."
Write-Host "  · Si Windows pregunta por el Firewall, elige 'Redes privadas' (es para ver tus notas en el celular por Wi-Fi)."
