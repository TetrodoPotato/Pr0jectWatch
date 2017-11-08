@echo off

start opera

:checkExec

tasklist /FI "IMAGENAME eq launcher.exe" 2>NUL | find /I /N "launcher.exe">NUL

IF "%ERRORLEVEL%"=="0" (
	echo Running
) ELSE (
	echo Not Running
	GOTO checkExec 
)

timeout /T 3 /nobreak

start opera http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_1.user.js
start opera http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_2.user.js
start opera http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_3.user.js
start opera http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_4.user.js
start opera http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_5.user.js
start opera http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_6.user.js
start opera http://kartoffeleintopf.github.io/Pr0jectWatch/Pr0jectWatch_File_7.user.js
exit;