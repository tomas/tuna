var Tunnel = require('../');
var net = require('net');

var i = 1;
var servers = {};

var opts = {
  local_port: 5000,
  remote_port: 8080,
  remote_host: 'localhost'
}

servers.remote = net.createServer(function(socket) {
  
  console.log(' [server] Socket connected to remote server');

  // wait 5 seconds, then start sending data
  setTimeout(function() {
    setInterval(function() {
      if (socket.writable) {
        var str = i++;
        socket.write(str.toString())
      }
    }, 1000);
  }, 2000);

  socket.on('data', function(chunk) {
    console.log(' [server] Outbound data from app: ' + chunk.toString())
  })

  setInterval(function() {
    if (socket.writable) {
      socket.write("\r\n___STOP___\r\n");
    }
  }, 6600)

})

servers.local = net.createServer(function(socket) {

  console.log(' [app] Socket connected to local app.');

  // wait 5 seconds, then start sending data
  setTimeout(function() {
    setInterval(function() {
      if (socket.writable) {
        var str = new Array(i).join('x');
        socket.write(str);
      }
    }, 2000);
  }, 3000);

  socket.on('data', function(chunk) {
    console.log(' [app] Inbound data to app: ' + chunk.toString())
  })

  socket.on('error', function() {
    console.log('socket error on local app')
  })

})

servers.remote.listen(opts.remote_port);
servers.local.listen(opts.local_port);

var tun = new Tunnel(opts);

tun.on('opened', function() {
  console.log(' -- Tunnel opened.')
})

tun.on('piping', function() {
  console.log(' -- Now piping')
})

tun.on('closed', function() {
  console.log(' -- Tunnel now closed.')
})

tun.open();
