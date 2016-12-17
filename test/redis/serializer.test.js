'use strict';

const assert = require( 'chai' ).assert;

const serializer = require('../../lib/redis/serializer');

describe( 'Redis serializer', function () {

  it( 'should serialize and deserialize some data', function (done) {

    let data = [ { person: { name: 'Kevin', programmer: true } }, 45 ];

    let serialized = serializer.serialize( data );

    assert.isString( serialized );

    let deserialized = serializer.deserialize( serialized );

    assert.deepEqual( data, deserialized );

    done();
  } );

} );

// EOF
