'use strict';

const redis = require('./redis');
const utils = require('./utils');

function Rediservice( redisURL, redisOpts ) {

  function isMatch( data, match ) {
    for ( var k in match ) {
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

  this.on = (serviceName, match, handler) => {

    // allow an "on(serviceName, handler)" function signature
    if ( typeof match === 'function' ) {
      handler = match;
      match = {};
    }

    if ( utils.notType('object', match) ) {
      throw new Error(`"match" must be an object, not ${typeof match}`);
    }

    channels.sub(serviceName, (data) => {

      if ( utils.notType('object', data) ) {
        throw new Error(`"data" must be an object, not ${typeof data}`);
      }

      if ( isMatch(data, match) ) {
        handler(data);
      }
    });
  };

  this.send = (serviceName, data, newData) => {

    if ( utils.notType('object', data) ) {
      throw new Error(`"data" must be an object, not ${typeof data}`);
    }

    if ( utils.hasType('object', newData) ) {
      data = Object.assign(data, newData);
    }

    channels.pub(serviceName, data);
  };

  this.setCache = (key, data, ttl) => {
    return cache.set(key, data, ttl);
  };

  this.getCache = (key, next) => {
    return typeof next === 'function' ? cache.get(key, next)
                                      : cache.getPromise(key);
  };

  this._services = {};
  this._running = {}; // so we don't start services more than once!
  this._exports = {

    // selector may either be a string or a regular expression
    // opts could be {debug: true} for verbose logs
    run: (selector, opts) => {
      let services = this._exports.services(selector);
      for ( var serviceName in services ) {
        if ( opts.debug ) { console.log(`running service ${serviceName}`); }
        if ( this._running[serviceName] ) { continue; }
        services[serviceName](opts);
        this._running[serviceName] = true;
      }
    },

    // selector may either be a string or a regular expression
    services: (selector) => {
      let found = {};
      for ( var serviceName in this._services ) {
        if ( selector && !serviceName.match(selector) ) { continue; }
        found[serviceName] = this._services[serviceName];
      }
      return found;
    }

  };

  // serviceName is a string, e.g. "text.caps"
  this.service = (serviceName, callDSL) => {

    let start = (opts) => { // e.g. opts could be {debug: true} for verbose logs

      opts = opts || {};

      // write debugging output, e.g. for testing
      if ( opts.debug ) {
        this.on(serviceName, (data) => console.log( JSON.stringify(data) ) );
      }

      // now call the service's DSL
      callDSL( serviceName, opts );
    };

    this._services[serviceName] = start;
    return start;
  };

  // call "exports" after all services have been defined - see examples folder
  this.exports = () => this._exports; // export our 'run' and 'services' methods

} // Rediservice

module.exports = {
  create: (redisURL, redisOpts) => new Rediservice(redisURL, redisOpts)
};

// EOF
