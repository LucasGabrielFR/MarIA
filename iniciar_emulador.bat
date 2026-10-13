@echo off
title MarIA - Iniciando Emulador Android
echo ==============================================
echo   Iniciando Emulador Android (Medium Phone)
echo ==============================================
set ANDROID_HOME=C:\Users\lucas\AppData\Local\Android\Sdk
set JAVA_HOME=D:\Android\jbr
"C:\Users\lucas\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd Medium_Phone_API_37.0
pause
