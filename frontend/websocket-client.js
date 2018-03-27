const getWebsocket = function(endpoint) {
	return new Promise(function(resolve, reject) {
		let handlers = new Map();

		const sendInternalEvent = event => {
			const handler = handlers.get('ewseb');
			if (handler) {
				handler(event);
			}
		};

		// if user is running mozilla then use it's built-in WebSocket
		window.WebSocket = window.WebSocket || window.MozWebSocket;

		console.log('Opening websocket');
		let connection = new WebSocket(`ws://${location.host}${endpoint}`);

		setInterval(function() {
			if (connection.readyState !== 1) {
				connection = new WebSocket(`ws://${location.host}${endpoint}`);
				connection.onopen = function() {
					sendInternalEvent({type: 'connect', message: 'Websocket connection reopened.'});
				};
				connection.onerror = function(e) {
					// Backend is gone..
					sendInternalEvent({type: 'error', message: 'Could not connect.', 'error': e});
				};
				connection.onmessage = handleMessage;
			}
		}, 500);

		const send = function(type, data) {
			const event = {
				type: type,
				data: data
			};

			if (connection.readyState === 1) {
				connection.send(JSON.stringify(event));
			} else {
				// Connection is closed?
				sendInternalEvent({type: 'error', message: 'Websocket connection closed. Message dropped.'});
				connection = new WebSocket(`ws://${location.host}${endpoint}`);
				connection.onopen = function() {
					sendInternalEvent({type: 'connect', message: 'Websocket connection reopened.'});
				};
				connection.onerror = function(e) {
					// Backend is gone..
					sendInternalEvent({type: 'error', message: 'Could not connect.', 'error': e});
				};
				connection.onmessage = handleMessage;
			}
		};

		const handleMessage = function(message) {
			try {
				let event = JSON.parse(message.data);
				const handler = handlers.get(event.type);
				if (handler) {
					handler(event.data);
				}
			} catch (e) {
				console.log('Error while receiving websocket data', e);
				sendInternalEvent({type: 'error', message: 'Error while receiving websocket data', 'error': e});
			}
		};

		connection.onopen = function() {
			console.log('Websocket connection opened.');
			resolve({
				on: function(type, callback) {
					handlers.set(type, callback);
				},
				send: function(type, data) {
					send(type, data);
				}
			});
		};

		connection.onerror = function(error) {
			console.log('Websocket could not be opened', error);
			reject();
		};

		connection.onmessage = handleMessage;
	});
};
