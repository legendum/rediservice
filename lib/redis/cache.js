'use strict';

const JSON_PREFIX_MAGIC = '__json__:';

const DEFAULT_TTL_SECS = 86400; // a day

const redisClient = require('./client');
const serializer = require('./serializer');

function Cache( client ) {
  client = client || redisClient.create();

  this.get = (key, cb) => {
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
      ttl = DEFAULT_TTL_SECS;
    }

    client.set( key, serializer.serialize( value ) );

    if ( ttl > 0 ) {
      client.expire( key, ttl );
    }
  };

} // Cache

module.exports = {
  create: (client) => new Cache(client)
};

// EOF
