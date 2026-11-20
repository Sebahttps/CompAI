@echo off
REM w-note de compAI - desinstalar (tus notas y actas en Documentos\w-note se conservan)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar.ps1" -Desinstalar
pause
