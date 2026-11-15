@echo off
rem Zapusk bota na Windows. Dvazhdy kliknite po etomu faylu.
cd /d "%~dp0"
chcp 65001 >nul
set PYTHONUTF8=1

if exist ".venv\Scripts\python.exe" goto install

set PY=
for %%V in (3.13 3.12 3.11 3.14 3.15) do (
  if not defined PY (
    py -%%V -c "import sys" >nul 2>&1 && set PY=py -%%V
  )
)
if not defined PY (
  python -c "import sys; sys.exit(0 if (3,11) <= sys.version_info[:2] <= (3,15) else 1)" >nul 2>&1 && set PY=python
)
if not defined PY (
  echo.
  echo Ne nayden Python 3.11-3.13. Ustanovite Python 3.13 s https://www.python.org/downloads/windows/
  echo Pri ustanovke postavte galochku "Add python.exe to PATH" i zapustite etot fayl snova.
  echo.
  pause
  exit /b 1
)
echo Pervyy zapusk: ustanavlivayu neobhodimoe, eto zaymet paru minut...
%PY% -m venv .venv
if errorlevel 1 ( echo Ne udalos podgotovit okruzhenie Python. & pause & exit /b 1 )

:install
".venv\Scripts\python.exe" -m pip install --quiet --disable-pip-version-check -r requirements.txt
if errorlevel 1 ( echo Ne udalos ustanovit komponenty. Proverte internet. & pause & exit /b 1 )

:loop
".venv\Scripts\python.exe" -m stockbot
if %errorlevel%==0 goto end
if %errorlevel%==2 ( pause & goto end )
echo.
echo Bot ostanovilsya. Perezapusk cherez 10 sekund. Chtoby vyyti - zakroyte eto okno.
timeout /t 10 >nul
goto loop

:end
