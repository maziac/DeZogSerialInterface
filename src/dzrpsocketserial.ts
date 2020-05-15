import * as net from 'net';
import * as assert  from 'assert';
import {Log} from './log';



/// Connection state.
enum ConnectionState {  // TODO: not required
	CLOSED = 0,
	CONNECTING,
	CONNECTED
};



/**
 * The Soxket / Serial Interface.
 */
export class DzrpSocketSerial {

	/// The used socket.
	protected socket: net.Socket;

	// The server for incoming connections.
	protected server: net.Server;

	/// The port of the socket.
	protected socketPort: number;

	/// The state of the socket connection.
	protected socketConnectionState: ConnectionState;

	/// The name of the serial port, e.g. "/dev/usbserial" or "COM1".
	protected serialPort: string;

	/// The baudrate to use for the serial port.
	protected serialBaudrate: number;

	/**
	 * Constructor.
	 * @param socketPort The port forthe socket, e.g. 12000
	 * @param serialPort The name of the serial port, e.g. "/dev/usbserial" or "COM1".
	 * @param serialBaudrate The baudrate to use for the serial port, e.g. 230400.
	 */
	constructor(socketPort: number, serialPort: string, serialBaudrate: number) {
		// Store
		this.socketPort=socketPort;
		this.socketConnectionState=ConnectionState.CLOSED;

		// Create Server
		this.server=net.createServer(socket => {
			// Prohibit further incoming connections
			this.server.close();
			// Handle new socket
			this.socket=socket;
			this.installSocketHandler();
			// Needs to be called manually (connect already happened before the handler was installed)
			this.onConnect();
		});

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
	public isClosed() {
		return this.socketConnectionState == ConnectionState.CLOSED;
	}


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
		this.socketConnectionState == ConnectionState.CONNECTED;
	}


	/**
	 * Called if the socket is closed.
	 */
	protected onClose() {
		console.log('Socket disconnected.');
		this.socketConnectionState == ConnectionState.CLOSED;
	}



	/**
	 * Called if data has been received from the socket.
	 */
	protected onData(data) {
		// Convert
	//	let dataStr = data.toString();



	}

}

