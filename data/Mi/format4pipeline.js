const fs = require ('fs')

const file = process.argv [2]

if (file === undefined) {
    let fn = __filename.replace (process.cwd (), '.')
    process.stderr.write ("\nusage: node " + fn + " (json file)\n")
    process.exit ();
}

const sep = ' • '
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

function format (pii, hls) {
    return pii + "\t" + sep + hls.map ( x => x.sentence ).join (sep)
}

process.stdout.write (Object.keys (data).
		      map ( k => format (k, data [k]) ).
		      join ("\n"))
process.stdout.write ("\n")
