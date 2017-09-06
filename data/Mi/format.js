const fs = require ('fs')

const file = process.argv [2]

if (file === undefined) {
    let fn = __filename.replace (process.cwd (), '.')
    process.stderr.write ("\nusage: node " + fn + " (json file)\n")
    process.exit ();
}

var data
try {
    data = JSON.parse (fs.
		       readFileSync (file).
		       toString ())
}
catch (err) {
    console.error (err)
    exit (-1)
}

function output (pii, rank, data) {
    if (data.error === undefined)
	process.stdout.write (`${pii}\t${rank}\t${data.id}\t${data.prob}\t${data.sentence}\n`)
}

function format (pii, hls) {
    hls.forEach ( (x, i) => output (pii, i + 1, x) )
}

Object.keys (data).forEach ( k => format (k, data [k]) )
