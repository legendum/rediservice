# rediservice

Simple microservices with Redis pub/sub and caching


## How it works - an example

### 1. Install and run Redis

Visit https://redis.io to download, install and run Redis on your machine.


### 2. Create two "text" microservices with Rediservice

Here, we'll create a microservice called "text.join" to join a list of words together and set a `result` value, and also a microservice called "text.caps" to capitalize a list of words, and return the new list together with a word count.

```javascript
'use strict';

const rediservice = require( 'rediservice' )
                    .create( 'redis://localhost:6379' );

// 'text.join' - Join a list of words
rediservice.service('text.join', (serviceName, opts) => {
  // NOTE: 'serviceName' is set to "text.join" for convenience

  // when there are words, but no result...
  rediservice.on(serviceName, {words: true, result: false}, (data) => {

    // ...join words together using an optional separator
    let result = data.words.join( data.sep || '' );

    // ...then send the original data, merged with the result string
    rediservice.send(serviceName, data, { result: result });
  });
});

// 'text.caps' - Capitalize a list of words
rediservice.service('text.caps', (serviceName, opts) => {
  // NOTE: 'serviceName' is set to "text.caps" for convenience

  // when there are words, but no result...
  rediservice.on(serviceName, {words: true, result: false}, (data) => {

    // ...capitalize each word in the list
    let result = data.words.map( (word) => word.toUpperCase() );

    // ...then send the original data, merged with the result list
    rediservice.send(serviceName, data, { result: result, count: result.length });
  });
});

// finally export 'run' and 'services' methods, to run and inspect the services 
module.exports = rediservice.exports();
```

In the examples above, the choice of `result` as the key was arbitrary. You can merge any keys and values you like with the returned data object (e.g. `count` in the second example).

Note that the `rediservice.exports()` call at the end of the file exports the following:

1. `run()` to run the microservices (in this case 'text.join' and 'text.caps')
2. `services()` to get an Object whose keys are service names and values are service functions
3. Each of the services - in this case 'text.join' and 'text.caps' (but you shouldn't need to call these directly)

Typically, you'll only need to call the `run` method to run the microservices.


### 3. Running the example microservices

```javascript
'use strict';

const textExample = require( './text-example-services' ); // (the code above)

textExample.run();
```

Yes, it's that simple. when `run` is called with no argument, all the services are run. When run is called with a String or RegExp argument, then only services that match the argument are run. The second form is useful for testing (see below).

### 4. Test the two microservices

Rediservice was designed to be easy to test.

By default Rediservice will use Redis database number 1. When Rediservice is run with `NODE_ENV=test` it uses Redis database number 2 instead. The default Redis database 0 is never used. You're welcome to override this behavior by setting `REDIS_DATABASE=3` for example.

If your Redis installation uses a password, then set `REDIS_PASSWORD=mysecret`.

If your Redis installation is running on a different machine or port, set `REDIS_URL=redis://myserver:1234` (replacing "myserver" with your server host or IP, and "1234" with whatever port you're using).

```javascript
'use strict';

const assert = require( 'chai' ).assert;

const textExample = require( './text-example-services' ); // (the code above)

describe( 'text example services', function () {

  it( 'should join a list of words', function (done) {

    let serviceName = 'text.join';

    // we use the optional "debug" flag to write verbose logging
    textExample.run(serviceName, { debug: true });

    rediservice.on(serviceName, { result: true }, (data) => {
      assert.equal('hello world', data.result);
      done();
    });

    rediservice.send(serviceName, { words: ['hello', 'world'], sep: ' ' });
  });

  it( 'should capitalize a list of words', function (done) {

    let serviceName = 'text.caps';

    // we use the optional "debug" flag to write verbose logging
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


### 5. How to cache data with Rediservice

Sometimes, microservices need to operate on data that is best stored in a cache.
 To enable this, `rediservice` provides `setCache` and `getCache` methods:

```javascript
'use strict';

const assert = require( 'chai' ).assert;

const rediservice = require( 'rediservice' )
                    .create( 'redis://localhost:6379' );

// set an arbirary cache key/value pair...
rediservice.setCache( 'some-key-id', { arbitrary: [ 'data', { here: 123 } ] } );

// get the value from the cache...
rediservice.getCache( 'some-key-id' ).then( (data) => {

  // ...then check it's what we expect it to be
  assert.deepEqual( [ 'data', { here: 123 } ], data.arbirary ); 

});
```

Note that the default TTL for caching is 1 day, but you can override that by passing a third argument to `setCache` - the TTL integer value in *seconds*, for example `rediservice.setCache('user123', {name: 'Kevin'}, 3600)` to set user details for an hour.


## What else can Rediservice do?

Rediservice is designed to be very small, fast and reliable, so currently no extra capabilities are included. I encourage you to write new NPM packages that leverage Rediservice to add the features you need. The API is stable at version 2, so you don't need to worry about breaking changes breaking your module(s) in the future. This module *only* relies on the very excellent "redis" module: https://www.npmjs.com/package/redis


## OK, so show me the code!

Here's Rediservice - at just 100 SLOC: [lib/rediservice.js](lib/rediservice.js)

And for the example code, see [examples/text-service-example.js](examples/text-service-example.js) and [test/examples/text-service-example.test.js](test/examples/text-service-example.test.js)


## Author

Please email kevin.hutchinson@legendum.com with queries and suggestions. Thanks!
