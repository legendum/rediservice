'use strict';

const assert = require( 'chai' ).assert;

const textExample = require( '../../examples/text-service-example' );

describe( 'rediservice text service example', function () {

  let counters = {};

  before( (done) => {

    // first read the cache to see how many times we've called our microservices
    textExample.getCache( 'join-call-counter' ).then( (count) => {
      counters.join = count || 0;
    }).then( (ok) => textExample.getCache( 'caps-call-counter' ) ).then( (count) => {
      counters.caps = count || 0;
    }).then( (ok) => done() );

  });

  it( 'should export 2 services', function(done) {

    let services = textExample.services();

    assert.equal( 'function', typeof services['text.join'] );
    assert.equal( 'function', typeof services['text.caps'] );
    assert.equal( 2, Object.keys(services).length );

    done();
  });

  it( 'should cache some data (for use by services)', function (done) {

    textExample.setCache( 'some-random-id', ['hello', 'world'] );

    // callback style
    textExample.getCache( 'some-random-id', (err, words) => {
      assert.notOk( err );
      assert.deepEqual( ['hello', 'world'], words );

      // promise style
      textExample.getCache( 'some-random-id' ).then( (words) => {
        assert.deepEqual( ['hello', 'world'], words );

        done();
      });
    });
  });


  it( 'should join a list of words', function (done) {

    let serviceName = 'text.join';

    textExample.run( serviceName, { debug: true } );

    textExample.on( serviceName, { result: true }, (data) => {
      assert.equal( 'hello world', data.result );
      done();
    });

    setTimeout( () => {
      textExample.send( serviceName, { words: ['hello', 'world'], sep: ' ' } );
    }, 500);
  });


  it( 'should count the number of calls by using the cache', function (done) {

    textExample.getCache( 'join-call-counter' ).then( (count) => {
      assert.equal( counters.join + 1, count );
      done();
    }).catch( (err) => {
      console.error(err);
      done(err);
    });

  });


  it( 'should capitalize a list of words', function (done) {

    let serviceName = 'text.caps';

    textExample.run( serviceName, { debug: true } );

    textExample.on( serviceName, { result: true, count: true }, (data) => {
      assert.deepEqual( ['HELLO', 'WORLD'], data.result );
      assert.equal( 2, data.count );
      done();
    });

    setTimeout( () => {
      textExample.send( serviceName, { words: ['hello', 'world'] } );
    }, 500);
  });


  it( 'should count the number of calls by using the cache', function (done) {

    textExample.getCache( 'caps-call-counter' ).then( (count) => {
      assert.equal( counters.caps + 1, count );
      done();
    }).catch( (err) => {
      console.error(err);
      done(err);
    });

  });

});

// EOF
