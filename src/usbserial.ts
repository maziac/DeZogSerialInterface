import * as SerialPort from 'serialport';
//const {Transform}=require('stream');
import * as Transform from 'stream';
import {EventEmitter} from 'events';

//import {DzrpParser} from './dzrpparser';
//import {LogSocket} from '../../log';
//import {ZxNextRemote} from './zxnextremote';


//let sSerialPort;

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

	// The read parser for the serial port.
	//protected parser: DzrpParser;


	/// Constructor.
	//constructor() {
	//}


	/// Opens the serial port.
	public async open(parser: Transform, port: string, baudrate: number): Promise<void> {
		// Just in case
		if (this.serialPort&&this.serialPort.isOpen)
			this.serialPort.close();

		// Open the serial port
		this.serialPort=new SerialPort(port /*"/dev/cu.usbserial-14610"*/, {
			baudRate: baudrate /*115200*/, autoOpen: false
		});

		// Create parser
		//this.parser=
		this.serialPort.pipe(parser);  //new DzrpParser({}, 'Serial'));


		// React on-open
		this.serialPort.on('open', async () => {
			console.log('USB-Serial connection opened!');
			this.emit('open');
		});

		// Handle errors
		this.serialPort.on('error', err => {
			console.log('Error: ', err);
			// Error
			this.emit('error', err);
		});

		// Open the serial port
		this.serialPort.open();
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
	protected async sendBuffer(buffer: Buffer): Promise<void> {
		// Send buffer
		await this.serialPort.write(buffer);
		// Start timer to wait on response
		//this.parser.startTimer('Remote side did not respond.');
	}
}

