@echo off
title Speed To Lead - Push to GitHub
color 0b
cls
echo ==================================================
echo      SPEED TO LEAD - AUTONOMOUS GITHUB SYNC
echo ==================================================
echo.
echo Current branch: main
echo Status: All hardened updates successfully staged and committed locally!
echo.
echo Please paste your GitHub Repository URL (e.g., https://github.com/your-username/your-repo-name.git):
set /p REPO_URL="URL: "

if "%REPO_URL%"=="" (
    echo.
    echo Error: No URL entered. Operation cancelled.
    pause
    exit /b
)

echo.
echo Connecting to remote: %REPO_URL%...
"C:\Program Files\Git\cmd\git.exe" remote remove origin 2>nul
"C:\Program Files\Git\cmd\git.exe" remote add origin %REPO_URL%
"C:\Program Files\Git\cmd\git.exe" branch -M main

echo.
echo Pushing local branch 'main' to GitHub remote repository...
echo (If prompted, please authenticate via your browser window or personal access token)
echo.
"C:\Program Files\Git\cmd\git.exe" push -u origin main --force

if %ERRORLEVEL% equ 0 (
    echo.
    echo ==================================================
    echo ✅ SUCCESS! Code successfully integrated to GitHub.
    echo ==================================================
) else (
    echo.
    echo ❌ PUSH FAILED. Please verify your internet connection and make sure your repository is empty.
)
echo.
pause
