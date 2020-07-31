
default:	zip


# Create executables
dezogserialif:
	pkg out/main.js -o dezogserialinterface -t node12-linux-x64,node12-macos-x64,node12-win-x64

# Create zip file
zip:	dezogserialinterface-macos.zip dezogserialinterface-win.zip dezogserialinterface-linux.zip

dezogserialinterface-macos.zip:	dezogserialif
	# macos zip
	rm -f dezogserialinterface-macos.zip
	# Copy node_module and use as new zip file
	cp bin/node_modules-macos.zip dezogserialinterface-macos.zip
	# Add the program
	zip dezogserialinterface-macos.zip dezogserialinterface-macos

dezogserialinterface-win.zip:	dezogserialif
	# win zip
	rm -f dezogserialinterface-win.zip
	# Copy node_module and use as new zip file
	cp bin/node_modules-win.zip dezogserialinterface-win.zip
	# Add the program
	zip dezogserialinterface-win.zip dezogserialinterface-win.exe

dezogserialinterface-linux.zip:	dezogserialif
	# linux zip
	rm -f dezogserialinterface-linux.zip
	# Copy node_module and use as new zip file
	#cp bin/node_modules-linux.zip dezogserialinterface-linux.zip
	# Add the program
	zip dezogserialinterface-linux.zip dezogserialinterface-linux
