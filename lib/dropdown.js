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
  var emit;                         /* emit(data); */
  var show;
  var hide;
  var render;

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
      ddg.query(event.value, function (err, data) {
        console.log(data);
        emit(data);
        show();
      });
    }, 300);

    return;
  };

  // ### emit
  //
  // Emit the search data to the UI element
  emit = function (data) {
    my.socket.emit('search', data);
  };

  // ### show
  //
  // Show a frame into the app
  show = function (cb_) {
    breach.module('core').call('controls_dimension', {
      type: 'LEFT',
      dimension: 390
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

  // ### render
  //
  // Render and prepare a frame
  render = function (url, data) {
    // WIP
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
