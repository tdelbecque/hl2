const http = require ('http')
const url = require ('url')
const xpath = require ('xpath')
const fun = require ('./functional')
const xmldom = require ('xmldom')
const lm = require ('./loadHL')

var headers={
    "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:51.0) Gecko/20100101 Firefox/51.0",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "accept-language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
//    "accept-encoding": "gzip, deflate",
    "dnt": "1",
    "connection": "keep-alive",
    "upgrade-insecure-requests": "1",
    "cache-control": "max-age=0"
}
var opt = {
    headers: headers,
    hostname: 'www.sciencedirect.com',
    path: '/science/article/pii/S0920586117300895'
}

function onResponse (response) {
    var body = ''
    response.on ('data', d => {body += d})
    response.on ('end',
		 () => {
		     console.log (body)
		 })}

var HLPaths = ["//*[contains(@class,'abstract')]//*[text()='Highlights']"]

var tell = (response, msg) => {
    response.writeHead(200, {'Content-Type': 'text/html'})
    response.end (`<!doctype = html>\n<body>${msg}</body>\n`)
}

extractPiiFromPath = path => {
    var m = path.match (/(S(?:\d|X){16})/)
    if (m) return m [1]
    return undefined
}

function createServer (loadMap={}, port=8081) {
    function appFun (request, response) {
	var parseUrl = url.parse (request.url)
	//console.log (JSON.stringify (parseUrl, null, 2))
	const pii = extractPiiFromPath (parseUrl.path)
	opt.path = `/science/article/pii/${pii}` // + parseUrl.path
	http.get (opt,
		  r => {
		      var body = ''
		      r.on ('data', d => body += d)
		      r.on ('end',
			    () => {
				var doc = new xmldom.DOMParser ().parseFromString (body)
				if (doc) {
				    let isPathFound = x => fun.isSomething (x) && (x.length > 0)
				    let es = xpath.select ("//*[contains(@class,'abstract')]", doc)
				    if (isPathFound (es)) {
					es = es.filter (x => isPathFound (xpath.select (".//*[text()='Highlights']", x)))
					if (es.length > 0) {
					    let e = es [0]
					    let tc = new xmldom.XMLSerializer ().serializeToString (e), m
					    let replacement = loadMap [pii]

					    if (replacement) {
						/*
						  if (m = tc.match (/&bull;|►/))
						  console.log (`Separator : ${m [0]}\n`)
						*/
						let marker = 'ZOB'
						tc = tc.replace (/&.+?;/g, '.*?').
						    replace (/\b/g, marker).
						    replace (/"/g, `"${marker}`). //").
						    replace (/►/g, `${marker}►${marker}`).
						    replace (/\(|\)|\[|\]/g, '.').
						    replace (/\s/g, '').replace (new RegExp (`(${marker})+`, 'gi'), '(\\s|(&.+?;)+)*')
						
						let re = new RegExp (tc, 'i')
						let m = body.match (re)
						if (m) body = body.replace (m [0], replacement)
						body = body.replace (/<script(?:.|\n)+?script>/gm, '').
//						body = body.replace (/^\s*SDM\..+/g, '').
						    replace (/<head>/,
							     '<head>\n<style type="text/css">\n' +
							     '.pred {' +
							     '  color: red;' +
							     '}\n' +
							     '.sub {' +
							     '  color: blue;' +
							     '}\n' +
							     '.obj {' +
							     '  color: green;' +
							     '}\n' +
							     '</style>'
							    )
						
						console.log ('FOUND')
					    } else {
						console.log ('NOT FOUND')
					    }
					    response.writeHead(200, {'Content-Type': 'text/html'})
					    response.end (body)
					    
					    return
					}
				    }
				    //				    tell (response, 'NO HL')
				    //				    return
				}
				//				tell (response, 'Cannot parse')
				response.writeHead(200, {'Content-Type': 'text/html'})
				response.end (body)
			    })
		  })
    }
    http.createServer (appFun).listen (port)
}

lm.loadMap ('../hl.xml').
    then (dic => {
	console.log ('Map loaded, starting the server\n')
	createServer (dic)
    }).
    catch (e => console.error (e))
