@echo off

start chrome

:checkExec

tasklist /FI "IMAGENAME eq chrome.exe" 2>NUL | find /I /N "chrome.exe">NUL

IF "%ERRORLEVEL%"=="0" (
	echo Running
) ELSE (
	echo Not Running
	GOTO checkExec 
)

timeout /T 3 /nobreak


start chrome https://raw.githubusercontent.com/Kartoffeleintopf/Pr0jectWatch/master/Pr0jectWatch_File_1.user.js
start chrome https://raw.githubusercontent.com/Kartoffeleintopf/Pr0jectWatch/master/Pr0jectWatch_File_2.user.js
start chrome https://raw.githubusercontent.com/Kartoffeleintopf/Pr0jectWatch/master/Pr0jectWatch_File_3.user.js
start chrome https://raw.githubusercontent.com/Kartoffeleintopf/Pr0jectWatch/master/Pr0jectWatch_File_4.user.js
start chrome https://raw.githubusercontent.com/Kartoffeleintopf/Pr0jectWatch/master/Pr0jectWatch_File_5.user.js
start chrome https://raw.githubusercontent.com/Kartoffeleintopf/Pr0jectWatch/master/Pr0jectWatch_File_6.user.js
start chrome https://raw.githubusercontent.com/Kartoffeleintopf/Pr0jectWatch/master/Pr0jectWatch_File_7.user.js
exit;