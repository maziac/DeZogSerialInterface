import * as tcpPortUsed from 'tcp-port-used';
import * as SerialPort from 'serialport';
import {UsbSerial} from './usbserial';
import {DzrpParser} from './dzrpparser';



export class InterfaceTests {

    /**
     * Tests to setup a socket.
     */
	public static async testSocket(socketPort: number): Promise<void> {
        // Socket
        try {
            const socketInUse=await tcpPortUsed.check(socketPort);
            if (socketInUse)
                console.log("Socket port "+socketPort+" is already in use. Choose another port.");
            else
                console.log("Socket port "+socketPort+" OK.");
        }
        catch (e) {
            console.log("Socket error: "+e);
        }
    }


    /**
     * Tests to setup a the serial interface.
     */
	public static async testSerial(serialPortString: string, serialBaudrate: number): Promise<void> {
        // Serial interface
        return new Promise<void>(resolve => {
            try {
				const serialPort=new SerialPort(serialPortString, {
                    baudRate: serialBaudrate, autoOpen: false
                });
                // React on-open
                serialPort.on('open', async () => {
					console.log("Serial interface "+serialPortString+" @"+serialBaudrate+" baud OK.");
                    resolve();
                });

                // Handle errors
                serialPort.on('error', err => {
					console.log("Serial interface "+serialPortString+" @"+serialBaudrate+"baud Error: ", err);
                    resolve();
                });

                // Open the serial port
                serialPort.open();
            }
            catch (e) {
				console.log("Serial interface "+serialPortString+" @"+serialBaudrate+"baud Error: "+e);
                resolve();
            }
        });
    }


    /**
     * Tests looping back data on the serial interface.
	 * @parm time Time in seconds to run.
     */
	public static async testSerialLoopBack(serialPortString: string, serialBaudrate: number, time: number, batchSize: number): Promise<void> {
		let bytesSent=0;
		let packetsSent=0;
		let bytesReceived=0;
		let packetsReceived=0;
		let batchReceived=batchSize;
		let lastByteSent=0;
		let lastByteReceived=lastByteSent;
		let timeout;
		let serialPort;
		//let state="started";

        // Serial interface
        return new Promise<void>(async resolve => {
			try {
				serialPort=new UsbSerial(serialPortString, serialBaudrate);
				// Print draining
				serialPort.on('draining', async () => {
					// The port is drained before the open event arrives
					console.log("Draining.");
				});
				// Handle errors
				serialPort.on('error', err => {
					console.log("Serial interface '"+serialPortString+"' @"+serialBaudrate+" baud\nError: "+err);
					resolve();
				});

				// Install data handler
				serialPort.on('data', data => {
					clearTimeout(timeout);
					timeout=setTimeout(() => {
						console.log("Timeout. No data received.");
						resolve();
					}, 1000);
					// Length was removed.
				 	// Check data.
					let k=0;
					for (const recByte of data) {
						// Skip Seqno
						k++;
						if (k>1) {
							lastByteReceived=(lastByteReceived+1)&0xFF;
							if (recByte!=lastByteReceived) {
								console.log("Wrong data received after "+bytesReceived+" received bytes");
								resolve();
								return;
							}
						}
					}
					bytesReceived+=data.length;
					batchReceived+=data.length;
					if (batchReceived>=batchSize) {
						batchReceived-=batchSize;
						packetsReceived++;
						// Send next data
						const buffer=new Uint8Array(batchSize+4+2);	// +Length+SeqNo+Command
						let k=0;
						// Length
						const length=2+batchSize;
						buffer[k++]=length&0xFF;
						buffer[k++]=(length>>>8)&0xFF;
						buffer[k++]=0;
						buffer[k++]=0;
						// SeqNo and command
						buffer[k++]=1;	
						buffer[k++]=15;	// CMD_LOOPBACK
						// Data
						for (let i=0; i<batchSize; i++) {
							lastByteSent=(lastByteSent+1)&0xFF;
							buffer[k++]=lastByteSent;
						}
						bytesSent+=batchSize;
						packetsSent++;
						serialPort.sendBuffer(buffer);
					}
				});

				// Open the serial port
				timeout=setTimeout(() => {
					console.log("Timeout. No connection.");
					resolve();
				}, 1000);

				// Open
				const parser=new DzrpParser({}, 'DZRP loopback')
				await serialPort.open(parser);
				
				// Success
				console.log("Serial interface '"+serialPortString+"' @"+serialBaudrate+" baud.");
				setTimeout(() => {
					// When elapsed testing can be stopped.
					console.log("Bytes sent: "+bytesSent);
					console.log("Bytes received: "+bytesReceived);
					console.log("Bytes/ms: "+(bytesReceived)/time/1000);
					console.log("Packets sent: "+packetsSent);
					console.log("Packets received: "+packetsReceived);
					console.log("Packets/s: "+(packetsReceived)/time);
					console.log("Sucessful. No error.");
					clearTimeout(timeout);
					serialPort.close();
					resolve();
				}, time*1000);

				// Send first batch
				serialPort.emit('data', Buffer.from([]));
			}
			catch (e) {
				clearTimeout(timeout);
				console.log("Serial interface "+serialPortString+" @"+serialBaudrate+"baud Error: "+e);
				// When elapsed testing can be stopped.
				console.log("Bytes sent: "+bytesSent);
				console.log("Bytes received: "+bytesReceived);
				console.log("Bytes/ms: "+(bytesReceived)/time/1000);
				console.log("Packets sent: "+packetsSent);
				console.log("Packets received: "+packetsReceived);
				console.log("Packets/s: "+(packetsReceived)/time);
				clearTimeout(timeout);
				if(serialPort)
					serialPort.close();
				resolve();
            }
        });
    }

}

