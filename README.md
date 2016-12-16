# rediservice

Simple microservices with Redis pub/sub and caching

## How it works - an example

### 1. Install and run Redis


### 2. Create two "text" microservices with Rediservice

Here, we'll create a microservice called "text.join" to join a list of words together and set a `result` value, and also a microservice called "text.caps" to capitalize a list of words, and return the new list together with a word count.

```
'use strict';

const rediservice = require( '../lib/rediservice' )
                    .create( 'redis://localhost:6379' );

// 'text.join' - Join a list of words
rediservice.service('text.join', (service, opts) => {

  // when there are words, but no result...
  rediservice.on(service, {words: true, result: false}, (data) => {

    // ...join words together using an optional separator
    let result = data.words.join( data.sep || '' );

    // ...then send the original data, merged with the result string
    rediservice.send(service, data, { result: result });
  });
});

// 'text.caps' - Capitalize a list of words
rediservice.service('text.caps', (service, opts) => {

  // when there are words, but no result...
  rediservice.on(service, {words: true, result: false}, (data) => {

    // ...capitalize each word in the list
    let result = [];
    for (var i = 0; i < data.words.length; i++) {
      result.push( data.words[i].toUpperCase() );
    }

    // ...then send the original data, merged with the result list
    rediservice.send(service, data, { result: result, count: result.count });
  });
});

module.exports = rediservice.exports();
```

(In the example above, the choice of `result` as the key was arbitrary.)

### 3. Test the two microservices

```
'use strict';

const assert = require( 'chai' ).assert;

const rediservice = require( '../../lib/rediservice' ).create();

const textExample = require( './text-example-services' ); // (the code above)

describe( 'rediservice text example services', function () {

  it( 'should join a list of words', function (done) {

    let serviceName = 'text.join';

    textExample.run(serviceName, { debug: true });

    rediservice.on(serviceName, { result: true }, (data) => {
      assert.equal('hello world', data.result);
      done();
    });

    rediservice.send(serviceName, { words: ['hello', 'world'], sep: ' ' });
  });

  it( 'should capitalize a list of words', function (done) {

    let serviceName = 'text.caps';

    textExample.run(serviceName, { debug: true });

    rediservice.on(serviceName, { result: true, count: true }, (data) => {
      assert.deepEqual(['HELLO', 'WORLD'], data.result);
      assert.equal(2, data.count);
      done();
    });

    rediservice.send(serviceName, { words: ['hello', 'world'] });
  });

});
```

### 4. How to cache data with Rediservice

Sometimes, microservices need to operate on data that is best stored in a cache.
 To enable this, `rediservice` provides `setCache` and `getCache` methods:

```
'use strict';

const assert = require( 'chai' ).assert;

const rediservice = require( '../lib/rediservice' )
                    .create( 'redis://localhost:6379' );

// set an arbirary cache key/value pair...
rediservice.setCache( 'some-key-id', { arbitrary: [ 'data', { here: 123 } ] } );

// get the value from the cache...
rediservice.getCache( 'some-key-id' ).then( (data) => {

  ...then check it's what we expect it to be
  assert.deepEqual( [ 'data', { here: 123 } ], data.arbirary ); 

});
```

Note that the default TTL for caching is 1 day, but you can override that by passing a third argument to `setCache` - the TTL integer value in seconds.

## What else can Rediservice do?

Rediservice is designed to be very small, fast and reliable, so currently no extra capabilities are included. I encourage you to write new NPM packages that leverage Rediservice to add the features you need. The API is stable at version 2, so you don't need to worry about breaking changes breaking your module(s) in the future. This module *only* relies on the very excellent "redis" module: https://www.npmjs.com/package/redis

## OK, so show me the code!

Here's Rediservice - at just 106 SLOC: [lib/rediservice.js](lib/rediservice.js)

And for the example code, see [examples/text-service-example.js](examples/text-service-example.js) and [test/examples/text-service-example.test.js](test/examples/text-service-example.test.js)

## Author

Please email kevin.hutchinson@legendum.com with queries and suggestions. Thanks!
