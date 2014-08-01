Tuna
====

Reverse tunnels for Node.js.

Code
----

    var Tunnel = require('tuna');
  
    var opts = {
      local_port  : 5500,
      remote_port : 8800,
      remote_host : 'my.server.com' 
    }
   
    var tun = new Tunnel(opts);

    tun.on('opened', function() {
      console.log('Connected to remote server.')
    })

    tun.on('closed', function() {
      console.log('Tunnel is now closed.')
    })

    tun.open()


And boom.

Small print
-----------

Written by Tomas Pollak. BSD.
