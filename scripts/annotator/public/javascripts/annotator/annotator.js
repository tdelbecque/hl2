window.SODAD = {
    msg: {},
    messageHandlers: {},
    send: function () {
	console.error ("WS not available")
    }
}

SODAD.init = function (whenInitialized) {
    SODAD.setws (whenInitialized)
}
SODAD.setws = function (whenConnected) {
    SODAD.socket = new WebSocket ("ws://" + location.host + "/ws")
    SODAD.socket.onopen = function () {
	SODAD.socket.onmessage = function (evt) {
	    var data = evt.data
	    var messageType = data.what
	    if (messageType) {
		var h = SODAD.messageHandlers [messageType]
		if (h) h (data)
	    } else {
		var e = document.getElementById("thediv")
		e.textContent = "ERROR : " + evt.data
	    }
	}
	SODAD.send = function (data) {
	    SODAD.socket.send (
		typeof data === 'string' ?
		    data :
		    JSON.stringify (data)
	    )
	}
	if (whenConnected) 
	    whenConnected ()
    }
}
