https = require ('https')

var undef

function queryOptions (dateLoaded, start, apikey, token) {
    var path = '/content/search/index:scidir/?apiKey=' + apikey +
	'&instToken=' + token + '&count=200&field=pii&httpAccept=application/json'

    var query = '&query=dateloaded(' + dateLoaded + ')'
    var startQuery = '&start=' + start
    return {
	headers : {
	    "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:51.0) Gecko/20100101 Firefox/51.0"
	},
	"user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:51.0) Gecko/20100101 Firefox/51.0",
	hostname: 'api.elsevier.com',
	path:path + query + startQuery,
	method: 'GET'
    }
}

function whenPageLoaded (data, whenFinished) {
    var x = JSON.parse (data)
    if (x ["service-error"] !== undef) {
	process.stderr.write (x ["service-error"]["status"]["statusText"] + "\n")
	whenFinished (this.piis)
	return
    }
    var sr = x ['search-results']
    var totalResults = parseInt (sr ['opensearch:totalResults'])
    var newStart = 0
    if (totalResults > 0) {
	var piis = sr.entry.map (function (x) {
	    var p = x ["prism:url"].match (/S(?:X|\d){16}$/)
	    if (p !== null)
		return p [0]
	    return null
	}).filter (function (x) {return x !== null})
	this.piis = this.piis.concat (piis)
    
	var nEntries = sr.entry.length
	var startIndex = parseInt (sr ['opensearch:startIndex'])
	newStart = startIndex + nEntries;
    }
    if (newStart < totalResults) 
	this.innerGetPage (this.dateLoaded, newStart, whenFinished)
    else
	whenFinished (this.piis)
 }

function getPage (dateLoaded, start, whenFinished) {
    var myself = this
    console.error (JSON.stringify (queryOptions (dateLoaded, start, this.apikey, this.token)))
    var req = https.request(queryOptions (dateLoaded, start, this.apikey, this.token),
			    function (res)  {
				var data = ''
				res.on ('data', function (d) {
				    data = data + d
				})
				res.on ('end', function () {
				    myself.whenPageLoaded (data, whenFinished)
				})
			    })

    req.on('socket', function (socket) {
	socket.setTimeout(60000);  
	socket.on('timeout', function() {
	    req.abort ()
	    myself.innerGetPage (dateLoaded, start, whenFinished)
	});
    });

    req.on ('error', function (e) {
	process.stderr.write (e + '\n')
    });

    req.end ();
}

function F (dateLoaded, apikey, token) {
    this.dateLoaded = dateLoaded
    this.piis = []
    this.apikey = apikey
    this.token = token
}

F.prototype.innerGetPage = getPage

F.prototype.getPage = function (whenFinished) {
    process.stderr.write ('getting : ' + this.dateLoaded + '\n')
    this.innerGetPage (this.dateLoaded, 0, whenFinished)
}

F.prototype.whenPageLoaded = whenPageLoaded

module.exports = F

