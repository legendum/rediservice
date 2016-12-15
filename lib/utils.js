'use strict';

const hasType = (requiredType, value) => {
    let type = typeof value;
    if ( type === 'object' ) {
        if ( value === null ) { return 'null' === requiredType; }
        if ( Array.isArray(value) ) { return 'array' === requiredType; }
        if ( value instanceof Date ) { return 'date' === requiredType; }
    }
    return type === requiredType;
};

const notType = (requiredType, value) => {
  return hasType(requiredType, value) === false;
};

module.exports = { hasType, notType };

// EOF
