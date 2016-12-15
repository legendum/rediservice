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

    let result = [];
    for (var i = 0; i < data.words.length; i++) {
      result.push( data.words[i].toUpperCase() );
    }

    rediservice.send(service, data, { result: result });
  });
});

module.exports = rediservice.exports();

// EOF
