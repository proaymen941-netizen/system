@echo off
echo Starting OmniSystem Pro (MAUI)...
dotnet build BusinessSuite.Maui\BusinessSuite.Maui.csproj -t:Run -f net8.0-windows10.0.19041.0
pause
