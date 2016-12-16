'use strict';

const rediservice = require( '../lib/rediservice' )
                    .create( 'redis://localhost:6379' );

// Join a list of words
rediservice.service('text.join', (service, opts) => {

  rediservice.on(service, {words: true, result: false}, (data) => {

    let result = data.words.join( data.sep || '' );

    rediservice.send(service, data, { result: result });
  });
});

// Capitalize a list of words
rediservice.service('text.caps', (service, opts) => {

  rediservice.on(service, {words: true, result: false}, (data) => {

    let result = data.words.map( (word) => word.toUpperCase() );

    rediservice.send(service, data, { result: result, count: result.length });
  });
});

module.exports = rediservice.exports();

// EOF
