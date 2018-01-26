express-ws-event-bus
--

Simplified auto-reconnecting two-way event bus between backend and frontend to be used with Express.

This library can be used to create a simplistic event bus between backend and frontend. The api for sending and handling events is
the same on both backend and frontend, making it easy for the developer.

An event consists of two elements, a type (string) and data (an object). Objects can be send using a simple send
command `socket.send('eventName', object)`. Events can be handled by simply registering
a listener `socket.on('eventName', callback)`.

Should the network connection be severed (the server shuts down for instance). The client will automatically try to reconnect after
every failed attempt. However the messages that could not be sent will be dropped.

Backend
--

To use the library with Express for NodeJS, require the module and invoke it with both the instantiated Express app and an endpoint where the
frontend files will be served from.
```javascript
const express = require('express'),
      app = express(),
      getWebsocket = require('express-ws-event-bus')(app, '/statics');
```

After that, a websocket endpoint can be created. To create a websocket endpoint, specify the url for the endpoint. A promise will be returned
that resolves to a socket. The socket contains two methods: _on_ and _send_.

Don't forget to listen to a port first.
```javascript
app.listen(8080);

getWebsocket('/ws').then(socket => {
	socket.on('person', function(person, client) {
		console.log('person received:', person);
	});
});
```
> The client parameter is optional and _can_ be used to target the specific client that sent the message.

To send an object back to a specific client.
```javascript
socket.send('person', person, client);
```

To send an object to all clients client.
```javascript
socket.send('person', person);
```
> This can obviously also be used if there is known to be only one client.

All code above can be summarized in this nifty oneliner.
```javascript
require('express-ws-event-bus')(app, '/statics')('/ws').then(socket => {
	socket.on('person', function(person, client) {
		console.log('person received:', person);
		socket.send('person', person, client);
	});
});
```

Frontend
--

On your web page, include the websocket client js library from the statics url that was specified when creating the getWebsocket method.
```html
<script src="statics/websocket-client.js"></script>
```

And use the library in your script to open the event bus to the backend on the specified endpoint. The API is exactly the same
as the API on the backend. The getWebsocket method will return a promise that resolves to a socket. This socket contains the same
methods as the NodeJS variant _on_  and _send_. The only difference is that here no specific client can be targeted, because all
objects will be send to the server.
```javascript
getWebsocket('/ws').then(socket => {
    socket.send('person', { name: 'John Doe' });
    
    socket.on('person', function(person) {
        console.log('person received:', person);
    });
});
```
