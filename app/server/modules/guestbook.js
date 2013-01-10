var binaryjs = require('binaryjs');
var BinaryServer = binaryjs.BinaryServer;
var server = new BinaryServer({ port: 8080 });
var fs = require('fs');
var file = fs.createWriteStream('guestbook.txt');
server.on('connection', function(client) {
  client.on('stream', function(stream) {
    file.write(stream);
    file.write('\n');
  });
} 