'use strict';

const assert = require( 'chai' ).assert;

const types = require( '../lib/types' );

describe( 'types', function () {

  it( 'should check some datatypes', function (done) {

    let undef,
        nil = null;

    assert.isTrue( types.isArray( [1,2,3] ) );
    assert.isTrue( types.isBoolean( true ) );
    assert.isTrue( types.isBoolean( false ) );
    assert.isTrue( types.isDate( new Date() ) );
    assert.isTrue( types.isFunction( () => 123 ) );
    assert.isTrue( types.isNil( nil ) );
    assert.isTrue( types.isNil( undef ) );
    assert.isTrue( types.isNull( nil ) );
    assert.isTrue( types.isNumber( 123 ) );
    assert.isTrue( types.isObject( {a: 1, b: 2} ) );
    assert.isTrue( types.isObject( this ) );
    assert.isTrue( types.isString( 'kevin' ) );
    assert.isTrue( types.isUndefined( undef ) );
    assert.isTrue( types.hasType( 'string', 'kevin' ) );
    assert.isTrue( types.notType( 'string', 123 ) );

    assert.isFalse( types.isArray( {a: 1, b: 2} ) );
    assert.isFalse( types.isBoolean( 1 ) );
    assert.isFalse( types.isBoolean( 0 ) );
    assert.isFalse( types.isDate( Date().now ) );
    assert.isFalse( types.isFunction( global ) );
    assert.isFalse( types.isNil( false ) );
    assert.isFalse( types.isNull( undef ) );
    assert.isFalse( types.isNumber( '123' ) );
    assert.isFalse( types.isObject( [1, 2] ) );
    assert.isFalse( types.isObject( nil ) );
    assert.isFalse( types.isString( 123 ) );
    assert.isFalse( types.isUndefined( nil ) );

    done();
  });

});

// EOF
