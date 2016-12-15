'use strict';

const JSON_PREFIX_MAGIC = '__json__:';

function serialize(value) {
  if ( typeof value !== 'string') {
    value = JSON_PREFIX_MAGIC + JSON.stringify(value);
  }
  return value;
}

function deserialize(value) {
  if ( typeof value === 'string' ) {
    if ( value.substr(0, JSON_PREFIX_MAGIC.length) === JSON_PREFIX_MAGIC ) {
      value = JSON.parse( value.substr(JSON_PREFIX_MAGIC.length) );
    }
  }
  return value;
}

module.exports = { serialize, deserialize };

// EOF
