import * as tcpPortUsed from 'tcp-port-used';
import * as SerialPort from 'serialport';
import {WrapperParser} from './wrapperparser';



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
        return new Promise<void>(resolve => {
            try {
				serialPort=new SerialPort(serialPortString, {
                    baudRate: serialBaudrate, autoOpen: false
                });
                // React on-open
				serialPort.on('open', async () => {
					//state="open";
					console.log("Serial interface '"+serialPortString+"' @"+serialBaudrate+" baud.");
					setTimeout(() => {
						// When elapsed testing can be stopped.
						console.log("Bytes sent: "+bytesSent);
						console.log("Bytes received: "+bytesReceived);
						console.log("Bytes/ms: "+(bytesReceived)/time/1000);
						console.log("Packets sent: "+packetsSent);
						console.log("Packets received: "+packetsReceived);
						console.log("Packets/ms: "+(packetsReceived)/time/1000);
						console.log("Sucessful. No error.");
						clearTimeout(timeout);
						serialPort.close();
						resolve();
					}, time*1000);
					// Send first batch
					parser.emit('data', []);
               });

                // Handle errors
                serialPort.on('error', err => {
					console.log("Serial interface '"+serialPortString+"' @"+serialBaudrate+" baud\nError: "+err);
					resolve();
                });

				// Install data handler
				const parser=new WrapperParser({}, 'ZxNext Serial')
				parser.on('data', data => {
					clearTimeout(timeout);
					timeout=setTimeout(() => {
						console.log("Timeout. No data received.");
						resolve();
					}, 1000);
					// Length was removed.
					// Check data.
					for (const byte of data) {
						lastByteReceived=(lastByteReceived+1)&0xFF;
						if (byte!=lastByteReceived) {
							console.log("Wrong data received.");
							resolve();
						}
					}
					bytesReceived+=data.length;
					batchReceived+=data.length;
					if (batchReceived>=batchSize) {
						batchReceived-=batchSize;
						packetsReceived++;
						// Send next data
						const buffer=new Uint8Array(batchSize+4);
						// Send data in packets with length header.
						buffer[0]=batchSize&0xFF;
						buffer[1]=(batchSize>>>8)&0xFF;
						buffer[2]=(batchSize>>>16)&0xFF;
						buffer[3]=(batchSize>>>24)&0xFF;
						for (let i=0; i<batchSize; i++) {
							lastByteSent=(lastByteSent+1)&0xFF;
							buffer[i+4]=lastByteSent;
						}
						bytesSent+=batchSize;
						packetsSent++;
						serialPort.write(buffer);
					}
				});

                // Open the serial port
				timeout=setTimeout(() => {
					console.log("Timeout. No connection.");
					resolve();
					}, 1000);
				serialPort.pipe(parser);
				serialPort.open();
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
				console.log("Packets/ms: "+(packetsReceived)/time/1000);
				clearTimeout(timeout);
				if(serialPort)
					serialPort.close();
				resolve();
            }
        });
    }

}

