'use strict';

const assert = require( 'chai' ).assert;

const rediservice = require( '../../lib/rediservice' )
                    .create( 'redis://localhost:6379' );

const textExample = require( '../../examples/text-service-example' );

describe( 'rediservice text service example', function () {

  it( 'should export 2 services', function(done) {

    let services = textExample.services();

    assert.equal('function', typeof services['text.join']);
    assert.equal('function', typeof services['text.caps']);
    assert.equal(2, Object.keys(services).length);

    done();
  });

  it( 'should join a list of words', function (done) {

    let service = 'text.join';

    textExample.run(service, { debug: true });

    rediservice.on(service, { result: true }, (data) => {
      assert.equal('hello world', data.result);
      done();
    });

    rediservice.send(service, { words: ['hello', 'world'], sep: ' ' });
  });


  it( 'should capitalize a list of words', function (done) {

    let service = 'text.caps';

    textExample.run(service, { debug: true });

    rediservice.on(service, { result: true }, (data) => {
      assert.deepEqual(['HELLO', 'WORLD'], data.result);
      done();
    });

    rediservice.send(service, { words: ['hello', 'world'] });
  });

});

// EOF
