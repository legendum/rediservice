'use strict';

const LIVE_DB = 1; // for development or production
const TEST_DB = 2; // for testing (so we cache data separately)
const REDIS_DB = process.env.NODE_ENV === 'test' ? TEST_DB : LIVE_DB;
const REDIS_URL = 'redis://localhost:6379';

const redis = require('redis');

function create( redisOpts ) {

  redisOpts = redisOpts || {};
  redisOpts.db = redisOpts.db || process.env.REDIS_DATABASE || REDIS_DB;
  redisOpts.password = redisOpts.password || process.env.REDIS_PASSWORD;
  redisOpts.prefix = redisOpts.prefix || process.env.REDIS_PREFIX;
  redisOpts.url = redisOpts.url || process.env.REDIS_URL || REDIS_URL;

  return redis.createClient( redisOpts );
}

module.exports = { create };

// EOF
