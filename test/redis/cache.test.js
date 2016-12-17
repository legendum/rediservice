'use strict';

const assert = require( 'chai' ).assert;

const redis = require('../../lib/redis');
const cache = redis.cache.create();

describe( 'Redis cache', function () {

  it( 'should not get a missing key value pair', function (done) {

    cache.get('blah', (err, value) => {
      assert.isNotOk( err, 'no error message' );
      assert.isNotOk( value, 'no value found' );
      done();
    });

  } );

  it( 'should set and get a key value pair for strings', function (done) {

    cache.set('kevin', 'programmer');
    
    cache.getPromise('kevin').then( (value) => {
      assert.equal('programmer', value);
      done();
    });

  } );

  it( 'should set and get a key value pair for objects', function (done) {

    cache.set('kevin', {age: 45, profession: 'programmer'});
    
    cache.getPromise('kevin').then( (value) => {
      assert.equal(45, value.age);
      assert.equal('programmer', value.profession);
      done();
    });

  } );

  it( 'should not set and get an expired key value pair', function (done) {

    this.timeout(5000);

    cache.set('location', 'mexico', 1);
    
    cache.getPromise('location').then( (value) => {
      assert.equal('mexico', value);
    });

    setTimeout( () => {
      cache.getPromise('location').then( (value) => {
        assert.isNotOk(value);
        done();
      });
    }, 2000);

  } );

} );

// EOF
