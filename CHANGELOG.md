# Changelog

## 1.1.1
- Fixed loopback mode.

## 1.1.0
- Fix: length of transmitted bytes fixed.

## 1.0.1
- Updated package.

## 1.0.0
- Released.

## 0.6.1
- Typos
- "-v" now quits after printing the version number.
- "-verbose" option to print the number of sent/received bytes.

## 0.6.0
Version on beta test.

## 0.5.0
Serial interface is now open all the time, not closed/re-opened anymore if socket connection closes/re-opens.

## 0.4.0
Added command line option to do a loopback test with the serial port with dezogif through dzrp.

## 0.3.0
Reconnects now after disconnect.

## 0.2.0
Changed parser to ignore the length and just pass received bytes.

## 0.1.0
Initial version.
Functionality:
- testing of serial port loopback
- sending, receiving byes through socket and serial port
