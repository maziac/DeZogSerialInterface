//import {Utility} from '../../misc/utility';
const {Transform}=require('stream');




/**
 * This parser does not really parse.
 * It just reads what comes in and passes it through.
 * No CZRP handling.
 */
export class WrapperParser extends Transform {
	/// State: Either waiting for length (false) or collecting data (true).
	protected collectingData: boolean;

	/// The number of remaining bytes to collect.
	protected remainingLength: number;

	/// Timeout. Max time between chunks.
	protected timeout=1000;	// ms

	/// The timer.
	protected timer;

	// Name, for debugging purposes.
	protected name: string|undefined;


	/// The constructor.
	/// @param name Add a name for debugging purposes.
	constructor(options={}, name?: string) {
		super(options);
		//Utility.assert(options);

		// Timeout
		if ((options as any).timeout!=undefined)
			this.timeout=(options as any).timeout;

		// Alloc buffer
		this.buffer=Buffer.alloc(0);
		this.collectingData=false;
		this.remainingLength=0;
		this.timer=undefined;
		this.name=name;
	}


	/**
	 * Creates an error text.
	 * I.e. Adds name and some constant text to it.
	 */
	public ErrorWithText(text: string): Error {
		let wholeText="Socket";
		if (this.name)
			wholeText+=" ("+this.name+")";
		wholeText+=": "+text;
		const err=new Error(wholeText);
		return err;
	}


	/**
	 * Should be started a soon as a response is expected.
	 * @param errorText The text that is emitted if the timer expires.
	 */
	public startTimer(errorText: string) {
		clearTimeout(this.timer);	// Stop previous timer.
		this.timer=setTimeout(() => {
			this.emit('error', this.ErrorWithText('Timeout: ' + errorText));
		}, this.timeout);
	}


	/**
	 * Just pass the data on. 
	 * The chunks received here are typically not bigger than 50-130 bytes.
	 */
	_transform(chunk, encoding, cb) {
		//console.log("Received chunk: "+chunk.length);
		this.push(chunk);
		cb();
	}
}

