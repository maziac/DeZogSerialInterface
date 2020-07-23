import {SocketSerialPassthrough} from './socketserialpassthrough';
import {Log} from './log';
import {UsbSerial} from './usbserial';
import {InterfaceTests} from './interfacetests';
import {WrapperParser} from './wrapperparser';



class Startup {

    /// The port of the socket.
    protected static socketPort: number=12000;

    /// The name of the serial port, e.g. "/dev/usbserial" or "COM1".
    protected static serialPort: string= '/dev/cu.usbserial-14620';

    /// The baudrate to use for the serial port.
    protected static serialBaudrate: number = 921600;

    /// Set to true for more verbose output
    protected static verbose: boolean=false;


    /**
     * The main program. This is the start point.
     * The command line argument list is evaluated and the socket
     * is started.
     */
    public static async main(): Promise<number> {

        try {
            // Get arguments
            const args = process.argv.splice(2);

            // Go through arguments
            await this.evaluateArgs(args);

            // Print parameters
            console.log('Using socket='+this.socketPort+', serial='+this.serialPort+', baudrate='+this.serialBaudrate);

            // Create Serial object
            const serial=new UsbSerial(this.serialPort, this.serialBaudrate);
            // Create serial read parser
            const serialParser=new WrapperParser({}, 'ZxNext Serial');
            // Setup serial connection
            serial.once('error', error => {
                // Close socket connection
                console.log("Serial. Error on open: "+error);
                // Terminate
                process.exit(1);
            });
            serial.open(serialParser as any);

            const create=() => {
                // Error handling
                serial.removeAllListeners();
                serial.on('error', err => {
                    // Close socket connection
                    console.log("Serial error: "+err);
                    // Terminate
                    process.exit(1);
                });
               // Start socket
                const socket=new SocketSerialPassthrough(this.socketPort, serial, this.verbose);
                // Reconnect
                socket.on('disconnect', () => {
                    setTimeout(() => {
                        create();
                    }, 1);
                });
            }

            // Connect first time
            create();

        }
        catch(e) {
            // Output any problems
            console.error(e);
            return 1;
        }

    return 0;
    }


    /**
     * Prints command line help.
     */
    protected static printHelp() {
        console.log(`
DeZogSerialInterface is a program that allow DeZog to talk to a ZXNext via a serial interface.
It opens a serial connection to the ZXNext and on the other side opens a socket listener so that Dezog can connect to the socket.

Example command line:

$ DeZogSerialInterface -socket 12000
Starts to listen on port 12000.

General usage:
DeZogSerialInterface -socket port -serial serial_if -baudrate rate [-log] [-test] [-testloopback time]
  options:
    -h|-help: Prints this help.
    -v|-version: Prints the version number.
    -verbose: Prints number of sent and received bytes.
    -socket port: The socket port to connect to, default is 12000.
    -serial serial_if: The serial port, e.g. "/dev/usbserial" (Linux/macOS) or "COM1" 
     (Windows).
    -baudrate rate: The baudrate to use for the serial port. Default=230400.
    -log: Enables logging to console.
    -test: Use as last argument. If given the program tries to open a 
     socket and a serial connection. Just to see if it could work.
    -testloopback time batch-size: Test the serial connection. The remote side needs to loop back
     all received data. time is in secs. batch-size determines teh size of the packets used.
`);
    }


    /**
     * Evaluates the command line arguments.
     * @param args List of arguments.
     */
    protected static async evaluateArgs(args: Array<string>): Promise<void> {

        // Iterate all arguments
        let arg;
        //const argCount=args.length;
        while (arg=args.shift()) {

            // Check option
            if (arg.startsWith('-')) {
                switch (arg) {
                    // Help
                    case '-help':
                    case '-h':
                        this.printHelp();
                        process.exit(0);
                        break;

                    // Version
                    case '-version':
                    case '-v':
                        const pckg=require('../package.json');
                        console.log('Version: '+pckg.version);
                        process.exit(0);
                        break;

                    // Verbose
                    case '-verbose':
                        this.verbose=true;
                        break;

                    // Log
                    case '-log':
                        Log.enabled=true;
                        break;

                    // Socket port
                    case '-socket':
                        const portString=args.shift();
                        if (portString==undefined)
                            throw "No socket port given.";
                        this.socketPort=parseInt(portString);
                        break;

                    // Serial interface
                    case '-serial':
                        {
                            this.serialPort=args.shift()!;
                            if (this.serialPort==undefined)
                                throw "No socket port given.";
                        }
                        break;

                    // Serial baudrate
                    case '-baudrate':
                        const baudrateString=args.shift();
                        if (baudrateString==undefined)
                            throw "No socket port given.";
                        this.serialBaudrate=parseInt(baudrateString);
                        break;

                    case '-testloopback':
                        const timeString=args.shift();
                        if (timeString==undefined)
                            throw "Missing time argument.";
                        const time=parseInt(timeString);
                        const batchSizeString=args.shift();
                        if (batchSizeString==undefined)
                            throw "Missing batch-size argument.";
                        const batchSize=parseInt(batchSizeString);
                        if (batchSize>8192)
                            throw "Size should be smaller/equal to 8192.";
                        this.checkSerialArguments();
                        await InterfaceTests.testSerialLoopBack(this.serialPort, this.serialBaudrate, time, batchSize);
                        process.exit(0);
                        break;
                    
                    case '-test':
                        this.checkSocketArguments();
                        this.checkSerialArguments();
                        await InterfaceTests.testSocket(this.socketPort);
                        await InterfaceTests.testSerial(this.serialPort, this.serialBaudrate);
                        process.exit(0);
                        break;
                    
                    default:
                        throw "Unknown argument: '"+arg+"'";
                }
            }
            else {
                // no option ("-")
                throw "Wrong argument. Use 'dezogserialif -h' to show all options."
            }
        }

        // Check if any argument given
        //if (argCount==0)
        //    throw "No arguments. Use 'dezogserialif -h' to show all options."
        
        this.checkSocketArguments();
        this.checkSerialArguments();
    }


    /**
     * Checks if the arguments are given and throws an exception
     * if not.
     */
    protected static checkSerialArguments() {
        // Check arguments:
        if (!this.serialBaudrate)
            throw "No serial baudrate given.";
        if (!this.serialPort)
            throw "No serial port given.";
    }


    /**
      * Checks if the arguments are given and throws an exception
      * if not.
      */
    protected static checkSocketArguments() {
        // Check arguments:
        if (!this.socketPort)
            throw "No socket port given.";
    }

}






Startup.main();
