const express = require('express');

module.exports = function(app, frontendPath) {
	require('express-ws')(app);
	app.use(frontendPath, express.static('node_modules/express-ws-event-bus/frontend'));

	return endpoint => {
		return new Promise(function(resolve) {
			let handlers = new Map();
			let connections = [];

			app.ws(endpoint, function(connection) {

				// Every client opens a new connection.
				connections.push(connection);

				connection.on('message', function(message) {
					try {
						let event = JSON.parse(message);
						const handler = handlers.get(event.type);
						if (handler) {
							handler(event.data, connection);
						}
					} catch (e) {
						console.log('This doesn\'t look like a valid JSON: ', message, e);
					}
				});
			});

			resolve({
				on: function(type, callback) {
					handlers.set(type, callback);
				},
				send: function(type, data, client) {
					const event = {
						type: type,
						data: data
					};
					connections = connections.filter(conn => conn.readyState === 1);
					try {
						if (client) {
							client.send(JSON.stringify(event));
						} else {
							connections.forEach(conn => conn.send(JSON.stringify(event)));
						}
					} catch (e) {
						// Probably a connection was closed between the filter and the for each
						// Ignore.
					}
				},
				connections: function() {
					return connections.filter(conn => conn.readyState === 1);
				}
			});
		});
	};
};
