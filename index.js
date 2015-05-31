// Create TCP connection to Open Pixel Control server 
var Socket = require("net")
  .Socket,
  wpi = require('wiring-pi'),
  _ = require('underscore'),
  async = require('async'),
  chroma = require('chroma-js');
var socket = new Socket();
socket.setNoDelay();
socket.connect(7890);
// Create an Open Pixel Control stream and pipe it to the server 
var createOPCStream = require("opc");
var stream = createOPCStream();
stream.pipe(socket);
// Create a strand representing connected lights 
var createStrand = require("opc/strand");
var strand = createStrand(512); // Fadecandy has 512 addresses 
var left = strand.slice(0, 64); // Fadecandy pin 0 
// var right = strand.slice(64, 128); // Fadecand pin 1 
var ryb = chroma.scale(['#f00', '#ff0', '#00f']);
var lit = 0;
doLoop();

function doLoop() {
  var theScale = _.range(0, 1, 0.1)
    .concat(_.range(1, 0, -0.1));
  async.eachSeries(theScale, onSat, function() {
    console.log('done');
    setTimeout(doLoop, 0);
  });
}

function onSat(s, satDone) {
  var theScale = _.range(-60, 0, 5)
    .concat(_.range(0, -60, -5));
  async.eachSeries(theScale, onScale.bind(this, s), function() {
    satDone();
  });
}

function onScale(s, c, done) {
  var color = ryb.mode('lab')
    .out('hex')(s);
  color = chroma(color)
    .saturate(c)
    .rgb();
  writePx(color, done);
}

function writePx(color, done) {
  lit = (lit + 1) % 64;
  _.each(_.range(lit, lit - 64, -1), function(f) {
    var i = (128 + f) % 64;
    left.setPixel(parseInt(i, 10), parseInt(color[0], 10), parseInt(color[1], 10), parseInt(color[2], 10));
    color = chroma(color)
      .desaturate(20)
      .darker(6)
      .rgb();
  });
  stream.writePixels(0, strand.buffer);
  setTimeout(done, 1);
}