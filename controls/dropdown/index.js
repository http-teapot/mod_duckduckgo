/*
 * Breach: [mod_duckduckgo] index.js
 *
 * Copyright (c) 2014, Thomas Potaire. All rights reserved.
 *
 * @author: http-teapot
 *
 * @log:
 * - 2014-07-20  http-teapot  Creation
 */
'use strict'

// ### dropdown
//
// ```
// @spec { element }
// ```
var dropdown = function(spec, my) {
  var _super = {}
    , that = {};

  my = my || {};
  spec = spec || {};

  // The list wrapper
  my.wrapper = spec.element;

  // The placeholder wrapper
  my.placeholder = spec.placeholder;

  // The UI elements (don't use them directly, clone them)
  my.elements = {};

  var init;
  var socket_on_search;

  // ### on_search
  //
  // Socket.io event when the list needs to be updated
  socket_on_search = function (data) {
    var element = my.elements.default.clone()
      , listItem
      , newListItem;

    element.find('.SearchItem-header-title').text(data.Heading);

    if (data.AbstractURL && data.AbstractSource) {
      element.find('.SearchItem-header-source-link')
        .attr('href', data.AbstractURL)
        .text(data.AbstractSource);
    } else {
      element.find('.SearchItem-header-source').remove();
    }

    // DDG barely returns any results ~ of all searches, DDG will
    // sometimes return the officiel website (only in few cases)
    if (data.Results.length !== 0) {
      element.find('.SearchItem-result-text').text(data.Results[0].Text);
      element.find('.SearchItem-result-link')
        .text(data.Results[0].FirstURL)
        .attr('href', data.Results[0].FirstURL);
      element.find('.SearchItem-header-title-link').attr('href', data.Results[0].FirstURL);
      element.find('.SearchItem-header-title-text').remove();
    } else {
      element.find('.SearchItem-result').remove();
      element.find('.SearchItem-header-title-link').remove();
    }

    if (data.Abstract) {
      /* might be risky to accept any HTML */
      element.find('.SearchItem-abstract').html(data.Abstract);
    } else {
      element.find('.SearchItem-abstract').remove();
    }

    // Clone an list item element
    listItem = element.find('.SearchItem-relatedTopics-list-item').clone();
    // Delete the original
    element.find('.SearchItem-relatedTopics-list-item').remove();

    if (data.RelatedTopics.length === 0) {
      element.find('.SearchItem-relatedTopics').remove();
    } else {
      for (var i = 0; i < data.RelatedTopics.length; i++) {
        if (data.RelatedTopics[i].Result && data.RelatedTopics[i].FirstURL) {
          // Create a new item
          newListItem = listItem.clone();
          // Inject the text
          newListItem.find('.SearchItem-relatedTopics-list-item-text')
            .html(data.RelatedTopics[i].Result);
          // Inject the link's label and URL
          newListItem.find('.SearchItem-relatedTopics-list-item-link')
            .text(data.RelatedTopics[i].FirstURL)
            .attr('href', data.RelatedTopics[i].FirstURL);
          // Add the element to the list
          element.find('.SearchItem-relatedTopics-list').append(newListItem);
        }
      }
    }

    my.wrapper.empty().append(element);
  };

  // ### init
  //
  // Initialises the controller
  init = function () {
    // Initialize the UI elements
    my.elements = {
      default: my.placeholder.find('.SearchItem.SearchItem--default').first()
    };

    // Events
    $(document.body).on('click', '.Button.Button--close', function (event) {
      my.socket.emit('close', {});
    });

    // Click on links
    $(document.body).on('click', 'a', function (event) {
      // do absolutely nothing
      event.preventDefault();
      // send a goto event to the backend to change the state of the main view
      my.socket.emit('goto', {url: $(this).attr('href')});
    });

    // Initialize the socket
    my.socket = io();

    my.socket.on('connect', function() {
      my.socket.emit('handshake', '_dropdown');

      // The user searches for something
      my.socket.on('search', socket_on_search);
    });

    return that;
  };

  that.init = init;

  return that;
};
