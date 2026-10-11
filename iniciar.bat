@echo off
chcp 65001 >nul
title FamilyQuiz
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto semnode

if exist node_modules goto rodar
echo Instalando o jogo (so na primeira vez, precisa de internet)...
call npm install
if errorlevel 1 goto erroinstalar

:rodar
node server.js --abrir
pause
exit /b

:semnode
echo.
echo O Node.js nao esta instalado.
echo Baixe a versao LTS em https://nodejs.org , instale e abra este arquivo de novo.
echo.
pause
exit /b

:erroinstalar
echo.
echo Nao consegui instalar. Verifique a internet e tente de novo.
pause
