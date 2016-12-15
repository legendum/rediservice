'use strict';

const assert = require( 'chai' ).assert;

const redis = require('../../lib/redis');
const client = redis.client.create( 'redis://localhost:6379' );
const channels = redis.channels.create( client );

describe( 'Redis channels', function () {

  let count = 0;

  after( () => {
    channels.unsubAll();
  });

  it( 'should subscribe to 2 channels and receive 3 messages', function (done) {

    this.timeout(20000);

    let counter = () => {
      count++;
      if (count === 3) { done(); }
    };

    channels.sub('channel1', (message) => {
      if ( typeof message === 'string' ) {
        assert.equal('hello world', message);
      } else {
        assert.equal('object', typeof message);
        assert.equal('world', message.hello);
      }
      counter();
    });

    channels.sub('channel2', (message) => {
      assert.equal('hola mundo', message);
      counter();
    });

    setTimeout( () => channels.pub('channel1', 'hello world'), 300 );
    setTimeout( () => channels.pub('channel2', 'hola mundo'), 600 );
    setTimeout( () => channels.pub('channel1', {hello: 'world'}), 900 );

  } );

} );

// EOF
