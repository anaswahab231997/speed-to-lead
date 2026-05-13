@echo off
echo ==============================================
echo FFmpeg Stereo Widening Script: "Mujh Mein Tu"
echo ==============================================

:: Set input and output filenames
set INPUT_FILE="Mujh_Mein_Tu.mp3"
set OUTPUT_FILE="Mujh_Mein_Tu_Widened.mp3"

:: Check if input file exists
if not exist %INPUT_FILE% (
    echo [ERROR] Input file %INPUT_FILE% not found! Please place the audio file in this directory.
    pause
    exit /b 1
)

echo [PROCESS] Applying stereo widening effect (extrastereo m=2.5)...
:: Using extrastereo filter. m is the difference multiplier. 2.5 is aggressive widening.
ffmpeg -y -i %INPUT_FILE% -af "extrastereo=m=2.5:c=c" -c:a libmp3lame -q:a 2 %OUTPUT_FILE%

echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Stereo widened file saved as %OUTPUT_FILE%.
) else (
    echo [ERROR] FFmpeg failed. Check if ffmpeg is installed and added to PATH.
)

pause
