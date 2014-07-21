/*
 * Breach: [mod_duckduckgo] dropdown.js
 *
 * Copyright (c) 2014, Thomas Potaire. All rights reserved.
 *
 * @author: spolu
 *
 * @log:
 * - 2014-06-16  http-teapot  Creation
 */
"use strict"

var async = require('async')
  , breach = require('breach_module')
  , common = require('./common.js')
  , ddg = require("ddg");

// ### strip
//
// ```
// @spec { http_port }
// ```
var dropdown = function(spec, my) {
  var _super = {}
    , timeout = null
    , frame = {};

  my = my || {};
  spec = spec || {};

  my.socket = null;
  my.sockets = [];
  my.http_port = spec.http_port;

  //
  // ### _public_
  //
  var handshake;                    /* handshake(socket); */
  var init;                         /* init(cb_); */
  var kill;                         /* kill(cb_); */

  //
  // ### _private_
  //
  var on_box_input;                 /* on_box_input(event); */
  var socket_emit_search;           /* socket_emit_search(data); */
  var socket_on_goto;               /* socket_on_goto(data); */
  var socket_on_close;              /* socket_on_close(data); */
  var show;
  var hide;

  //
  // ### _that_
  //
  var that = {};

  /****************************************************************************/
  /* PRIVATE HELPERS */
  /****************************************************************************/
  // ### on_box_input
  //
  // Called when texts is being typed in the strip bar
  on_box_input = function (event) {
    var options = {
      useragent: 'breach-cc-ddg',
      skip_disambig: 1,
      no_redirects: 1
    };

    if (!event.value) {
      return;
    }

    if (timeout) {
      clearTimeout(timeout);
    }

    // If typing a URL or there is an empty value
    if (event.value.match(/^http|^https|^ftp/) || !event.value) {
      hide();
      return;
    }

    // Start searching when string is longer than 2 letter otherwise do nothing
    if (event.value.length <= 2) {
      return;
    }

    timeout = setTimeout(function () {
      try {
        ddg.query(event.value, options, function (err, data) {
          if (!data.Heading) {
            hide();
          } else {
            socket_emit_search(data);
            show();
          }
        });
      } catch (e) {
        // nothing for now
      }
    }, 300);

    return;
  };

  // ### socket_emit_search
  //
  // Emit the search data to the UI element
  socket_emit_search = function (data) {
    my.socket.emit('search', data);
  };

  // ### socket_on_goto
  //
  // When the interface emit a goto event, update
  // the main frame of the browser
  socket_on_goto = function (data) {
    breach.module('core').call('tabs_state', {}, function(err, res) {
      if (err) {
        return console.log('Unexpected Error: %s', err);
      }

      // search through tabs to get the active tab
      for (var id in res) {
        // if the tab is visible then load the content in it
        if (res[id].visible == true) {
          breach.module('core').call('tabs_load_url', {
            id: id,
            url: data.url
          }, function(err, res) {
            if (err) {
              return console.log('Unexpected Error: %s', err);
            }
            hide();
          });
          break;
        }
      }
    });
  };

  // ### socket_on_close
  //
  // When the interface emit a goto close, hide the search
  socket_on_close = function (data) {
    hide();
  };

  // ### show
  //
  // Show a frame into the app
  show = function (cb_) {
    breach.module('core').call('controls_dimension', {
      type: 'LEFT',
      dimension: 397
    }, cb_);
  };

  // ### hide
  //
  // Hide a frame into the app
  hide = function (cb_) {
    breach.module('core').call('controls_dimension', {
      type: 'LEFT',
      dimension: 0
    }, cb_);
  };

  /****************************************************************************/
  /* PUBLIC METHODS */
  /****************************************************************************/
  // ### handshake
  //
  // Called when the UI client connected to the Socket
  // ```
  // @socket {socket.io} the socket.io to connect with
  // ```
  handshake = function(socket) {
    common.log.out('[dropdown] HANDSHAKE');

    my.socket = socket;
    my.sockets.unshift(socket);

    my.socket.on('goto', socket_on_goto);
    my.socket.on('close', socket_on_close);

    my.socket.on('disconnect', function() {
      common.log.out('[dropdown] disconnect');
      common.remove(my.sockets, socket, true);
    });
  };

  // ### init
  //
  // Called at initialisation of the module
  // ```
  // @cb_  {function(err)} the async callback
  // ```
  init = function(cb_) {
    async.series([
      function(cb_) {
        // Build element but hide it
        breach.module('core').call('controls_set', {
          type: 'LEFT',
          url: 'http://localhost:' + my.http_port + '/dropdown',
          dimension: 0
        }, cb_);
      },
      function(cb_) {
        breach.module('mod_strip').on('box_input', on_box_input);
      }
    ], cb_);
  };

  // ### kill
  //
  // Called at destruction of the module
  // ```
  // @cb_  {function(err)} the async callback
  // ```
  kill = function(cb_) {
    breach.module('core').call('controls_unset', {
      type: 'LEFT',
    }, cb_);
  };


  common.method(that, 'init', init, _super);
  common.method(that, 'kill', kill, _super);

  common.method(that, 'handshake', handshake, _super);

  return that;
};

exports.dropdown = dropdown;
