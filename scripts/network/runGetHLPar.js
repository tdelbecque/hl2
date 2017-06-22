const PII_File = process.argv [2]
const pageSaveDir = process.argv [3]
var nAgents = 8

if (PII_File === undefined) {
    var fn = __filename.replace (process.cwd(), '.')
    process.stderr.write ("\nusage: node " + fn + 
			  " argument [pageSaveDir]\n")
    process.stderr.write ("where argument is either some list of pii, or a path to a pii file\n")
    process.stderr.write ("For example:\n")
    process.stderr.write ("\tnode " + fn + ' "S0961953411005964;S0379711212000185"\nor\n')
    process.stderr.write ("\tnode " + fn + " foo.txt\n")
    process.exit ()
}

var p = require ('./gethl')
var fs = require ('fs')

var f = new p (pageSaveDir)
if (! f.testValid().isValid)
    throw "ERR INITIALIZE"

f.piis = PII_File.match (/(S(?:X|\d){16})/g)
if (f.piis === null) 
    f.setPiiListFromFile (PII_File)

function whenFinished (x) {
    return
}

for (var i = 0; i < nAgents; i ++) 
    (function (piis) {
	var g = new p (pageSaveDir);
	g.piis = piis.filter (function (x, j) {return j % nAgents === i})
	if (g.piis.length > 0)
	    g.get (whenFinished)
    }) (f.piis)


