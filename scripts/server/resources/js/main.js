/*
function addForm () {
    var e = document.querySelector (".abstract.svAbstract.abstractHighlights")
    
    if (e) {
	var selectedHLContent = ''
	
	var f = document.createElement ("form")	
	f.id = "hlform"
	f.method="get"
	f.action="/querylong"
	f.target="_blank"
	e.parentNode.replaceChild (f, e)
	f.appendChild (e)
	
	var pExplanation = document.createElement ("p")
	pExplanation.textContent = "Please select the highlight that brings the more valuable information, then submit your choice with the button below."
	pExplanation.id = "hlExplanation"
	f.appendChild (pExplanation)
	
	var ctlDivElt = document.createElement ("div")
	ctlDivElt.className = "sodad-div-ctls-class"
	ctlDivElt.id = "sodad-div-ctls-id"

	f.appendChild (ctlDivElt)

	var label = document.createElement ("label")
	label ["for"] = "sodad-check-search-on-title-id"
	label.textContent = "Search on title"
	ctlDivElt.appendChild (label)
	
	var chkSearchOnTitle = document.createElement ("input")
	chkSearchOnTitle.type = "checkbox"
	chkSearchOnTitle.id = "sodad-check-search-on-title-id"
	chkSearchOnTitle.name = "search_on_title"
	chkSearchOnTitle.value = "1"
	chkSearchOnTitle.className = "sodad-div-ctls-ctl-class"
	chkSearchOnTitle.checked = true
	ctlDivElt.appendChild (chkSearchOnTitle)
	
	label = document.createElement ("label")
	label ["for"] = "sodad-check-search-on-selected-hl-id"
	label.textContent = "Search on selected highlight"
	ctlDivElt.appendChild (label)

	var chkSearchOnSelHL = document.createElement ("input")
	chkSearchOnSelHL.type = "checkbox"
	chkSearchOnSelHL.id = "sodad-check-search-on-selected-hl-id"
	chkSearchOnSelHL.name = "search_on_selected_hl"
	chkSearchOnSelHL.value = "1"
	chkSearchOnSelHL.className = "sodad-div-ctls-ctl-class"
	ctlDivElt.appendChild (chkSearchOnSelHL)
	
	var btnSubmit = document.createElement ("input")
	btnSubmit.type = "submit"
	btnSubmit.value = "Submit your selection"
	btnSubmit.className = "sodad-div-ctls-ctl-class sodad-btn-submit"
	ctlDivElt.appendChild (btnSubmit)
		
	var hiddenTitle = document.createElement ("input")
	hiddenTitle.type = "hidden"
	hiddenTitle.name = "papertitle"
	hiddenTitle.value = document.querySelectorAll ("head title")[0].textContent
	f.appendChild (hiddenTitle)

	var hiddenHL = document.createElement ("input")
	hiddenHL.type = "hidden"
	hiddenHL.name = "hl"
	hiddenHL.value = ''
	f.appendChild (hiddenHL)

	
	f.onchange = function (e) {
	    var t = e.target
	    if (t.className === "sodad-hl-radio-class" && t.checked) {
		hiddenHL.value = t.parentNode.textContent
	    }
	}
    }
}
*/
function getHighlightsElements () {
    var xs = document.querySelectorAll (".abstract.svAbstract.abstractHighlights dd")
    return xs
}


onLoad (function () {
    //addForm ()
    var hls = getHighlightsElements ()
    var i = 0
    for (i = 0; i < hls.length; i ++) {
	change_dtElement (hls[i])
	addCheckBox (hls[i], i)
    }
    //hls.forEach (change_dtElement)
    //hls.forEach (addCheckBox)
    var btns = document.getElementsByName ("hlselectbtn")
    for (i = 0; i < btns.length; i ++) {
	var e = btns[i]
	if (e.checked) 
	    document.getElementById ("sodad-controlform-hl-hidden-id").value = e.parentNode.textContent
    }	
/*	
    document.getElementsByName ("hlselectbtn").forEach (function (e) {
	if (e.checked) {
	    document.getElementById ("sodad-controlform-hl-hidden-id").value = e.parentNode.textContent
	}
    })
*/
})


