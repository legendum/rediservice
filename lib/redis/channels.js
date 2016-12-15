'use strict';

const redisClient = require('./client');
const serializer = require('./serializer');

var pubClients = {};
var subClients = {};

function Channels( client ) {
  client = client || redisClient.create();

  this.pub = (channel, message) => {
    let client = pubClients[channel] || redisClient.create();
    pubClients[channel] = client;

    client.publish( channel, serializer.serialize(message) );
  };

  this.sub = (channel, onMessage) => {
    let client = subClients[channel] || redisClient.create();
    subClients[channel] = client;

    client.on('message', (channel, message) => {

      try {
        message = serializer.deserialize( message );
      } catch(e) {
        message = {error: e};
      }

      onMessage( message, channel );
    });

    client.subscribe( channel );
  };

  this.unsub = (channel) => {
    let client = subClients[channel];
    if ( client ) {
      client.unsubscribe( channel );
      delete subClients[channel];
    }
  };

  this.unsubAll = () => {
    let channels = Object.keys( subClients );
    for ( var i = 0; i < channels.length; i++ ) {
      this.unsub( channels[i] );
    }
  };

  // clean up by unsubscribing from all channels
  process.on( 'cleanup', () => this.unsubAll() );
  process.on( 'exit', () => process.emit('cleanup') );

} // Channels

module.exports = {
  create: (client) => new Channels(client)
};

// EOF
