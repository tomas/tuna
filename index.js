// Reverse Tunnel JS
// Written by Tomas Pollak
// BSD Licensed.

// the purpose of this class is to abstract the logic
// of establishing reverse tunnels. the logic is basically this:
// 
// a new Tunnel instance is built by passing the port of a local
// service and the host and port of a remote listening TCP server.
//
// when calling open(), this guy will try to connect to the remote
// TCP server and establish a connection, optionally via encrypted TLS.
//
// if connection succeds, the instance will remain on a passive state until
// the remote server sends data through that TCP connection. when so
// it will open a TCP socket to the local service's port. 

var net      = require('net'),
    tls      = require('tls'),
    inherits = require('util').inherits,
    Emitter  = require('events').EventEmitter;

var debug    = process.env.DEBUG ? console.log : function() { };

var stop_frame = "\r\n___STOP___\r\n";

var Tunnel = function(opts) {
  this.open_status = false;
  this.pipe_status = false;

  this.local_port  = opts.local_port;
  this.remote_port = opts.remote_port;
  this.remote_host = opts.remote_host;

  this.secure      = opts.secure || false;
  this.verify      = this.secure && opts.verify;
}

inherits(Tunnel, Emitter);

Tunnel.prototype.is_open = function() {
  return this.open_status == true;
}

Tunnel.prototype.opened = function() {
  if (this.is_open()) 
    throw new Error('Already open!');

  this.open_status = true;
  this.emit('opened');
}

Tunnel.prototype.piping = function(bool) {
  debug('Piping: ' + bool + '. Opened: ' + this.open_status);

  this.pipe_status = bool;
  this.emit('piping');
}

Tunnel.prototype.closed = function() {
  if (!this.is_open()) 
    throw new Error('Already closed!');

  this.open_status = false;
  this.emit('closed');
}

Tunnel.prototype.open = function(cb) {

  var self = this;
  var protocol = this.secure ? tls : net;

  var opts = {
    port: this.remote_port,
    host: this.remote_host,
    rejectUnauthorized: this.verify
  }

  var local  = new net.Socket();

  var remote = protocol.connect(opts, function() {
    debug('Remote connected.');

    if (this.secure && !remote.authorized)
      debug('Invalid credentials: ' + remote.authorizationError);

    self.opened();
    cb && cb();
  })

  remote.on('error', function(err) {
    debug('Remote error: ', err);
    remote.destroy();
  })

  remote.on('close', function(err) {
    debug('Remote closed.');

    self.closed();
    self.local.end();
  });

  remote.on('readable', function() {
    var chunk;
    while (chunk = this.read()) {
      debug('Got chunk from remote: ' + chunk.toString())

      // if local end is closed, open it and start piping
      // if (['closed', 'readOnly'].indexOf(self.local.readyState) !== -1) { 
      if (!self.local.writable) {
        self.pipe(chunk);
      } else if (chunk.toString() === stop_frame) {
        debug('Got STOP signal from remote. Closing local.');
        self.local.end();
      } else {
        self.local.write(chunk)
      }
    }
  })

  this.local  = local;
  this.remote = remote;
}

Tunnel.prototype.pipe = function(chunk) {
  var self  = this,
      local = this.local;

  debug('Connecting to local port ' + this.local_port);

  local.connect(this.local_port, function() {
    debug('Local connected.');

    // write the first chunk we received
    local.write(chunk);

    // and finally, toggle stats / trigger event
    self.piping(true);
  })

  // NOTE: local.pipe(remote) doesn't help us, because it 
  // would automatically call remote.end() whenever the local
  // socket ends. we want to maintain the remote connection
  // regardless of what happens with the local one. (e.g. stop frame)
  local.on('data', function(chunk) {
    // debug('Received chunk from local: ' + chunk)

    if (self.remote.writable)
      self.remote.write(chunk);
  })

  local.on('error', function(err) {
    debug('Local error: ', err);
    local.last_error = err;
    self.remote.end(err.code); // sends and ends
  })

  local.on('close', function(err) {
    debug('Local closed.');
    self.piping(false);
  })
}

Tunnel.prototype.close = function() {
  if (this.local.readyState !== 'closed') {
    debug('Closing local end.');
    this.local.destroy();
  }
  if (this.remote.readyState !== 'closed') {
    debug('Closing remote end.');
    this.remote.destroy();
  }
}

module.exports = Tunnel;
