'use strict';

const redis = require('./redis');
const types = require('./types');

function Rediservice( servicesDSL ) {

  // allow Redis options to be passed instead of a DSL function for services
  let optionalRedisOpts = types.isObject(servicesDSL) ? servicesDSL : null,
      cache = redis.cache.create( optionalRedisOpts ),
      channels = redis.channels.create( optionalRedisOpts );

  // match a required "signature" to check if data values are present or absent
  function isMatch( data, match ) {
    for ( var k in match ) {
      let v = match[k];
      if ( v === true ) {
        if ( types.isNil( data[k] ) ) { return false; } // missing data value
      } else if ( v === false ) {
        if ( !types.isNil( data[k] ) ) { return false; } // existing data value
      } else {
        if ( data[k] !== v ) { return false; } // the data value doesn't match
      }
    }
    return true;
  }

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
  this.service = (serviceName, serviceDSL) => {

    let start = (opts) => { // e.g. opts could be {debug: true} for verbose logs

      opts = opts || {};

      // write debugging output, e.g. for testing
      if ( opts.debug ) {
        this.on( serviceName, (data) => console.log( JSON.stringify(data) ) );
      }

      // call the service's DSL, binding the function to this rediservice object
      serviceDSL.call( this, serviceName, opts );
    };

    this._services[serviceName] = start;
    return start;
  };

  this.types = types; // for all the type matching utility functions

  this.setup = (redisOpts) => {

    if ( types.isObject(redisOpts) ) {
      cache = redis.cache.create( redisOpts );
      channels = redis.channels.create( redisOpts );
    }

    if ( types.isFunction(servicesDSL) ) {
      servicesDSL.call( this, redisOpts );
    }

    return this;
  };

  this.exports = () => this;

} // Rediservice

module.exports = {
  create: (servicesDSL) => new Rediservice(servicesDSL)
};

// EOF
