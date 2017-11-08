@echo off

CD C:\Program Files\Mozilla Firefox\
start firefox.exe 

:checkExec

tasklist /FI "IMAGENAME eq firefox.exe" 2>NUL | find /I /N "firefox.exe">NUL

IF "%ERRORLEVEL%"=="0" (
	echo Running
) ELSE (
	echo Not Running
	GOTO checkExec 
)

timeout /T 3 /nobreak

start firefox.exe http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_1.user.js
start firefox.exe http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_2.user.js
start firefox.exe http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_3.user.js
start firefox.exe http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_4.user.js
start firefox.exe http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_5.user.js
start firefox.exe http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_6.user.js
start firefox.exe http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_7.user.js
exit;