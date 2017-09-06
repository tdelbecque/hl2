const fs = require ('fs')
const http = require ('http')

const PII_File = process.argv [2]

if (PII_File === undefined) {
    let fn = __filename.replace (process.cwd (), '.')
    process.stderr.write ("\nusage: node " + fn + " (PII file)\n")
    process.exit ();
}

var PIIs

try {
    PIIs = fs.
	readFileSync (PII_File).
	toString ().
	match (/^[a-zA-Z0-9]+$/mg)
}
catch (err) {
    process.stderr.write ('Unable to read file ' + path)
    throw err
}

let downloadContent = {}

function foo (index) {
    process.stderr.write ('.')
    if (index >= PIIs.length) {
	process.stdout.write (`${JSON.stringify (downloadContent, null, 2)}\n`)
	return
    }
    const thePii = PIIs[index]
    const options = {
	hostname: '52.45.120.172',
	path: '/getHighlights?pii=' + thePii,
	headers: {
	    'Content-Type': 'application/json'
	}
    }

    var theData = ''

    const req = http.request (
	options,
	(res) => {
	    res.setEncoding('utf8');
	    res.on('data', (chunk) => {
		theData = theData + chunk
	    });
	    res.on('end', () => {
		try {
		    downloadContent[thePii] = JSON.parse (theData)
		}
		catch (err) {
		    downloadContent[thePii] = {error: err}
		}
		foo (index + 1)
	    });
	})

    req.on('error', (e) => {
	console.error(`problem with request: ${e.message}`)
	exit (-1)
    })
    
    req.end ()
}

foo (0)
