'use strict';

const assert = require( 'chai' ).assert;

const rediservice = require( '../lib/rediservice' ).create();

describe( 'rediservice', function () {

  it( 'should cache some data', function (done) {

    rediservice.setCache( 'author', { name: 'Kevin', age: 45 }, 2); // secs

    rediservice.getCache( 'author').then( (data) => {

      assert.equal( 'Kevin', data.name );
      assert.equal( 45, data.age );

    }).then( () => {

      rediservice.getCache( 'author', (err, data) => {

        assert.isNull( err );
        assert.equal( 'Kevin', data.name );
        assert.equal( 45, data.age );

        done();
      });

    });

  });

  it( 'should handle uncached data', function (done) {

    rediservice.getCache( 'missing' ).then( (data) => {
      assert.isNull( data );
      done();
    });

  });

  it( 'should check some datatypes', function (done) {

    let undef,
        nil = null;

    assert.isTrue( rediservice.types.isArray( [1,2,3] ) );
    assert.isTrue( rediservice.types.isDate( new Date() ) );
    assert.isTrue( rediservice.types.isFunction( () => 123 ) );
    assert.isTrue( rediservice.types.isNull( nil ) );
    assert.isTrue( rediservice.types.isNumber( 123 ) );
    assert.isTrue( rediservice.types.isObject( {a: 1, b: 2} ) );
    assert.isTrue( rediservice.types.isObject( this ) );
    assert.isTrue( rediservice.types.isString( 'kevin' ) );
    assert.isTrue( rediservice.types.isUndefined( undef ) );
    assert.isTrue( rediservice.types.hasType( 'string', 'kevin' ) );
    assert.isTrue( rediservice.types.notType( 'string', 123 ) );

    done();
  });

});

// EOF
