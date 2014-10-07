Tuna
====
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/tomas/tuna?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Reverse tunnels for Node.js.

Code
----

    var Tunnel = require('tuna');
  
    var opts = {
      secure      : true,
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
