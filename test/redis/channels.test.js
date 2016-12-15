'use strict';

const assert = require( 'chai' ).assert;

const redis = require('../../lib/redis');
const client = redis.client.create( 'redis://localhost:6379' );
const channels = redis.channels.create( client );

describe( 'Redis channels', function () {

  let count = 0;

  it( 'should subscribe to 2 channels and receive 3 messages', function (done) {

    this.timeout(10000);

    let counter = () => {
      count++;
      if (count === 3) { done(); }
    };

    channels.sub('channel1', (message) => {
      if ( typeof message === 'string' ) {
        assert.equal('hello world', message);
      } else {
        assert.equal('world', message.hello);
      }
      counter();
    });

    channels.sub('channel2', (message) => {
      assert.equal('hola mundo', message);
      counter();
    });

    channels.pub('channel1', 'hello world');
    channels.pub('channel2', 'hola mundo');
    channels.pub('channel1', {hello: 'world'});

  } );

} );

// EOF
