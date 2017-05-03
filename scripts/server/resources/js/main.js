function addForm () {
    var e = document.querySelector (".abstract.svAbstract.abstractHighlights")
    if (e) {
	var f = document.createElement ("form")
	f.id = "hlform"
	f.method="get"
	f.action="/query"
	f.target="_blank"
	e.parentNode.replaceChild (f, e)
	f.appendChild (e)
	var pExplanation = document.createElement ("p")
	pExplanation.textContent = "Please select the highlight that brings the more valuable information, then submit your choice with the button below."
	pExplanation.id = "hlExplanation"
	f.appendChild (pExplanation)
	
	var btnSubmit = document.createElement ("input")
	btnSubmit.type = "submit"
	btnSubmit.value = "Submit your selection"
	f.appendChild (btnSubmit)
	var hiddenTitle = document.createElement ("input")
	hiddenTitle.type="hidden"
	hiddenTitle.name="papertitle"
	hiddenTitle.value = document.querySelectorAll ("head title")[0].textContent
	f.appendChild (hiddenTitle)
	f.onchange = function (e) {/*alert (e.target.dataset.hlno)*/}
    }
}

function getHighlightsElements () {
    var xs = document.querySelectorAll (".abstract.svAbstract.abstractHighlights dd")
    return xs
}

// Remove the bullet in front of each HL line
function change_dtElement (ddElt) {
    var e = ddElt.previousElementSibling
    if (e) e.innerHTML = ''
}

// Add a checkbox insde each dd element
function addCheckBox (ddElt, i) {
    var html ='<input type="radio" id="cb_selecthl_' +
	(i + 1) +
    '" name="hlselectbtn">'

    ddElt.firstElementChild.insertAdjacentHTML ("afterbegin", html)
    
    var cb = ddElt.firstElementChild.firstElementChild
    cb.dataset.hlno = i + 1
}

onLoad (function () {
    addForm ()
    var hls = getHighlightsElements ()
    hls.forEach (change_dtElement)
    hls.forEach (addCheckBox)
/*    
    if (hls) {
	var hls = hlElement.qu
	
	hls.forEach (function (e) {
	    var bulletElt = e.previousElementSibling
	    bulletElt.innerHTML = ''
	    var s = document.createElement ("span")
	    s.innerHTML = '<label><input type="checkbox">  </label>'
	    e.firstElementChild.insertBefore (s, e.firstElementChild.firstElementChild)
	})
    }
*/
})


