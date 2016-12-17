'use strict';

const rediservice = require( '../lib/rediservice' ).create();

// Join a list of words
rediservice.service( 'text.join', function(serviceName, opts) {

  this.on( serviceName, { words: true, result: false }, (data) => {

    // join the word list with an optional separator
    let result = data.words.join( data.sep || '' );

    // send the original data, merged with the result
    this.send(serviceName, data, { result: result });

    // store the number of microservice calls in the cache (to demo the cache)
    this.getCache( 'join-call-counter' ).then( (count) => {
      this.setCache( 'join-call-counter', (count || 0) + 1, 2 ); // just 2 secs
    });

  });

});

// Capitalize a list of words
rediservice.service('text.caps', function(serviceName, opts) {

  this.on( serviceName, { words: true, result: false }, (data) => {

    // transform the word list by uppercasing each word in turn
    let result = data.words.map( (word) => word.toUpperCase() );

    // send the original data, merged with the result and the word count
    this.send(serviceName, data, { result: result, count: result.length });

    // store the number of microservice calls in the cache (to demo the cache)
    this.getCache( 'caps-call-counter' ).then( (count) => {
      this.setCache( 'caps-call-counter', (count || 0) + 1, 2 ); // just 2 secs
    });

  });

});

module.exports = rediservice.exports();

// EOF
