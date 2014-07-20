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
  , ddg = require("ddg");

/******************************************************************************/
/* MODULE BOOTSTRAP */
/******************************************************************************/
var bootstrap = function(http_srv) {
  var http_port = http_srv.address().port;

  breach.init(function () {
    var timeout = null;

    breach.register('mod_strip', 'box_input');
    breach.module('mod_strip').on('box_input', function (event) {
      if (!event.value) {
        return;
      }

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(function () {
        ddg.query(event.value, function (err, data) {
          console.log(data);
        });
      }, 300);

      return;
    });

    breach.expose('init', function (src, args, cb_) {
      console.log('Initialization');

      // breach.module('core').call('controls_set', {
      //   type: 'TOP',
      //   url: 'http://localhost:' + http_port + '/dropdown',
      //   dimension: 45
      // }, cb_);

      return cb_();
    });

    breach.expose('kill', function (args, cb_) {
      common.exit(0);
    });
  });

  process.on('uncaughtException', function (err) {
    common.fatal(err);
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
  app.use(require('body-parser')());
  app.use(require('method-override')())

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
