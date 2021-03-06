const https = require ('https')
const xmldom = require ('xmldom')
const xpath = require ('xpath')
const fs = require ('fs')
const u = require ('../utils/utils')

function queryOptions (pii, apikey, token) {
    return {
	"user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:51.0) Gecko/20100101 Firefox/51.0",
	hostname: 'api.elsevier.com',
	path:'/content/article/pii/' +
	    pii +
	    '?apiKey=' + apikey + '&instToken=' + token + '&httpAccept=text/xml',
	method: 'GET'
    }
}

function output (pii, hls, data, dir) {
    var sep = ' • '
    var v = hls.join (sep).replace (/\n/g, ' ')
    process.stdout.write (pii + "\t" + sep + v + "\n")
    if (data) 
	fs.writeFile (`${dir}/${pii}.xml`,
		      data,
		      {encodng: 'utf8'},
		      err => {if (err) u.croak (err)})
}

function F (pageSaveDirectory) {
    var myself = this
    this.piis = []
    this.HL = {}

    this.APIKEY = process.env.KG_ELSAPI_APIKEY
    this.APITOKEN = process.env.KG_ELSAPI_TOKEN

    this.pageSaveDirectory = pageSaveDirectory || "/home/thierry/HL/data/out/pages-xml"
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
					 if (doc !== undefined) {
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
						 output (pii, hls, data, myself.pageSaveDirectory)
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
					 if (nextPii !== undefined) myself.innerGet (nextPii)
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
	if (myself.APIKEY === undefined)
	    return {
		isValid: false,
		errmsg: 'KG_ELSAPI_APIKEY environment variable is not defined'
	    }
	if (myself.APITOKEN === undefined)
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
    if (excluded === undefined) return
    
    try {
	x = fs.readFileSync (excluded).toString ()
	var excludedPiis = x.match (/(S(?:X|\d){16})/g)
	var excludedPiisSet = {}
	excludedPiis.forEach (function (x) {excludedPiisSet [x] = 1})
	this.piis = this.piis.filter (function (x) {return excludedPiisSet [x] === undefined})
    } catch (err) {
	process.stderr.write ('Unable to read file ' + path)
	throw err
    }
}

module.exports = F



