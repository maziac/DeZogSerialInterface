

/**
 * Class for logging.
 */
export class Log {

	// Enable/disable logging.
	public static enabled=false;


	/**
	 * Logs to console.
	 * Puts the caller name ('class.method'. E.g. "ZesaruxDebugSession.initializeRequest")
	 * in front of each log.
	 * @param args The log arguments
	 */
	public static log(...args) {
		if (Log.enabled) {
			console.log(...args);
		}
	}

}
