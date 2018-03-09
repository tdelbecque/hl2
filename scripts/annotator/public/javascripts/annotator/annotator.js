window.SODAD = {
    msg: {},
    messageHandlers: {},
    send: function () {
	console.error ("WS not available")
    }
}

SODAD.init = function (options) {
    SODAD.setws (options)
}
SODAD.setws = function (options) {
    SODAD.socket = new WebSocket ("ws://" + location.host + "/ws")
    SODAD.socket.onopen = function () {
	SODAD.socket.onmessage = function (evt) {
	    try {
	      var data = JSON.parse (evt.data)
	      var messageType = data.what
	      if (messageType) {
		var h = SODAD.messageHandlers [messageType]
		if (h) h (data)
	      } else {
		if (options.onError)
		    options.onError ("Message type missing in " + data)
	      }
            }
	    catch (e) {
		if (options.onError)
		    options.onError (e)
	    }
	}
	SODAD.send = function (data) {
	    SODAD.socket.send (
		typeof data === 'string' ?
		    data :
		    JSON.stringify (data)
	    )
	}
	if (options.onWSOpen) options.onWSOpen ()
    }
}
