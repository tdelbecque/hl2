// 13.3.2 @ DF
function onLoad (f) {
    if (onLoad.loaded) 
	window.setTimeOut (0, f);
    else if (window.addEventListener) 
	window.addEventListener ("load", f, false); // Modern & std
    else if (window.attachEvent)
	window.attachEvent ("onload", f) // IE8 & earlier
    else window.onload = f;
}
onLoad.loaded = false;

// 15.8.1 @ DF
function getScrollOffsets (w) {
    w = w || window;
    // All browsers but IE <= 8
    if (w.pageXOffset != null) return {x: w.pageXOffset, y: pageYOffset};
    // IE in std mode
    var d = w.document;
    if (document.compatMode == 'CSS1Compat')
	return {x: d.documentElement.scrollLeft, y: d.documentElement.scrollTop};
    // Quirk mode
    return {x: d.body.scrollLeft, y: d.body.scrollTop};
}

// 15.8.1 @ DF
function getViewportSize (w) {
    w = w || window;
    if (w.innerWidth != null) 
	return {w: w.innerWidth, h: w.innerHeight};
    var d = w.document;
    if (document.compatMode == "CSS1Compat") 
	return {w: d.documentElement.clientWidth, 
		h: d.documentElement.clientHeight};
    return {w: d.body.clientWidth, h: d.body.clientHeight};
}

function setMouseCapture (moveHandler, upHandler) {
    if (document.addEventListener) {
	document.addEventListener ("mousemove", moveHandler, true);
	document.addEventListener ("mouseup", upHandler, true);
    } else if (document.attachEvent) {
	elementToDrag.setCapture ();
	elementToDrag.attachEvent ("onmousemove", moveHandler);
	elementToDrag.attachEvent ("onmouseup", upHandler);
	elementToDrag.attachEvent ("onlosecapture", upHandler);
    }
}

function releaseMouseCapture (moveHandler, upHandler) {
    if (document.removeEventListener) {
	document.removeEventListener ("mouseup", upHandler, true);
	document.removeEventListener ("mousemove", moveHandler, true);
    } else if (document.detachEvent) {
	elementToDrag.detachEvent ("onlosecapture", upHandler);
	elementToDrag.detachEvent ("onmouseup", upHandler);
	elementToDrag.detachEvent ("onmousemove", moveHandler);
	elementToDrag.releaseCapture ();
    }
}

// 17.5 @ DF
function setDragable (elementToClick, elementToDrag) {
    elementToClick.onmousedown = function (e) {
	var scroll = getScrollOffsets ();
	var startX = e.clientX + scroll.x;
	var startY = e.clientY + scroll.y;
	var origX = elementToDrag.offsetLeft;
	var origY = elementToDrag.offsetTop;
	var deltaX = startX - origX;
	var deltaY = startY - origY;
	
	function moveHandler (e) {
	    e = e || window.event;
	    var scroll = getScrollOffsets ();
	    elementToDrag.style.left = (e.clientX + scroll.x - deltaX) + 'px';
	    elementToDrag.style.top = (e.clientY + scroll.y - deltaY) + 'px';
	    if (e.stopPropagation) e.stopPropagation ();
	    else e.cancelBubble = true;
	    
	}
	function upHandler (e) {
	    e = e || window.event;
	    releaseMouseCapture (moveHandler, upHandler);
	    if (e.stopPropagation) e.stopPropagation ();
	    else e.cancelBubble = true;
	}
	setMouseCapture (moveHandler, upHandler);
	if (e.stopPropagation) e.stopPropagation ();
	else e.cancelBubble = true;
	if (e.preventDefault) e.preventDefault ();
	else e.returnValue = false;
    }
}

// http://jsfiddle.net/briguy37/2MVFd/
function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

function zip (x) {
    var ret = []
    var n = x [Object.keys (x)[0]].length
    for (var i = 0; i < n; i ++) {
	var item = {}
	for (var k in x) 
	    item [k] = x [k][i]
	ret.push (item)
    }
    return ret
}


