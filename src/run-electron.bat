@echo off
echo Installing ElectronNET.CLI...
dotnet tool install ElectronNET.CLI -g
echo Starting Electron...
cd BusinessSuite
dotnet electronize start
pause
