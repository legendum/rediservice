'use strict';

const JSON_PREFIX_MAGIC = '__json__:';

const DEFAULT_TTL_SECS = 86400; // a day

const redisClient = require('./client');
const serializer = require('./serializer');

function Cache( redisOpts ) {

  let client = null;

  this.get = (key, cb) => {
    client = client || redisClient.create( redisOpts );
    client.get( key, (err, value) => {
      if ( err ) { cb(err); }
      try {
        value = serializer.deserialize( value );
      } catch(e) {
        err = e;
      }
      cb( err, value );
    });
  };

  this.getPromise = (key) => {
    return new Promise( (resolve, reject) => {
      this.get(key, (err, value) => {
        if ( err ) { return reject( err ); }
        return resolve( value );
      });
    });
  };

  this.set = (key, value, ttl) => {
    if ( typeof ttl === 'undefined' ) {
      ttl = process.env.REDIS_CACHE_TTL || DEFAULT_TTL_SECS;
    }

    client = client || redisClient.create( redisOpts );
    client.set( key, serializer.serialize( value ) );

    if ( ttl > 0 ) {
      client.expire( key, ttl );
    }
  };

} // Cache

module.exports = {
  create: (redisOpts) => new Cache(redisOpts)
};

// EOF
