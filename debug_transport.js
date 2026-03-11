const fileTransport = require('./transports/fileTransport');
console.log(fileTransport);
fileTransport.write('test\n');
console.log('Done');
