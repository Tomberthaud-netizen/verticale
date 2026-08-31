@echo off
chcp 65001 >nul
cd /d "%~dp0.."
node "node_modules\tsx\dist\cli.mjs" "scripts\genererCalendrierExcel.ts" >> "scripts\genererCalendrierExcel.log" 2>&1
