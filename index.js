/*
 * Breach: mod_duckduckgo index.js
 *
 * Copyright (c) 2014, Thomas Potaire. All rights reserved.
 *
 * @author: http-teapot
 *
 * @log:
 * - 2014-07-19  http-teapot  Creation
 */
'use strict';

var breach = require('breach_module')
  , common = require("./lib/common.js")
  , express = require('express')
  , http = require('http')
  , async = require('async');

/******************************************************************************/
/* MODULE BOOTSTRAP */
/******************************************************************************/
var bootstrap = function(http_srv) {
  var http_port = http_srv.address().port;

  common._ = {
    dropdown: require('./lib/dropdown.js').dropdown({
      http_port: http_port
    }),
  };

  breach.init(function() {
    breach.register('mod_strip', 'box_input');

    breach.expose('init', function(src, args, cb_) {
      async.parallel([
        common._.dropdown.init,
      ], cb_);
    });

    breach.expose('kill', function(args, cb_) {
      async.parallel([
        common._.dropdown.kill
      ], function(err) {
        common.exit(0);
      });
    });
  });

  process.on('uncaughtException', function (err) {
    common.fatal(err);
  });

  var io = require('socket.io').listen(http_srv, {
    'log level': 1
  });

  io.sockets.on('connection', function (socket) {
    socket.on('handshake', function (name) {
      var name_r = /^_(.*)$/;
      var name_m = name_r.exec(name);
      if(name_m && common._[name_m[1]]) {
        common._[name_m[1]].handshake(socket);
      }
    });
  });
};

/******************************************************************************/
/* SETUP */
/******************************************************************************/
(function setup() {
  var app = express();

  var args = process.argv;
  args.forEach(function(a) {
    if(a === '--debug') {
      common.DEBUG = true;
    }
  });

  /* App Configuration */
  app.use('/', express.static(__dirname + '/controls'));

  app.get('/proxy', function(req, res, next) {
    request(req.param('url')).pipe(res);
  });

  var http_srv = http.createServer(app).listen(0, '127.0.0.1');

  http_srv.on('listening', function() {
    var port = http_srv.address().port;
    common.log.out('HTTP Server started on `http://127.0.0.1:' + port + '`');
    return bootstrap(http_srv);
  });
})();
