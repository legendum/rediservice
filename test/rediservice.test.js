'use strict';

const assert = require( 'chai' ).assert;

const rediservice = require( '../lib/rediservice' ).create();

describe( 'rediservice', function () {

  it( 'should cache some data', function (done) {

    rediservice.setCache('author', { name: 'Kevin', age: 45 }, 2); // secs

    rediservice.getCache('author').then( (data) => {

      assert.equal( 'Kevin', data.name );
      assert.equal( 45, data.age );

    }).then( () => {

      rediservice.getCache('author', (err, data) => {

        assert.isNull( err );
        assert.equal( 'Kevin', data.name );
        assert.equal( 45, data.age );

        done();
      });

    });

  });

  it( 'should handle uncached data', function (done) {

    rediservice.getCache('missing').then( (data) => {
      assert.isNull( data );
      done();
    });

  });

});

// EOF
