var https = require ('https')
var xmldom = require ('xmldom')
var xpath = require ('xpath')
var fs = require ('fs')

var undef

function queryOptions (pii, apikey, token) {
    return {
	hostname: 'api.elsevier.com',
	path:'/content/article/pii/' +
	    pii +
	    '?apiKey=' + apikey + '&instToken=' + token + '&httpAccept=text/xml',
	method: 'GET'
    }
}

function output (pii, hls) {
    var sep = ' • '
    var v = hls.join (sep).replace (/\n/g, ' ')
    process.stdout.write (pii + "\t" + sep + v + "\n")
}

function F () {
    var myself = this
    this.piis = []
    this.HL = {}

    this.APIKEY = process.env.KG_ELSAPI_APIKEY
    this.APITOKEN = process.env.KG_ELSAPI_TOKEN
    
    this.innerGet = function (pii) {
	var req = https.request (queryOptions (pii, myself.APIKEY, myself.APITOKEN),
				 function (res) {
				     var data = ''
				     res.on ('data', function (d) {
					 data = data + d
				     })
				     res.on ('end', function () {
					 var doc = new xmldom.DOMParser ().parseFromString (data)
					 var hl
					 var errmsg = ''
					 if (doc !== undef) {
					     var e = xpath.select ("/service-error", doc)
					     if (e.length > 0) {
						 e = xpath.select ("//statusText", doc)
						 if (e.length > 0)
						     errmsg = e [0].textContent
						 else {
						     process.stderr.write ('Service error')
						     process.exit ()
						 }
					     } else hl = (function () {
						 var e = xpath.select ("//*[local-name()='abstract' and @class='author-highlights']//*[local-name()='para']", doc)
						 if (e.length > 0) return e

						 e = xpath.select ("//*[local-name()='abstract' and @class='author-highlights']//*[local-name()='simple-para']", doc)
						 if (e.length > 0) return e

						 e = xpath.select ("//*[local-name()='abstract' and @class='graphical']//*[contains(text(),'ighlight')]/../*[local-name()='simple-para']", doc)
						 if (e.length > 0) return e

						 return undefined
					     })()
					     if (hl !== undefined) {
						 var hls = hl.map (function (x) {return x.textContent})
						 if (hls.length === 1) 
						     hls = hls [0].split (/\s*►\s*/).filter (function (x) {return x.length > 0})
						 //myself.HL [pii] = hls
						 process.stderr.write (`${pii}\tOK\n`)
						 output (pii, hls)
					     } else {
						 //myself.HL [pii] = []
						 process.stderr.write (`${pii}\tNOT OK`)
						 if (errmsg === '') output (pii, [])
						 else process.stderr.write (`\t${errmsg}`)
						 process.stderr.write ('\n')
					     }
					     
					 } else {
					     process.stderr.write (pii + ': cannot parse.')
					 }
					 var nextPii = myself.piis.shift ()
					 if (nextPii !== undef) myself.innerGet (nextPii)
					 else myself.whenFinished (myself.HL)
				     })
				 })

	req.on ('error', function (e) {
	    process.stderr.write (pii + ': ' + e)
	});

	req.end ();	
    }

    this.get = function (whenFinished) {
	var piisUniq = {}
	myself.piis.forEach (function (x) {piisUniq [x] = 1})
	myself.piis = Object.keys (piisUniq)
	myself.whenFinished = whenFinished;
	myself.innerGet (myself.piis.shift ())
    }

    this.testValid = function () {
	if (myself.APIKEY === undef)
	    return {
		isValid: false,
		errmsg: 'KG_ELSAPI_APIKEY environment variable is not defined'
	    }
	if (myself.APITOKEN === undef)
	    return {
		isValid: false,
		errmsg: 'KG_ELSAPI_TOKEN envoronment variable is not defined'
	    }
	return {isValid: true}
    }
}

F.prototype.setPiiListFromFile = function (path, excluded) {
    try {
	var x = fs.readFileSync (path).toString ()
	this.piis = x.match (/(S(?:X|\d){16})/g)
	if (this.piis === null) this.piis = []
    } catch (err) {
	process.stderr.write ('Unable to read file ' + path)
	throw err
    }
    if (excluded === undef) return
    
    try {
	x = fs.readFileSync (excluded).toString ()
	var excludedPiis = x.match (/(S(?:X|\d){16})/g)
	var excludedPiisSet = {}
	excludedPiis.forEach (function (x) {excludedPiisSet [x] = 1})
	this.piis = this.piis.filter (function (x) {return excludedPiisSet [x] === undef})
    } catch (err) {
	process.stderr.write ('Unable to read file ' + path)
	throw err
    }
}

module.exports = F

/*
  e = xpath.select ("//*[local-name()='abstract' and @class='graphical']//*[text()='Highlights']/../*[local-name()='simple-para']", doc)
  if (e.length > 0) return e
  
  e = xpath.select ("//*[local-name()='abstract' and @class='graphical']//*[text()='Research highlights']/../*[local-name()='simple-para']", doc)
  if (e.length > 0) return e
*/

