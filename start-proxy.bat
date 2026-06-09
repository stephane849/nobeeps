@echo off
echo Starting Beeper proxy...
echo.

where node >nul 2>nul
if %ERRORLEVEL%==0 (
    node proxy.js
    goto end
)

where python >nul 2>nul
if %ERRORLEVEL%==0 (
    python proxy.py
    goto end
)

where python3 >nul 2>nul
if %ERRORLEVEL%==0 (
    python3 proxy.py
    goto end
)

echo Neither Node.js nor Python found.
echo Download proxy.exe from:
echo https://github.com/stephane849/nobeeps/releases/latest
echo.

:end
pause
