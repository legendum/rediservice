'use strict';

const redis = require('./redis');
const utils = require('./utils');

function Rediservice( redisURL, redisOpts ) {

  function isMatch( data, match ) {
    for (var k in match) {
      let v = match[k];
      if ( v === true ) {
        if ( !data[k] ) { return false; } // missing data field
      } else if (v === false ) {
        if ( data[k] ) { return false; } // existing data field
      } else {
        if ( !data[k] || data[k] !== v ) { return false; } // missing data field or bad value
      }
    }
    return true;
  }

  let client = redis.client.create( redisURL, redisOpts ),
      cache = redis.cache.create( client ),
      channels = redis.channels.create( client );

  this.on = (klass, match, handler) => {

    // Allow an "on(klass, handler)" function signature
    if ( typeof match === 'function' ) {
      handler = match;
      match = {};
    }

    if ( utils.notType('object', match) ) {
      throw new Error(`"match" must be an object, not ${typeof match}`);
    }

    channels.sub(klass, (data) => {

      if ( utils.notType('object', data) ) {
        throw new Error(`"data" must be an object, not ${typeof data}`);
      }

      if ( isMatch(data, match) ) {
        handler(data);
      }
    });
  };

  this.send = (klass, data, newData) => {

    if ( utils.notType('object', data) ) {
      throw new Error(`"data" must be an object, not ${typeof data}`);
    }

    if ( utils.hasType('object', newData) ) {
      data = Object.assign(data, newData);
    }

    channels.pub(klass, data);
  };

  this.cache = (key, data, ttl) => {

    if ( typeof data === 'undefined' ) {
      return cache.getPromise(key);
    }

    if ( typeof data === 'function' ) {
      return cache.get(key, data);
    }

    return cache.set(key, data, ttl);
  };

  this._running = {};
  this._exports = {

    run: (selector, opts) => {
      let services =  this._exports.services(selector);
      for (var service in services) {
        if ( opts.debug ) { console.log(`running service ${service}`); }
        if ( this._running[service] ) { continue; }
        services[service](opts);
        this._running[service] = true;
      }
    },

    services: (selector) => {
      let found = {};
      for (var service in this._exports) {
        if ( service === 'run' || service === 'services' ) { continue; }
        if ( selector && !service.match(selector) ) { continue; }
        found[service] = this._exports[service];
      }
      return found;
    }

  };

  this.service = (service, cb) => {

    let start = (opts) => {

      opts = opts || {};

      if ( opts.debug ) {
        this.on(service, (data) => {
          console.log( JSON.stringify(data) );
        });
      }

      cb(service, opts);
    };

    this._exports[service] = start;
    return start;
  };

  this.exports = () => {
    return this._exports; // NOTE: we have special "run" and "services" methods
  };

} // Rediservice

module.exports = {
  create: (redisURL, redisOpts) => new Rediservice(redisURL, redisOpts)
};

// EOF
