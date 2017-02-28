var fs = require ('fs')

var undef

files = fs.readdirSync ('./HL/')
files.forEach (function (f) {
    var fn = 'HL/' + f
    try {
	fs.readFile (fn 
	x.match (/(S(?:X|\d){16})/g).forEach (function (p) {
	    process.stdout.write (p + '\n')
	})}
    catch (err) {
	process.stderr.write ('Unable to read file ' + fn)
	process.exit ()
    }
})

