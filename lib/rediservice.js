'use strict';

const redis = require('./redis');
const types = require('./types');

function Rediservice( redisOpts ) {

  // match a required "signature" to check that data keys are present or absent
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

  let client = redis.client.create( redisOpts ),
      cache = redis.cache.create( client ),
      channels = redis.channels.create( client );

  this.on = (serviceName, match, handler) => {

    // allow an "on(serviceName, handler)" function signature
    if ( types.isFunction(match) ) {
      handler = match;
      match = {};
    }

    if ( types.isObject(match) === false ) {
      throw new Error(`"match" must be an object, not ${typeof match}`);
    }

    channels.sub(serviceName, (data) => {

      if ( types.isObject(data) === false ) {
        throw new Error(`"data" must be an object, not ${typeof data}`);
      }

      if ( isMatch(data, match) ) {
        handler(data);
      }
    });
  };

  this.send = (serviceName, data, newData) => {

    if ( types.isObject(data) === false ) {
      throw new Error(`"data" must be an object, not ${typeof data}`);
    }

    if ( types.isObject(newData) ) {
      data = Object.assign(data, newData);
    }

    channels.pub(serviceName, data);
  };

  this.setCache = (key, data, ttl) => {
    return cache.set(key, data, ttl);
  };

  this.getCache = (key, next) => {
    return types.isFunction(next) ? cache.get(key, next)
                                  : cache.getPromise(key);
  };

  this._services = {};
  this._running = {}; // so we don't start services more than once!

  this.running = () => this._running;

  // selector may either be a string or a regular expression
  // opts could be {debug: true} for verbose logs
  this.run = (selector, opts) => {
    let services = this.services(selector);
    for ( var serviceName in services ) {
      if ( opts.debug ) { console.log(`running service ${serviceName}`); }
      if ( this._running[serviceName] ) { continue; }
      services[serviceName](opts);
      this._running[serviceName] = true;
    }
  };

  // selector may either be a string or a regular expression
  this.services = (selector) => {
    let found = {};
    for ( var serviceName in this._services ) {
      if ( selector && !serviceName.match(selector) ) { continue; }
      found[serviceName] = this._services[serviceName];
    }
    return found;
  };

  // serviceName is a string, e.g. "text.join" or "text.caps" in the examples
  this.service = (serviceName, callDSL) => {

    let start = (opts) => { // e.g. opts could be {debug: true} for verbose logs

      opts = opts || {};

      // write debugging output, e.g. for testing
      if ( opts.debug ) {
        this.on( serviceName, (data) => console.log( JSON.stringify(data) ) );
      }

      // call the service's DSL, binding the function to this rediservice object
      callDSL.call( this, serviceName, opts );
    };

    this._services[serviceName] = start;
    return start;
  };

  this.types = types; // for all the type matching utility functions

  // call "exports" after all services have been defined - see examples folder
  this.exports = () => this;

} // Rediservice

module.exports = {
  create: (redisOpts) => new Rediservice(redisOpts)
};

// EOF
