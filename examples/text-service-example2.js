'use strict';

// This example shows the "DSL style" of service definition, where the services
// and the message handlers are defined inside the Rediservice "create" method.

// This style is encouraged because it's easier to read and allows Redis config
// parameters to be passed when calling the "setup" method (see the test file
// at test/examples/text-service-example2.test.js for a great example of this).

module.exports = require( '../lib/rediservice' ).create( function() {

  // Join a list of words
  this.service( 'text2.join', (serviceName, opts) => {

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
  this.service('text2.caps', (serviceName, opts) => {

    this.on( serviceName, { words: true, result: false }, (data) => {

      if ( this.types.isArray( data.words ) ) {

        // transform the word list by uppercasing each word in turn
        let result = data.words.map( (word) => word.toUpperCase() );

        // send the original data, merged with the result and the word count
        this.send(serviceName, data, { result: result, count: result.length });
      }

    });

  });

});

// EOF
