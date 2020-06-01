import * as net from 'net';
import * as assert  from 'assert';
import {Log} from './log';
import {UsbSerial} from './usbserial';
import {WrapperParser} from './wrapperparser';




/**
 * The Socket / Serial Interface.
 * If DeZog connects to the socket a new serial connection is setup.
 * On disconnect the serial connection is closed.
 * This class is not aware of DZRP it just passes everything received on
 * either side to the other side.
 */
export class SocketSerialPassthrough {

	/// The used socket.
	protected socket: net.Socket;

	// The server for incoming connections.
	protected server: net.Server;

	/// The port of the socket.
	protected socketPort: number;

	/// The name of the serial port, e.g. "/dev/usbserial" or "COM1".
	//protected serialPort: string;

	/// The baudrate to use for the serial port.
	//protected serialBaudrate: number;
	
	// The USB serial instance.
	protected usbSerial: UsbSerial;

	// The read parser for the serial port.
	protected serialParser: WrapperParser;

	/**
	 * Constructor.
	 * @param socketPort The port for the socket, e.g. 12000
	 * @param serialPort The name of the serial port, e.g. "/dev/usbserial" or "COM1".
	 * @param serialBaudrate The baudrate to use for the serial port, e.g. 230400.
	 */
	constructor(socketPort: number, serial: UsbSerial) {
		// Store
		this.socketPort=socketPort;
		//this.serialPort=serialPort;
		//this.serialBaudrate=serialBaudrate;

		// Create serial read parser
		this.serialParser=new WrapperParser({}, 'ZxNext Serial');

		// Setup serial listeners
		this.usbSerial=serial;
		this.usbSerial.on('error', err => {
			// Close socket connection
			console.log("Serial error: "+err);
			this.onClose();
		});
		// Install data handler
		this.usbSerial.on('data', data => {
			// Just pass data to the socket.
			this.socket.write(data);
		});

		// Start listening
		this.listen();
	}


	/**
	 * Listen for one connection.
	 */
	protected listen() {
		// Create server socket
		this.server=net.createServer(socket => {
			// Prohibit further incoming connections
			this.server.close();
			// Handle new socket
			this.socket=socket;
			this.installSocketHandler();
			// Needs to be called manually (connect already happened before the handler was installed)
			this.onConnect();
		});
		// Listen
		this.server.listen(this.socketPort);

		/*
		The connection event sequence is:
		'connect', 'end', 'closed'
		*/
	}


	/**
	 * Installs error, close, connect and data handler on
	 * this.socket.
	 */
	protected installSocketHandler() {
		assert(this.socket);

		// Error handling
		this.socket.on('error', exc => {
			this.onError(exc);
		});

		// Closed handling
		this.socket.on('close', () => {
			this.onClose();
		});
		// Connected
		this.socket.on('connect', () => {
			this.onConnect();
		});

		// Dat received
		this.socket.on('data', data => {
			this.onData(data);
		});

		/*
		this.socket.on('end', ()) => {
			console.log('end');
		});
		*/
	}


	/**
	 * @returns true if the csocket is connected.
	 */
	/*
	public isClosed() {
		return this.socketConnectionState == ConnectionState.CLOSED;
	}
	*/

	/**
	 * Closes the socket connection.
	 * On success an 'close' event will follow.
	 */
	public close() {
		this.socket.destroy();
	}

	/**
	 * Called if an error occurs on the socket.
	 * @param exc The error exception.
	 */
	protected onError(exc) {
		Log.log('Error:', exc);
	}


	/**
	 * Called if the socket is connected.
	 */
	protected onConnect() {
		Log.log('Socket connected.');
		// Setup serial connection
		this.usbSerial.open(this.serialParser as any);
	}


	/**
	 * Called if the socket is closed.
	 */
	protected onClose() {
		console.log('Socket disconnected.');
		this.usbSerial.removeAllListeners();
	}



	/**
	 * Called if data has been received from the socket.
	 */
	protected onData(data) {
		// Simply pass on to serial
		this.usbSerial.sendBuffer(data);
	}

}

