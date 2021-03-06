# rediservice [![Build Status](https://travis-ci.org/legendum/rediservice.svg)](http://travis-ci.org/legendum/rediservice)

Simple microservices with Redis pub/sub and caching.

## Microservice principles

1. Each microservice has a name, e.g. "text.join" or "text.caps" (see below)
2. Microservices send data messages that are objects with keys and values
3. A microservice has handlers to handle data matching particular "signatures"
4. Signatures may specify that a particular data key must be present or absent
5. Signatures may also specify that a particular data key has a particular value
6. A microservice _may_ listen to data messages sent by other microservices
7. A microservice _should not_ send data messags directly to other microservices
8. Exception to principle 7: an orchestrator microservice that routes messages
9. Microservices should be small, simple, independent and easily tested

Rediservice is designed to help you to achieve all these principles in your code.

## How it works - an example

### 1. Install and run Redis

Visit https://redis.io to download, install and run Redis on your machine.


### 2. Create two "text" microservices with Rediservice

Here, we'll create a microservice called "text.join" to join a list of words together and set a `result` value, and also a microservice called "text.caps" to capitalize a list of words, and return the new list together with a word count.

```javascript
'use strict';

module.exports = require( 'rediservice' ).create( function() {

  // 'text.join' - Join a list of words
  this.service( 'text.join', (serviceName, options) => {
    // NOTE: 'serviceName' is set to "text.join" for convenience

    // when there are words, but no result...
    this.on( serviceName, {words: true, result: false}, (data) => {

      if ( this.types.isArray( data.words ) ) {

        // ...join words together using an optional separator
        let result = data.words.join( data.sep || '' );

        // ...then send the original data, merged with the result string
        this.send( serviceName, data, { result: result } );
      }

    });
  });

  // 'text.caps' - Capitalize a list of words
  this.service( 'text.caps', (serviceName, options) => {
    // NOTE: 'serviceName' is set to "text.caps" for convenience

    // when there are words, but no result...
    this.on( serviceName, {words: true, result: false}, (data) => {

      if ( this.types.isArray( data.words ) ) {

        // ...capitalize each word in the list
        let result = data.words.map( (word) => word.toUpperCase() );

        // ...then send the original data, merged with the result list
        this.send( serviceName, data, { result: result, count: result.length } );
      }

    });
  });

});
```

In the examples above, the choice of `result` as the key was arbitrary. You can merge any keys and values you like with the returned data object (e.g. `count` in the second example).

The following methods are exported:

* `run(selector, options)` to run the microservices (in this case 'text.join' and 'text.caps')
* `running()` to get an Object whose keys are the service names that are running
* `service(serviceName, serviceDSL)` to define a new microservice using this DSL
* `services(selector)` to get an Object whose keys are service names and values are functions to start the services
* `on(serviceName, match, fn)` to handle messages that match data "signatures"
* `send(serviceName, data, newData)` to publish processed data to a microservice
* `setCache(key, data, ttl)` to set a value in the Redis cache
* `getCache(key)` to get a value from the Redis cache (as a Promise), or...
* `getCache(key, next)` to get a value from the Redis cache (as a callback)
* `setup(redisOpts)` to setup microservices by running the services DSL function
* `exports()` to return the Rediservice object having these methods


Relax! Typically, you'll just call the `setup()` method then the `run()` method to run the microservices. Parameters are optional, but some examples are included below as a demonstration.


### 3. Running the example microservices

Without parameters:

```javascript
require( './text-example-services' ).setup().run();
```

With some example parameters:

```javascript
const textExample = require( './text-example-services' ).setup({
  url: 'redis://localhost:6379',  // an optional Redis URL
  password: 'mysecret',           // an optional Redis password
  prefix: 'app1',                 // an optional Redis prefix for cached keys
  db: 3                           // an optional Redis database number
});

// Run only the "text" microservices
textExample.run(/^text/, {
  debug: true,                    // an optional debug flag for verbose logging
  custom: 'my value'              // an optional flag also passed into 'options'
});
```

Yes, it's that simple. When `run` is called with no first argument, all the services are run. When run is called with a String or RegExp first argument, then only services that match the argument are run. The second form is useful for testing (see below). A second argument allows you to pass options to the services that are being run, for example `{debug: true}` to enable verbose logging.

### 4. Test the two microservices

Rediservice was designed to be easy to test.

By default Rediservice will use Redis database number 1. When Rediservice is run with `NODE_ENV=test` it uses Redis database number 2 instead. The default Redis database 0 is never used. You're welcome to override this behavior by setting environment variable `REDIS_DATABASE=3` for example.

If your Redis installation uses a password, then set `REDIS_PASSWORD=mysecret`.

**If your Redis installation is running on a remote machine or non-standard port, set environment variable `REDIS_URL=redis://myserver:1234` (replacing "myserver" with your server host or IP, and "1234" with whatever port you're using). By default, Rediservice will run using Redis URL "redis://localhost:6379".**

```javascript
'use strict';

const assert = require( 'chai' ).assert;

const textExample = require( './text-example-services' ).setup(); // (the code above)

describe( 'text example services', function () {

  it( 'should join a list of words', function (done) {

    let serviceName = 'text.join';

    // we use the optional "debug" flag to write verbose logging
    textExample.run( serviceName, { debug: true } );

    textExample.on( serviceName, { result: true }, (data) => {
      assert.equal( 'hello world', data.result );
      done();
    });

    textExample.send( serviceName, { words: ['hello', 'world'], sep: ' ' } );
  });

  it( 'should capitalize a list of words', function (done) {

    let serviceName = 'text.caps';

    // we use the optional "debug" flag to write verbose logging
    textExample.run( serviceName, { debug: true } );

    textExample.on( serviceName, { result: true, count: true }, (data) => {
      assert.deepEqual( ['HELLO', 'WORLD'], data.result );
      assert.equal( 2, data.count );
      done();
    });

    textExample.send( serviceName, { words: ['hello', 'world'] } );
  });

});
```


### 5. How to cache data with Rediservice

Sometimes, microservices need to operate on data that is best stored in a cache.
 And coincidentally, this is something for which Redis is perfect. To enable caching with Redis, `rediservice` provides `setCache` and `getCache` methods:

```javascript
'use strict';

const assert = require( 'chai' ).assert;

const rediservice = require( 'rediservice' ).create();

// set an arbirary cache key/value pair...
rediservice.setCache( 'some-key-id', { arbitrary: [ 'data', { here: 123 } ] } );

// get the value from the cache...
rediservice.getCache( 'some-key-id' ).then( (data) => {

  // ...then check it's what we expect it to be
  assert.deepEqual( [ 'data', { here: 123 } ], data.arbitrary ); 

});
```

Note that the default TTL for caching is 1 day (86400 seconds), but you can override that by passing a third argument to `setCache` - the TTL integer value in *seconds*, for example `rediservice.setCache('user123', {name: 'Kevin'}, 3600)` to set user details for an hour. Alternatively, set the environment variable `REDIS_CACHE_TTL` to the number of seconds you require.

If you need to, you can set the environment variable `REDIS_PREFIX` to avoid potential key collisions with any other caching you're performing on the Redis server.


## What else can Rediservice do?

Rediservice is designed to be very small, fast and reliable, so currently no extra capabilities are included. I encourage you to write new NPM packages that leverage Rediservice to add the features you need. The API is stable at version 2, so you don't need to worry about changes breaking your module(s) in the future. This module *only* relies on the very excellent "redis" module: https://www.npmjs.com/package/redis

But there is one extra feature that could be useful called `rediservice.types`:

* `rediservice.types.isArray(value)` - return whether value is an array
* `rediservice.types.isBoolean(value)` - return whether value is boolean
* `rediservice.types.isDate(value)` - return whether value is a Date object
* `rediservice.types.isFunction(value)` - return whether value is a function
* `rediservice.types.isNil(value)` - return whether value is `null` or `undefined`
* `rediservice.types.isNull(value)` - return whether value is `null`
* `rediservice.types.isNumber(value)` - return whether value is a number
* `rediservice.types.isObject(value)` - return whether value is an object
* `rediservice.types.isString(value)` - return whether value is a string
* `rediservice.types.isUndefined(value)` - return whether value is undefined
* `rediservice.types.hasType(type, value)` - return whether value is of a type
* `rediservice.types.notType(type, value)` - return whether value is not a type

Often when writing microservices, you'll want to check whether a value has been set in the data object, *and* to confirm it's of the type that you require.

Inside your microservice definitions, you can replace `rediservice.types` with `this.types`, for example:

`if ( this.types.isArray( data.words ) ) { ...`

See the example code below.


## OK, so show me the code!

Here's Rediservice - at just 111 SLOC: [lib/rediservice.js](lib/rediservice.js)

And for the example code, see [examples/text-service-example.js](examples/text-service-example.js) and [test/examples/text-service-example.test.js](test/examples/text-service-example.test.js)


## Author

Please email kevin.hutchinson@legendum.com with queries and suggestions. Thanks!
