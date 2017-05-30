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

/*
According to MDN (HTMLElement.offsetParent), an element's offsetParent 
property will return null whenever it, or any of its parents, is hidden 
via the display style property. 
Just make sure that the element isn't fixed. A script to check this, 
if you have no 'position:fixed;' elements on your page, might look like:
*/

function isHidden(e) {
    return e.dataset.visible === "0"
}

function flipVisibilityForId (id, others) {
    hidefun = function (e) {
	e.style.visibility='hidden'
	e.style.height = 0
	e.dataset.visible = "0"
    }
    showfun = function (e) {
	e.style.visibility='visible'
	e.style.height = "auto"
	e.dataset.visible = "1"
    }
    var e = document.getElementById (id)
    if (e) {
	if (isHidden (e)) {
	    showfun (e)
	    if (others && others.length) {
		for (var i = 0; i < others.length; i ++) {
		    var o = document.getElementById (others [i])
		    if (o) hidefun (o)
		}
	    }
	} else
	    hidefun (e)
    } 
}

// Remove the bullet in front of each HL line
function change_dtElement (ddElt) {
    var e = ddElt.previousElementSibling
    if (e) e.innerHTML = ''
}

// Add a checkbox inside each dd element
function addCheckBox (ddElt, i) {
    var checked = i ? "" : ' checked="checked"'
    var html ='<input type="radio" id="cb_selecthl_' +
	(i + 1) +
    '" class="sodad-hl-radio-class"' + checked + 
    ' name="hlselectbtn" class="sodad-hl-radio-class">' 

    ddElt.firstElementChild.insertAdjacentHTML ("afterbegin", html)
    
    var cb = ddElt.firstElementChild.firstElementChild
    cb.dataset.hlno = i + 1
}

function getHighlightsElementsForPii (pii) {
    var div = document.getElementById ("div-paper-"+pii)
    if (div) {
	var xs = div.querySelectorAll (".abstract.svAbstract.abstractHighlights dd")
	return xs
    }
    return []
}

function setRadioForPii (pii) {
    var f = function (ddElt, i) {
	var checked = i ? "" : ' checked="checked"'
	var html ='<input type="radio" id="cb_selecthl_' + pii + '_' +
	    (i + 1) +
	    '" class="sodad-hl-radio-class"' + checked + 
	    ' name="hlselectbtn_' + pii + '" class="sodad-hl-radio-class">' 
	
	ddElt.firstElementChild.insertAdjacentHTML ("afterbegin", html)
    
	var cb = ddElt.firstElementChild.firstElementChild
	cb.dataset.hlno = i + 1
    }
    var hls = getHighlightsElementsForPii (pii)
    for (var i = 0; i < hls.length; i ++) {
	change_dtElement (hls[i])
	f (hls[i], i)
    }
//    hls.forEach (change_dtElement)
//    hls.forEach (f)
}

function onEventSelect10BalanceFun (id1, id2) {
    return (function (evt) {
	var s1 = document.getElementById (id1)
	var s2 = document.getElementById (id2)
	if (s1 && s2) {
	    var t = evt.target
	    var compVal = (1 - parseFloat (t.value)).toFixed(1)
	    if (t === s1) 
		s2.value = compVal
	    else
		s1.value = compVal
	}
    })
}
