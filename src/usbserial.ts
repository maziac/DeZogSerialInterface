import * as SerialPort from 'serialport';
import * as Transform from 'stream';
import {EventEmitter} from 'events';


/*
 Install serialport:
 (npm i serialport)
 npm i @types/serialport

 https://serialport.io/docs/guide-usage
*/


/**
 * The representation of the ZX Next HW.
 * It receives the requests from the DebugAdapter and communicates with
 * the USB serial connection with the ZX Next HW.
 */
export class UsbSerial extends EventEmitter {

	// The serial port.
	protected serialPort;

	// The baudrate to use for the serial port.
	protected serialBaudrate: number;

	/// Constructor.
	constructor(port: string, baudrate: number) {
		super();
		this.serialPort=port;
		this.serialBaudrate=baudrate;
	}


	/// Opens the serial port.
	public async open(parser: Transform): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			// Open the serial port
			this.serialPort=new SerialPort(this.serialPort /*"/dev/cu.usbserial-14610"*/, {
				baudRate: this.serialBaudrate /*115200*/, autoOpen: false
			});

			// Create parser
			this.serialPort.pipe(parser); 

			// React on-open
			this.serialPort.once('open', async () => {
				console.log('USB-Serial connection opened!');
				// Setup new listeners
				// Handle errors
				this.serialPort.on('error', err => {
					console.log('Error: ', err);
					// Error
					this.emit('error', err);
				});
				// Handle parser errors
				parser.on('error', err => {
					console.log('Error: ', err);
					// Error
					this.emit('error', err);
				});

				// Now start real data receiving
				parser.on('data', data => {
					// Just pass data
					this.emit('data', data);
				});

				// Resolve
				resolve();
			});

			// Handle errors
			this.serialPort.once('error', err => {
				console.log('Error: ', err);
				// Error
				reject(err);
			});

			// Open the serial port
			this.serialPort.open();
		});
	}



	/**
	 * Closes the serial port.
	 */
	public async close(): Promise<void> {
		if (!this.serialPort)
			return;
		return new Promise<void>(resolve => {
			this.serialPort.close(() => {
				this.serialPort=undefined;
				resolve();
			});
		});
	}


	/**
	 * Writes the buffer to the serial port.
	 */
	public async sendBuffer(buffer: Buffer): Promise<void> {
		// Send buffer directly
		await this.serialPort.write(buffer);
	}
}

