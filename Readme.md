**IMPORTANT NOTE:**
Before version 2.6.0 the DeZogSerialInterface was necessary to connect DeZog to a ZX Next.
Beginning with DeZog v2.6.0 this functionality is integrated into DeZog.
I.e. there is no need to use the DeZogSerialInterface anymore.

There is only one feature that might still be useful which is the 'loopback'.
This works standalone, i.e. without DeZog one can test that the serial cable connection is working reliable.


# DeZog Serial Interface

A socket-serial interface to connect [DeZog](https://github.com/maziac/DeZog) with a [ZX Next](https://www.specnext.com).
Due to technical restrictions DeZog cannot directly interface with the serial port on your Mac/PC. It needs a bridge to do so.
This bridge is the "DeZog Serial Interface". It offers a socket connection to Dezog on one side and a serial port connection to the ZX Next's UART on the other side.
Every message that is received from DeZog is forwarded to the ZX Next and, vice versa, every message from the ZX Next is forwarded to DeZog.

# Installation

Simply download and unzip the [binary](https://github.com/maziac/DeZogSerialInterface/releases) for your operating system to a location of your choice.
It doesn't use any additional file.
To start it use the terminal/console.


# Command Line

The dezogserialinterface is a commandline program and offers a few options:

- -socket port: If you need to use another socket port than the default 12000 then you can change it here.
- -serial serial_if: Enter here the name of the serial port.
- -test: This tests if socket and serial port could be opened and prints a success or error message. Please use this to test if your serial port device can be accessed.
- -testloopback: Sends data to the serial port and receives data. The dezogif.nex on the ZX Next will return the packets. I.e. this is a standalone test to test communication over UART/serial.

The program stays there and waits on a connection from DeZog. DeZog starts the connection when a debug session is entered. It closes the connection when the debug session is terminated.
dezogserialinterface will not terminate but wait for the next connection from DeZog.

To terminate use "CTRL-C".


## Examples with output

### Mac OS:
Serial port could be opened. Waiting on connection from DeZog:
```
./dezogserialinterface-macos -socket 12000 -serial /dev/cu.usbserial-14610
Using socket=12000, serial=/dev/cu.usbserial-14610, baudrate=921600
Waiting for connection on port 12000
```

Test that serial port is found. The USB/serial device needs to be plugged into a USB port but does not need to be connected to anything. Port found:
```
./dezogserialinterface-macos -socket 12000 -serial /dev/cu.usbserial-14610 -test
Socket port 12000 OK.
Serial interface /dev/cu.usbserial-14610 @921600 baud OK.
```

Port not found:
```
./dezogserialinterface-macos -socket 12000 -serial /dev/cu.usbserial-14610 -test
Socket port 12000 OK.
Serial interface /dev/cu.usbserial-14610 @921600baud Error:  [Error: Error: No such file or directory, cannot open /dev/cu.usbserial-14610]
```

Loopback test. The USB/serial device needs to be plugged into a USB port and needs to be connected to the ZX Next (ESP) UART:
```
node out/main.js -socket 12000 -serial /dev/cu.usbserial-AQ007PCD -testloopback 2 200
USB-Serial connection opened!
Serial interface '/dev/cu.usbserial-AQ007PCD' @921600 baud.
Bytes sent: 19000
Bytes received: 18894
Bytes/ms: 9.447
Packets sent: 95
Packets received: 95
Packets/s: 47.5
Sucessful. No error.
```

Hints:
- On macos you can attach your USB/serial device and use ```ls /dev/cu*``` to find out it's name. E.g. /dev/cu.usbserial-AQ007PCD
- On Windows the serial port is probably called e.g. "COM1"


# Building the Executables

Use:

~~~
pkg out/main.js -o dezogserialinterface -t node12-linux-x64,node12-macos-x64,node12-win-x64
~~~

Or:

Build the executables for all OSes:
~~~
make dezogserialif
~~~

Build all zip files:
~~~
make zip
~~~


# Deploying

The package built with pkg does not include native modules, i.e. it misses the serialport module.
This need to be deployed separately.
Therefore the node_modules/serialport folder is added to the created zip files.
The zip file need to be unzipped and the executable can be started.

Note: Unfortunately I don't have a native serial port binary for linux. If you are using linux you should build dezogserialinterface by yourself.
