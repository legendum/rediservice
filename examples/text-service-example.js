'use strict';

const rediservice = require( '../lib/rediservice' ).create();

// Join a list of words
rediservice.service( 'text.join', function(serviceName, opts) {

  this.on( serviceName, { words: true, result: false }, (data) => {

    if ( this.types.isArray( data.words ) ) {

      // join the word list with an optional separator
      let result = data.words.join( data.sep || '' );

      // send the original data, merged with the result
      this.send(serviceName, data, { result: result });
    }

  });

});

// Capitalize a list of words
rediservice.service('text.caps', function(serviceName, opts) {

  this.on( serviceName, { words: true, result: false }, (data) => {

    if ( this.types.isArray( data.words ) ) {

      // transform the word list by uppercasing each word in turn
      let result = data.words.map( (word) => word.toUpperCase() );

      // send the original data, merged with the result and the word count
      this.send(serviceName, data, { result: result, count: result.length });
    }

  });

});

module.exports = rediservice.exports();

// EOF
